# Topics from DMs - Design Discussion

## The Concept

**Topics page**: A topic is a container of multiple conversations. Each conversation has replies. Conversations resolve individually. When all are resolved, the topic itself could be archived.

**DMs page**: Conversations live in a flat thread. But a user can "promote" a single conversation into a topic. That topic:
- Is private by default
- Appears in the Topics page sidebar
- Initially contains only the one conversation that was promoted
- Can grow with more conversations over time (added by others from the Topics page)

**The problem**: In the DM, the user only sees the original conversation and can reply to it. But if someone later adds more conversations to that topic from the Topics page, the DM user has no visibility into those. The topic lives in two places with different levels of access — full view in Topics, partial view in DMs. Visually, there's no clear indication in the DM that "this conversation is now part of a bigger topic with 3 other conversations you can't see here."

**My honest take**: The core tension is that you're linking two different mental models — a DM is a 1:1 space where I see everything, but a topic is a shared workspace that can grow beyond what I started. The moment a DM conversation becomes a topic, the DM becomes a stale portal to something that lives elsewhere.

A few directions to consider:

1. **Make the DM a read-only reference** — once promoted, the conversation in the DM becomes a pinned card (similar to the thread panel's pinned message) with a clear "View in Topics" link. No replying from DMs. This makes it obvious that the real conversation moved.

2. **Mirror the full topic in the DM** — show all conversations from that topic inline in the DM, even ones added later. But this blurs the line between DMs and Topics and creates a confusing "where do I reply?" situation.

3. **Keep current behavior but make the gap visible** — add a subtle indicator like "This conversation is part of topic 'X' — 3 more conversations there" so the user knows they're seeing a slice, not the whole picture.

Leaning toward option 1 — it's the cleanest mental model.

---

## The Visibility Problem

There is also confusion about visibility. A topic can be private or public. DMs are always private. If a topic was created from a DM as private and later turned into public with more people involved, what happens to the private conversation, the first one where the topic first started?

That's a real problem. The first conversation was written in a private DM context — the author's words were meant for one person. If the topic goes public, that original conversation is now exposed to a wider audience without the author's explicit consent. That's a trust violation.

A few ways to think about it:

1. **Detach on publish** — When a private topic goes public, the original DM conversation gets detached. The topic keeps a summary or reference ("This topic originated from a private conversation") but the actual content stays private. The topic starts fresh with the first public conversation.

2. **Require re-consent** — Before making the topic public, show the author of the original DM conversation a prompt: "This topic contains a private conversation. Making it public will make that conversation visible to everyone. Proceed?" This puts the decision in the right hands but adds friction.

3. **Copy, don't link** — When creating a topic from a DM, copy the conversation content rather than linking it. The DM version stays in the DM. The topic version is a separate entity. If the topic later goes public, only the topic copy is affected, and the author already chose to put it there.

4. **Private topics can never go public if they contain DM content** — simplest rule, but limits flexibility.

The deeper question is whether "create topic from DM" should even link back to the DM at all. The cleanest design might be: creating a topic from a DM simply **copies** that conversation as the first post in a new private topic. From that point on, the topic and the DM are independent. The DM shows a note like "You created a topic from this conversation" with a link, but they don't share state.

This avoids the visibility leak entirely and keeps the mental model simple — DMs are DMs, topics are topics, and "create topic" is just a convenient way to seed a topic with context from a DM.

---

## Timeline Integrity vs. Privacy

The issue is that a topic is a continuous flow of conversations and the user wants to see the timeline, the history of how it evolved, so the original DM is definitely part of the topic. The copy idea breaks timeline integrity.

The real constraint is: **the original DM conversation must live inside the topic as a first-class citizen, but it was created under a privacy assumption that may no longer hold.**

The answer is that the privacy boundary should be on the **conversation level**, not the topic level. A topic can be public, but individual conversations within it can retain their original visibility scope.

Concretely:

- The original DM conversation appears in the topic timeline, but is **visible only to the original participants**. Everyone else sees a placeholder: "Private conversation between You and Alice — started this topic" with the timestamp.
- All subsequent conversations added to the topic follow the topic's visibility (public or private).
- The original author could optionally choose to "make this conversation visible to the topic" — an explicit opt-in, not automatic.

This way:
- Timeline is intact — everyone sees that the topic started at a specific point
- Context is preserved for those who were part of it
- No privacy leak — the content stays scoped to its original audience
- The author retains control

The tricky UX part is making this feel natural and not confusing. The placeholder needs to feel like a natural part of the timeline, not a redacted document. Something like a collapsed card with the participants' avatars and "Private conversation that started this topic" reads more like context than censorship.

---

## Rethinking the Approach — Simplify the Mental Model

Honestly — the conversation-level privacy solution above is *correct*, but not necessarily *good* UX. The placeholder card is awkward — imagine joining a public topic and the first thing you see is "Private conversation between Alice and Bob — started this topic." You know context exists that you can't see. It feels like walking into a meeting where two people clearly talked beforehand and won't tell you what about. It's technically transparent, but emotionally it creates an "insider/outsider" dynamic.

It also adds cognitive load. Users now need to understand that conversations inside a single topic can have different visibility levels. That's a concept most collaboration tools avoid because it's hard to reason about. "Can this person see what I'm seeing?" becomes a per-conversation question instead of a per-topic one.

The opt-in to reveal is rarely used. Features that ask users to retroactively change privacy on old content tend to have very low engagement. The original author has moved on — they're not going back to click "make visible." So in practice, most topics that started from DMs will permanently have a ghost first entry.

**A better approach — a topic is always its own thing.** When you "create a topic from a DM," you're not linking or promoting — you're *starting a new topic* and quoting a DM as context. Like forwarding an email into a project channel. The DM conversation continues to live in the DM. The topic is born fresh.

For visibility, drop the public/private toggle on topics entirely and replace it with **membership**:

- Every topic has members (people who can see and participate)
- When you create a topic from a DM, you and the other person are the initial members
- Anyone can add more members at any time
- There's no "public" switch — there's just "add people" or "add a team"
- If you want the whole company to see it, you add the company

**Why this is better UX:**

1. **No mode to misunderstand.** There's no "private topic that becomes public" — there's just a topic with 2 people that now has 15 people. The content didn't change visibility class, the audience grew. That's intuitive.

2. **No consent problem.** When you create the topic, you're copying your words into a space where you control who's in it. If someone adds more people later, that's the same social contract as any group chat — you knew others could be invited.

3. **No placeholder ghosts.** Everyone in the topic sees everything in the topic. Full timeline, no redacted cards, no mixed visibility.

4. **DMs stay clean.** A DM is a DM. It never transforms into something else. You just get a small note: "You started a topic from this conversation" with a link.

5. **Maps to how people actually think.** Slack channels, group chats, shared docs — people understand "a space with members." They don't naturally think in terms of "a container where individual items have different visibility scopes."

**The one tradeoff:** You lose the "make it public to everyone instantly" convenience. But that feature is where all the privacy risk comes from. "Add the team" is one extra step and it makes the action feel deliberate, which is what you want when you're expanding who can see a conversation.

---

## The Slack Precedent — Private Stays Private

Slack's model actually reinforces this thinking. Slack has public channels (anyone can find and join) and private channels (invite only, invisible to non-members). But critically, Slack never lets you *convert* a private channel to public. They explicitly blocked that because of the exact problem we're dealing with — content written under one privacy assumption shouldn't be retroactively exposed.

So if we want to keep public/private as a concept, the Slack-like rule is simple:

**Private topics can never become public. Public topics can never become private.**

You pick at creation time and that's it. If a private topic's discussions need to go wider, you create a new public topic and reference the private one. The content doesn't migrate — the context does, through the people who were in both.

**Applied to the DM-to-topic flow:**

- "Create topic from DM" always creates a **private** topic (because the source was private)
- That topic can grow members, but it stays private — it never appears in a public directory or becomes discoverable
- If someone wants a public topic on the same subject, they create one separately. They can reference or summarize, but the original DM content stays in its private scope

This gives you:

- Public topics for open discussions anyone can discover
- Private topics for invite-only work (including ones born from DMs)
- No visibility transitions, no consent problem, no placeholder cards
- A clear rule users can internalize in 5 seconds: "private stays private, public stays public"

The only friction is that you can't flip a switch to open up a private discussion. But that friction is the feature — it's protecting users from accidentally exposing conversations that weren't meant for everyone.
