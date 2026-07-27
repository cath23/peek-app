import type { Scenario } from './player'
import { MeetCall } from './scenes/MeetCall'
import { MeetEnded } from './scenes/MeetEnded'
import { PeekTopic } from './scenes/PeekTopic'

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: 'Highlights in Huddle',
    scenes: [
      {
        id: 'meet-call',
        steps: 1,
        render: () => <MeetCall />,
      },
      {
        id: 'meet-ended',
        steps: 2,
        render: (local) => <MeetEnded showHighlights={local >= 1} />,
      },
      {
        // The real app in an iframe — needs the Peek dev server running
        // (see STORYBOARD.md). Beats: arrived collapsed → zoom in + expand →
        // pull back out.
        id: 'peek-topic',
        steps: 3,
        render: (local) => <PeekTopic beat={local} />,
      },
    ],
  },
]
