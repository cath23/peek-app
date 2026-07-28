"""Per-frame motion analysis of the rendered film, measured against the beat
sheet the timeline claims to play. Same metric as the teardown script (mean
absolute change of a 160x90 greyscale frame, 0-100) but reported per beat, so a
"hold" that isn't actually still shows up."""
import sys
import cv2
import numpy as np

video = sys.argv[1]
FPS = 30.0

# What the timeline says it does (seconds) — from scenario1.tsx.
BEATS = [
    ("brand over blurred call",  0.00, 1.60),
    ("brand out + focus pull",   1.60, 2.60),
    ("cursor + punch (overlap)", 2.60, 3.50),
    ("genie pour",               3.62, 4.60),
    ("bar streaks in (overlap)", 4.35, 5.00),
    ("bar HOLD",                 5.00, 5.50),
    ("pop open",                 5.50, 6.10),
    ("converge: approach+creep", 5.85, 6.50),
    ("commit + land",            6.50, 7.20),
    ("docked READ",              7.20, 8.60),
    ("blur down + brand back",   8.60, 9.75),
    ("end HOLD",                 9.75, 11.10),
]

cap = cv2.VideoCapture(video)
series = []
prev = None
i = 0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    small = cv2.cvtColor(cv2.resize(frame, (160, 90)), cv2.COLOR_BGR2GRAY).astype("float32")
    if prev is not None:
        series.append(float(np.mean(np.abs(small - prev))) / 255.0 * 100.0)
    prev = small
    i += 1
cap.release()

print(f"frames={i} diffs={len(series)}\n")
print(f"{'beat':<20}{'in':>6}{'out':>7}{'f':>4}{'mean':>7}{'peak':>7}  reading")
print("-" * 74)
for name, a, b in BEATS:
    lo, hi = int(round(a * FPS)), int(round(b * FPS))
    vals = series[max(lo - 1, 0):hi - 1]
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
    flag = ""
    if "HOLD" in name and mean >= 0.15:
        flag = "  <-- NOT STILL"
    if "HOLD" not in name and mean < 0.15:
        flag = "  <-- barely moves"
    print(f"{name:<20}{a:>6.2f}{b:>7.2f}{hi-lo:>4}{mean:>7.2f}{peak:>7.2f}  {reading}{flag}")

# Contiguous runs of real movement, to compare against the intended durations.
print("\nmeasured moves (runs of mean-change > 0.35):")
MOV = 0.35
run = None
for idx, v in enumerate(series):
    t = (idx + 1) / FPS
    if v > MOV and run is None:
        run = [t, t, v]
    elif v > MOV:
        run[1], run[2] = t, max(run[2], v)
    elif run is not None:
        if run[1] - run[0] >= 2 / FPS:
            print(f"  {run[0]:5.2f}s -> {run[1]:5.2f}s  {round((run[1]-run[0])*FPS):>3}f  peak {run[2]:6.2f}")
        run = None
if run and run[1] - run[0] >= 2 / FPS:
    print(f"  {run[0]:5.2f}s -> {run[1]:5.2f}s  {round((run[1]-run[0])*FPS):>3}f  peak {run[2]:6.2f}")

# Longest genuinely still stretch — the eye needs somewhere to land.
best, cur = (0, 0.0), None
for idx, v in enumerate(series):
    if v < 0.15:
        cur = cur or idx
    else:
        if cur is not None and idx - cur > best[0]:
            best = (idx - cur, cur / FPS)
        cur = None
if cur is not None and len(series) - cur > best[0]:
    best = (len(series) - cur, cur / FPS)
print(f"\nlongest still stretch: {best[0]}f ({best[0]/FPS:.2f}s) starting at {best[1]:.2f}s")
