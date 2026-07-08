import type { ConvGroup } from './topicData'
import type { Person } from './peopleData'
import figmaIcon from '@/assets/figma icon.svg'
import linearIcon from '@/assets/linear icon.svg'
import githubIcon from '@/assets/github icon.svg'

/**
 * Agents are AI workers from connected apps that you can DM like a person.
 * They are Person-shaped so the existing chip input / avatar / row components
 * work unchanged - the "avatar" is the app icon (a logo, never a face).
 *
 * dmId lives in its own 20+ range so it never collides with DMS (1-7) or
 * TEAMS (10-15) on the People page.
 */
export interface Agent extends Person {
  dmId: number
}

export const AGENTS: Agent[] = [
  { id: 'agent-linear', dmId: 20, name: 'Linear', role: 'Issues & cycles agent', avatarSrc: linearIcon },
  { id: 'agent-figma',  dmId: 21, name: 'Figma',  role: 'Files & frames agent',  avatarSrc: figmaIcon },
  { id: 'agent-github', dmId: 22, name: 'GitHub', role: 'PRs & reviews agent',   avatarSrc: githubIcon },
]

export const AGENT_DM_IDS = new Set(AGENTS.map((a) => a.dmId))

export function agentByDmId(dmId: number): Agent | undefined {
  return AGENTS.find((a) => a.dmId === dmId)
}

/**
 * Seed conversations for agent DMs. Same content rule as everywhere else in
 * Peek: every conversation card is a thread opener started by You; the agent's
 * answers live in the thread (see REPLIES entries in replyData.ts). Agents
 * never mark anything urgent and a human always resolves.
 * Figma (21) is intentionally left empty to demo the "start fresh" state.
 */
export const AGENT_DM_CONVERSATIONS: Record<number, ConvGroup[]> = {
  // Linear agent
  20: [
    {
      dateLabel: 'Yesterday',
      convs: [
        {
          id: 'agent20_c1',
          authorName: 'You',
          timestamp: '8:55 AM',
          body: 'Where do we stand on Cycle 14? Anything at risk before Friday?',
          replyCount: 3,
          isResolved: true,
          resolvedBy: 'You',
          resolutionMessage: 'PEEK-238 moved to Cycle 15, the rest is on track for Friday.',
        },
      ],
    },
  ],

  // GitHub agent
  22: [
    {
      dateLabel: 'Today',
      convs: [
        {
          id: 'agent22_c1',
          authorName: 'You',
          timestamp: '7:40 AM',
          body: "What's the state of the release branch after last night's merges?",
          replyCount: 1,
        },
      ],
    },
  ],
}

/**
 * Runtime group conversations with multiple agents. Module-level so they
 * survive page switches within a session (same lifetime as other runtime
 * prototype state; a browser refresh clears them).
 */
export interface AgentGroup {
  dmId: number
  name: string
  memberNames: string[]
}

export const AGENT_GROUPS: AgentGroup[] = []

let nextGroupId = 2000

export function findAgentGroupByMembers(memberNames: string[]): AgentGroup | undefined {
  const key = [...memberNames].sort().join('|')
  return AGENT_GROUPS.find((g) => [...g.memberNames].sort().join('|') === key)
}

export function createAgentGroup(members: Agent[]): AgentGroup {
  const memberNames = members.map((m) => m.name)
  const existing = findAgentGroupByMembers(memberNames)
  if (existing) return existing
  const group: AgentGroup = {
    dmId: nextGroupId++,
    name: memberNames.join(', '),
    memberNames,
  }
  AGENT_GROUPS.push(group)
  return group
}

export function agentGroupByDmId(dmId: number): AgentGroup | undefined {
  return AGENT_GROUPS.find((g) => g.dmId === dmId)
}
