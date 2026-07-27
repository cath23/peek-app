/**
 * Demo mode — the recording rig, not a product feature.
 *
 * The scenario player (`demo-scenarios/`, see its STORYBOARD.md) embeds the
 * REAL app in an iframe for the Peek beats of a scenario. `?demo=1` makes
 * that embed deterministic:
 *   - data comes from the static fixtures with the scenario overlay in
 *     `./scenario1` on top. Demo mode reports no Convex deployment, so the
 *     embed needs no login and no live backend while recording;
 *   - the viewer wears the scenario protagonist's portrait;
 *   - `./demoBridge` accepts postMessage commands from the player.
 *
 * The flag is read once at module load, so it survives in-app navigation
 * that drops the query string. Nothing here does anything in a normal
 * session — a build without the flag behaves exactly as before.
 */

function readFlag(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('demo') === '1'
}

export const demoMode = readFlag()
