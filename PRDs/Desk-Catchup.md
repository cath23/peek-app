Context

Customer message

In tools like Slack, understanding what matters often requires reading everything. That creates noise, pulls people into reactive behavior, and makes it hard for managers and other stakeholders to stay informed without becoming chat readers.

With Peek we want to be different. Communication should naturally produce high-signal artifacts that preserve what matters, and users should be able to review them in a deliberate way instead of constantly checking conversations.

Problem

Users who follow many Topics need a way to stay informed without opening every conversation or scanning every new message.

Today, the important signal may exist in communication, but reviewing it is still too expensive. Users either:

keep checking conversations directly and get pulled into reactive reading

lose awareness because passive following is too invisible

spend too much time scanning raw discussion instead of understanding what changed

This is especially painful for managers, leads, and stakeholders who want awareness across many Topics but do not want to become thread readers.

With Peek we want to support a deliberate review ritual. Users should be able to open one place, see how the Topics they follow evolved, and decide what deserves deeper attention.

Solution

In Desk, Catch-up is a personal review space for scheduled or on-demand review across followed Topics.

Catch-up is built on top of Topic Timeline. It does not create a separate understanding model. Instead, it reuses the same Timeline concept that helps users understand how a single Topic evolved, but applies it across many followed Topics in one review flow.

When user opens Catch-up, they get list of Topics with important new Timeline entries since the last review window.

Each Topic should show:

Topic name

new Timeline entries since the review window

actions to open the Topic or add it to Open work

a per-Topic reviewed state

Users can perform these actions:

Open Topic — open the Topic for deeper reading and full Timeline and conversation context.

Add to Open work — add the Topic to the main list where users organize what they want to focus on next.

Mark reviewed — clear that Topic from the currently due Catch-up set without adding work.

Later — optionally hide that Topic from the current Catch-up session and bring it back later.

Catch-up should remain intentionally different from Screener:

Screener is for reactive, inbound triage of new conversations.

Catch-up is for deliberate review of Topics the user already follows.

Catch-up should not automatically create an item in Open work. Open work should remain user-controlled.

Relationship to Timeline

Timeline is the Topic-level understanding surface.

Catch-up is the cross-Topic review surface.

This means users should not need to learn a separate review concept for Catch-up. The same types of important signal that appear in Topic Timeline should also appear in Catch-up, but grouped across many followed Topics.

Relationship to Highlights

Highlights preserve important signal from communication.

They are one important kind of signal that can appear in Topic Timeline and therefore in Catch-up. Catch-up is not just a Highlights review surface. It should also reflect other meaningful Topic evolution visible in Timeline, such as new conversations, resolutions, and significant file updates to associated files.

Relationship to Topic follow and cadence

For this phase, assume:

follow settings determine which Topics are eligible for Catch-up

Topic-level Catch-up cadence determines whether a Topic should appear and is defined separately in Spec — Topic-level Catch-up cadence

muted Topics are excluded from Catch-up

Catch-up should show Topics that are eligible by follow settings, included by cadence, and have important new Timeline entries in the relevant review window.

Desk behavior

Catch-up should appear as a persistent item in the Desk sidebar.

Recommended order:

Screener

Urgent

Catch-up

Open work

Starred

Catch-up has 3 states:

Quiet

When nothing is due, Catch-up is still visible in Desk with no emphasis. User can still open it manually.

Due

When review is due, Catch-up is visually emphasized and can show badge or summary count such as "8 updates across 4 Topics".

Reviewed

Once all currently due Topics have been reviewed, snoozed, or otherwise cleared, Catch-up returns to quiet state.

Future exploration

Stakeholder-first Topic reading

Some users may primarily follow Topics for awareness rather than active participation.

In future, Peek may lean further into a Timeline-first reading model for followers and stakeholders, where Topic detail emphasizes Timeline by default and conversations become something users open when they want deeper context.

Catch-up scheduling controls

Users should be able to configure Catch-up timing in personal Desk settings, such as:

time of day

day of week for weekly Catch-up

This supports rituals like morning review or end-of-day review.

Better review support

In future, Catch-up may support richer review behavior such as:

better per-Topic progress indicators

stronger session-level review guidance

improved snoozing behavior

Usage scenarios

No Catch-up due

When no review is currently due, Catch-up is still visible in Desk but without emphasis. User can still open it manually and review any available new Timeline entries.

Due Catch-up -> open Topic

If user sees an important development and wants deeper context right away, they open the Topic directly from Catch-up and continue reading through the Topic Timeline and conversations.

Due Catch-up -> add to Open work

If user thinks a Topic deserves focused follow-up, but not necessarily right now, they add it to Open work. The Topic will appear in the main work list where they organize current focus.

Due Catch-up -> mark reviewed

If user understands the new Timeline entries and does not need to act on that Topic, they mark it reviewed. The Topic is cleared from the currently due Catch-up set.

Due Catch-up -> later

If user wants to deal with that Topic later, they use Later so it disappears from the current review and reappears at a more appropriate time.