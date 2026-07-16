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
import { TOPICS as MOCK_TOPICS } from '@/data/topicData'
import { setMentionNames } from '@/lib/textParsing'
import { useCurrentUser } from './currentUser'
import { usePeople } from './people'
import { useTopics } from './topics'
import type { Person, Topic } from './types'

/** Suggestion list — the other workspace people (you don't @mention yourself). */
let directory: Person[] = MOCK_PEOPLE

/** Read by the Tiptap suggestion plugins when a popup opens. */
export function mentionPeople(): Person[] {
  return directory
}

/** Suggestion list for the `[` topic-reference command — same pattern. */
let topicDirectory: Topic[] = MOCK_TOPICS

/** Read by the `[` Tiptap suggestion plugin when its popup opens. */
export function mentionTopics(): Topic[] {
  return topicDirectory
}

/** Seam-internal: mounted by PeekDataProvider inside TopicStoreProvider
 *  (useTopics needs the store). Renders nothing. */
export function TopicDirectorySync() {
  const topics = useTopics()
  useEffect(() => {
    topicDirectory = topics ?? MOCK_TOPICS
  }, [topics])
  return null
}

/** Seam-internal: mounted by PeekDataProvider. Renders nothing. */
export function MentionDirectorySync() {
  const people = usePeople()
  const me = useCurrentUser()
  useEffect(() => {
    directory = people ?? MOCK_PEOPLE
    // The body renderer matches mentions by name, so it needs the FULL cast —
    // including the viewer's own name, or a mention OF you renders as plain
    // text in your view while everyone else sees a chip (issue #10). The
    // suggestion list stays "other people" (above); only the render names
    // include you.
    const names = directory.map((p) => p.name)
    if (me?.name) names.push(me.name)
    setMentionNames(names)
  }, [people, me])
  return null
}
