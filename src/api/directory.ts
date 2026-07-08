/**
 * DM directory — which DM conversations exist and who they're with.
 *
 * Consolidates the DM_NAMES / DMS lists previously hardcoded in DeskPage
 * and PeoplePage. Phase 2 replaces this with a `dmConversations` query;
 * the numeric ids die there too (domain model §2.4).
 */

export interface DmDirectoryEntry {
  dmId: number
  name: string
}

export const DM_DIRECTORY: DmDirectoryEntry[] = [
  { dmId: 1, name: 'Alice Johnson' },
  { dmId: 2, name: 'Daniel Stanton' },
  { dmId: 3, name: 'Hallie Pratt' },
  { dmId: 4, name: 'Greg Bothman' },
  { dmId: 5, name: 'Juan Foley' },
  { dmId: 6, name: 'Amie Miles' },
  { dmId: 7, name: 'Zack Bright' },
]

export function dmNameById(dmId: number): string | undefined {
  return DM_DIRECTORY.find((d) => d.dmId === dmId)?.name
}
