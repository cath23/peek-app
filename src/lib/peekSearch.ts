import { TOPICS, TOPIC_CONVERSATIONS } from '@/data/topicData'

/**
 * Substring search across Peek's own content: topic titles, conversation
 * bodies, and resolution messages. Powers the launcher's "In Peek" results.
 */

export interface PeekSearchResult {
  kind: 'topic' | 'message' | 'resolution'
  topicId: string
  topicTitle: string
  /** Set for message/resolution hits - selecting opens this thread. */
  convId?: string
  authorName?: string
  snippet: string
}

function snippetAround(text: string, query: string, span = 76): string {
  const flat = text.replace(/\s+/g, ' ')
  const idx = flat.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return flat.slice(0, span)
  const start = Math.max(0, idx - Math.floor((span - query.length) / 2))
  const end = Math.min(flat.length, start + span)
  return `${start > 0 ? '...' : ''}${flat.slice(start, end).trim()}${end < flat.length ? '...' : ''}`
}

export function searchPeek(query: string, limit = 4): PeekSearchResult[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const results: PeekSearchResult[] = []

  for (const topic of TOPICS) {
    if (topic.title.toLowerCase().includes(q)) {
      results.push({ kind: 'topic', topicId: topic.id, topicTitle: topic.title, snippet: topic.title })
    }
  }

  for (const topic of TOPICS) {
    const groups = TOPIC_CONVERSATIONS[topic.id] ?? []
    for (const group of groups) {
      for (const conv of group.convs) {
        if (results.length >= limit * 2) break
        if (conv.resolutionMessage?.toLowerCase().includes(q)) {
          results.push({
            kind: 'resolution',
            topicId: topic.id,
            topicTitle: topic.title,
            convId: conv.id,
            authorName: conv.resolvedBy,
            snippet: snippetAround(conv.resolutionMessage, q),
          })
        } else if (conv.body.toLowerCase().includes(q)) {
          results.push({
            kind: 'message',
            topicId: topic.id,
            topicTitle: topic.title,
            convId: conv.id,
            authorName: conv.authorName,
            snippet: snippetAround(conv.body, q),
          })
        }
      }
    }
  }

  return results.slice(0, limit)
}
