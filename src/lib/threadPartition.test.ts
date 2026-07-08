import { describe, it, expect } from 'vitest'
import { partitionRepliesAroundPromotion } from './threadPartition'
import type { ReplyData } from '@/data/replyData'

const reply = (id: string, opts: Partial<ReplyData> = {}): ReplyData => ({
  id,
  authorName: 'You',
  timestamp: '12:00 PM',
  body: id,
  ...opts,
})

describe('partitionRepliesAroundPromotion', () => {
  it('with no promotion (promotedAtMs undefined): merges all replies above, below empty', () => {
    const replies = [reply('static_1'), reply('static_2')]
    const sentReplies = [reply('sent_1', { createdAtMs: 100 })]
    const out = partitionRepliesAroundPromotion({ replies, sentReplies, promotedAtMs: undefined })
    expect(out.above.map((r) => r.id)).toEqual(['static_1', 'static_2', 'sent_1'])
    expect(out.below).toEqual([])
  })

  it('with promotion + 0 sentReplies: replies above, below empty', () => {
    const replies = [reply('static_1')]
    const out = partitionRepliesAroundPromotion({ replies, sentReplies: [], promotedAtMs: 1000 })
    expect(out.above.map((r) => r.id)).toEqual(['static_1'])
    expect(out.below).toEqual([])
  })

  it('sentReply with createdAtMs < promotedAtMs goes above', () => {
    const sentReplies = [reply('pre', { createdAtMs: 500 })]
    const out = partitionRepliesAroundPromotion({ replies: [], sentReplies, promotedAtMs: 1000 })
    expect(out.above.map((r) => r.id)).toEqual(['pre'])
    expect(out.below).toEqual([])
  })

  it('sentReply with createdAtMs >= promotedAtMs goes below', () => {
    const sentReplies = [reply('post', { createdAtMs: 1500 })]
    const out = partitionRepliesAroundPromotion({ replies: [], sentReplies, promotedAtMs: 1000 })
    expect(out.above).toEqual([])
    expect(out.below.map((r) => r.id)).toEqual(['post'])
  })

  it('sentReply with createdAtMs === promotedAtMs goes below (boundary)', () => {
    const sentReplies = [reply('boundary', { createdAtMs: 1000 })]
    const out = partitionRepliesAroundPromotion({ replies: [], sentReplies, promotedAtMs: 1000 })
    expect(out.below.map((r) => r.id)).toEqual(['boundary'])
  })

  it('sentReply without createdAtMs is treated as pre-promotion (defensive)', () => {
    const sentReplies = [reply('legacy')] // no createdAtMs
    const out = partitionRepliesAroundPromotion({ replies: [], sentReplies, promotedAtMs: 1000 })
    expect(out.above.map((r) => r.id)).toEqual(['legacy'])
    expect(out.below).toEqual([])
  })

  it('mixed pre and post replies are split correctly with original order preserved within each side', () => {
    const replies = [reply('static_1'), reply('static_2')]
    const sentReplies = [
      reply('pre_a', { createdAtMs: 100 }),
      reply('post_a', { createdAtMs: 1500 }),
      reply('pre_b', { createdAtMs: 500 }),
      reply('post_b', { createdAtMs: 2000 }),
    ]
    const out = partitionRepliesAroundPromotion({ replies, sentReplies, promotedAtMs: 1000 })
    expect(out.above.map((r) => r.id)).toEqual(['static_1', 'static_2', 'pre_a', 'pre_b'])
    expect(out.below.map((r) => r.id)).toEqual(['post_a', 'post_b'])
  })

  it('empty inputs produce empty above + empty below', () => {
    const out = partitionRepliesAroundPromotion({ replies: [], sentReplies: [], promotedAtMs: 1000 })
    expect(out.above).toEqual([])
    expect(out.below).toEqual([])
  })
})
