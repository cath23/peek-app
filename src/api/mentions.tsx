/**
 * The @mention directory.
 *
 * The Tiptap suggestion plugins (`@name`, `!@name`) aren't React components,
 * so they can't read a hook. They read this module-level snapshot instead,
 * which `MentionDirectorySync` keeps in step with the real workspace people.
 *
 * Default = the mock PEOPLE, so Storybook/tests and the no-backend demo keep
 * suggesting the sample cast exactly as before.
 */
import { useEffect } from 'react'
import { PEOPLE as MOCK_PEOPLE } from '@/data/peopleData'
import { setMentionNames } from '@/lib/textParsing'
import { usePeople } from './people'
import type { Person } from './types'

let directory: Person[] = MOCK_PEOPLE

/** Read by the Tiptap suggestion plugins when a popup opens. */
export function mentionPeople(): Person[] {
  return directory
}

/** Seam-internal: mounted by PeekDataProvider. Renders nothing. */
export function MentionDirectorySync() {
  const people = usePeople()
  useEffect(() => {
    directory = people ?? MOCK_PEOPLE
    // The body renderer matches mentions by name, so it needs the same list —
    // otherwise a real teammate's @mention renders as plain text.
    setMentionNames(directory.map((p) => p.name))
  }, [people])
  return null
}
