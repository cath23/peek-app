#!/usr/bin/env python3
"""
teardown.py -- quantitative frame-by-frame analysis of a product/launch video.

Measures what the eye can't count reliably: exact shot durations, cut positions,
transition lengths in frames, and motion intensity per shot. Extracts viewable
keyframes so a still-image reader can inspect composition and typography.

Usage:
    python3 teardown.py VIDEO [--outdir DIR] [--threshold 0.25] [--burst 6]

Outputs into DIR (default: ./teardown_out):
    timing.md          human/agent-readable timing sheet
    shots/shot_NN.jpg  one representative frame per shot
    cuts/cut_NN_*.jpg  frame burst around each cut (for measuring transitions)
"""

import argparse
import json
import os
import re
import subprocess
import sys


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(video):
    """Return fps, duration, width, height."""
    r = run([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=r_frame_rate,width,height,nb_frames",
        "-show_entries", "format=duration",
        "-of", "json", video,
    ])
    if r.returncode != 0:
        sys.exit(f"ffprobe failed: {r.stderr.strip()}")
    data = json.loads(r.stdout)
    st = data["streams"][0]
    num, den = st["r_frame_rate"].split("/")
    fps = float(num) / float(den) if float(den) else 0.0
    return {
        "fps": fps,
        "duration": float(data["format"]["duration"]),
        "width": st.get("width"),
        "height": st.get("height"),
    }


def detect_cuts(video, threshold):
    """Return list of cut timestamps in seconds."""
    r = run([
        "ffmpeg", "-hide_banner", "-i", video,
        "-filter:v", f"select='gt(scene,{threshold})',metadata=print:file=-",
        "-an", "-f", "null", "-",
    ])
    blob = r.stdout + r.stderr
    times = []
    for m in re.finditer(r"pts_time:([0-9.]+)", blob):
        t = float(m.group(1))
        if not times or t - times[-1] > 0.08:   # de-dupe near-identical hits
            times.append(t)
    return times


def motion_series(video, fps):
    """
    Mean absolute pixel change between consecutive frames, 0-100 scale.

    Uses real frame differencing rather than ffmpeg's scene score, because
    scene score is tuned to spot hard discontinuities and reads a smooth
    slow zoom as almost nothing -- which is exactly the movement we care
    about measuring in a product video.
    """
    try:
        import cv2
        import numpy as np
    except ImportError:
        return []

    cap = cv2.VideoCapture(video)
    pairs = []
    prev = None
    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        small = cv2.cvtColor(cv2.resize(frame, (160, 90)), cv2.COLOR_BGR2GRAY)
        small = small.astype("float32")
        if prev is not None:
            diff = float(np.mean(np.abs(small - prev))) / 255.0 * 100.0
            pairs.append((idx / fps, diff))
        prev = small
        idx += 1
    cap.release()
    return pairs


def grab(video, ts, path, width=1280):
    run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-ss", f"{max(ts, 0):.4f}", "-i", video,
        "-frames:v", "1", "-vf", f"scale={width}:-2", "-q:v", "3", path,
    ])


def classify(dur):
    if dur < 0.8:
        return "flash / accent"
    if dur < 1.6:
        return "snap beat"
    if dur <= 3.2:
        return "standard beat"
    if dur <= 5.0:
        return "long hold"
    return "very long -- likely needs cutting"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--outdir", default="teardown_out")
    ap.add_argument("--threshold", type=float, default=0.25,
                    help="scene-change sensitivity; lower finds softer transitions")
    ap.add_argument("--burst", type=int, default=6,
                    help="frames to extract on each side of a cut")
    args = ap.parse_args()

    if not os.path.isfile(args.video):
        sys.exit(f"not found: {args.video}")

    info = probe(args.video)
    fps = info["fps"] or 30.0
    frame = 1.0 / fps

    os.makedirs(os.path.join(args.outdir, "shots"), exist_ok=True)
    os.makedirs(os.path.join(args.outdir, "cuts"), exist_ok=True)

    cuts = [t for t in detect_cuts(args.video, args.threshold) if t > 0.05]
    bounds = [0.0] + cuts + [info["duration"]]
    shots = [(bounds[i], bounds[i + 1]) for i in range(len(bounds) - 1)
             if bounds[i + 1] - bounds[i] > 0.05]

    motion = motion_series(args.video, fps)

    # representative frame per shot
    for i, (a, b) in enumerate(shots, 1):
        grab(args.video, a + (b - a) / 2, os.path.join(args.outdir, "shots", f"shot_{i:02d}.jpg"))

    # frame burst around each cut, for measuring transition length by eye
    for i, t in enumerate(cuts, 1):
        for k in range(-args.burst, args.burst + 1):
            ts = t + k * frame
            if ts < 0 or ts > info["duration"]:
                continue
            tag = f"{k:+03d}".replace("+", "p").replace("-", "m")
            grab(args.video, ts,
                 os.path.join(args.outdir, "cuts", f"cut_{i:02d}_{tag}.jpg"), width=960)

    # timing sheet
    lines = []
    lines.append(f"# Teardown: {os.path.basename(args.video)}\n")
    lines.append(f"- **Resolution** {info['width']}x{info['height']}")
    lines.append(f"- **Frame rate** {fps:.3f} fps  (1 frame = {frame*1000:.1f} ms)")
    lines.append(f"- **Duration** {info['duration']:.2f}s")
    lines.append(f"- **Shots detected** {len(shots)}")
    if shots:
        avg = sum(b - a for a, b in shots) / len(shots)
        lines.append(f"- **Average shot length** {avg:.2f}s")
    lines.append("")

    lines.append("## Shot list\n")
    lines.append("| # | In | Out | Duration | Frames | Character | Frame |")
    lines.append("|---|----|-----|----------|--------|-----------|-------|")
    for i, (a, b) in enumerate(shots, 1):
        d = b - a
        lines.append(f"| {i} | {a:.2f}s | {b:.2f}s | {d:.2f}s | "
                     f"{round(d*fps)} | {classify(d)} | shots/shot_{i:02d}.jpg |")
    lines.append("")

    if cuts:
        lines.append("## Cut points\n")
        lines.append("Inspect the frame bursts to count how many frames a transition "
                     "spans. A hard cut changes completely between two adjacent frames; "
                     "a dissolve or whip takes 6-16 frames.\n")
        lines.append("| Cut | Time | Frame # | Burst files |")
        lines.append("|-----|------|---------|-------------|")
        for i, t in enumerate(cuts, 1):
            lines.append(f"| {i} | {t:.3f}s | {round(t*fps)} | cuts/cut_{i:02d}_*.jpg |")
        lines.append("")

    if motion:
        lines.append("## Motion intensity per shot\n")
        lines.append("Mean per-frame change. High = camera moving or heavy animation. "
                     "Low = a hold. Good product videos alternate the two.\n")
        lines.append("| Shot | Mean | Peak | Reading |")
        lines.append("|------|------|------|---------|")
        for i, (a, b) in enumerate(shots, 1):
            # skip the first ~2 frames: they contain the cut discontinuity itself,
            # which would otherwise read as "motion" inside the new shot
            vals = [s for (t, s) in motion if a + 2 * frame <= t < b]
            if not vals:
                continue
            mean, peak = sum(vals) / len(vals), max(vals)
            if mean < 0.15:
                reading = "static hold"
            elif mean < 0.7:
                reading = "subtle drift / slow push"
            elif mean < 2.5:
                reading = "active motion"
            else:
                reading = "fast move or whip"
            lines.append(f"| {i} | {mean:.2f} | {peak:.2f} | {reading} |")
        lines.append("")

    path = os.path.join(args.outdir, "timing.md")
    with open(path, "w") as f:
        f.write("\n".join(lines))

    print(f"Wrote {path}")
    print(f"  {len(shots)} shots, {len(cuts)} cuts")
    print(f"  frames: {args.outdir}/shots/  and  {args.outdir}/cuts/")


if __name__ == "__main__":
    main()
