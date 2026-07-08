Context

Customer message

When a Topic becomes active, users can see that conversations are happening, but it still takes too much effort to understand what actually changed.

Important developments are spread across new conversations, replies, resolutions, and updates to files associated with the Topic. To catch up, users often need to open multiple conversations and read through too much raw discussion.

With Peek we want to be different. Communication should produce understandable signal over time, so users can quickly see how a Topic evolved without rereading everything.

Problem

Topics organize communication, but they do not yet provide a strong way to understand progression.

Once a Topic contains multiple conversations, users can browse the raw discussion, but they still cannot quickly understand:

what changed since they last checked the Topic

what important developments happened across conversations

what was resolved, decided, or learned

whether associated work moved forward in a meaningful way

Without this, users either:

reread too much communication

miss meaningful changes

stay reactive to raw activity instead of understanding progress

struggle to regain context after time away from a Topic

With Peek we want Topic detail to make evolution visible. A user should be able to open a Topic and quickly understand how it progressed since their last visit.

Solution

In Topic detail, Timeline is the front-and-center understanding surface for how the Topic evolved over time.

Timeline is a selective chronological view of the important signal and structural changes that show how a Topic evolved. It is not a full activity log. Its purpose is to surface signal, preserve progression, and make everything new since the user’s last visit of the Topic detail clearly visible.

Timeline should include only entries that help users understand how the Topic evolved.

For MVP, Timeline supports these entry types:

New conversation — a new conversation was started in the Topic.

Conversation resolved — a conversation in the Topic reached a resolved state.

Highlight added — a conversation produced a Highlight that preserves important signal such as an insight, decision, resolution, question, or summary.

Significant file update — an associated file changed in a way that materially affects state or outcome.

Examples of significant file updates:

GitHub pull request merged

GitHub pull request closed

Linear issue closed

a similarly meaningful state change in another associated file

Examples that should not appear as significant file updates:

comment on a pull request

small commit pushed to a pull request

comment on a Linear issue

minor edit or routine activity that does not materially change state or outcome

Highlights should appear as first-class Timeline entries, not as a separate side concept. This keeps preserved signal directly connected to the chronological flow of the Topic.

Timeline should clearly separate entries that happened since the user’s last visit of the Topic detail from older history. This gives users immediate orientation when returning to an active Topic.

Timeline should remain selective. It should not show every reply, edit, or mechanical system event. The goal is understanding, not logging everything.

Relationship to Highlights

Highlights preserve important signal from communication.

Timeline is one of the primary surfaces where those Highlights become visible in chronological context. It combines preserved signal with structural Topic progression so users can understand both what happened and why it matters.

Highlights do not replace Timeline. They enrich it.

Relationship to Catch-up

Timeline is the Topic-level understanding surface.

Catch-up is a cross-Topic review surface that can later build on the important signal visible in Topic timelines.

This means Timeline defines how evolution is understood inside one Topic, while Catch-up helps users review important new developments across many Topics.

Future exploration

AI summary of reply activity

Sometimes a conversation meaningfully evolves without anyone explicitly creating a Highlight.

In future, Timeline may include AI-generated summary entries that explain important reply activity when the conversation progressed in a meaningful way but no Highlight was created.

This should help preserve signal without turning Timeline into a raw reply log.

Richer significance rules

In future, Peek may support more nuanced logic for deciding which file updates or conversation changes deserve Timeline entries.

This could include product-specific understanding of what counts as a meaningful state or outcome change.

Better reading and review support

In future, Timeline may support richer ways to help users scan Topic progression, such as:

stronger visual grouping of new vs older entries

better summarization of dense periods of activity

improved ways to jump from Timeline entries into the most relevant underlying context

Usage scenarios

Returning to an active Topic

A user opens a Topic they have not checked since yesterday. Timeline clearly shows the boundary since their last visit and surfaces the new conversations, resolutions, Highlights, and significant file updates that happened in the meantime.

New conversation in a Topic

A new conversation is started inside an existing Topic. Timeline shows that a new thread of discussion began, helping users understand that the Topic expanded in scope or progressed into a new area.

Resolution captured in Timeline

A conversation in the Topic reaches a resolved state. Timeline shows the resolution so users can immediately understand that one part of the Topic has been concluded.

Highlight preserves important signal

A participant creates a Highlight from a conversation. Timeline shows that Highlight as a first-class entry, allowing others to understand the important insight, decision, question, resolution, or summary without reading the full conversation first.

Associated work moves forward

An associated file changes in a meaningful way, such as a pull request being merged or an issue being closed. Timeline shows that update so users can understand that the Topic produced a concrete downstream outcome.