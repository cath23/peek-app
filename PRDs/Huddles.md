Context

Customer message

People need a safe way to think through ideas before they bring them to a broader group. Sometimes that means brainstorming with AI, sometimes with one colleague, and sometimes with a small set of people. But that work should still connect back to the main shared discussion so knowledge does not get fragmented.

Problem

Topics are the main place where shared communication around a subject should live. But not every step of thinking belongs directly in the main Topic.

Users often need a smaller space to:

explore an idea before sharing it broadly

do research with AI

align with one or two people first

work through ambiguity before turning it into a clearer proposal

If all of this happens directly in the Topic, the Topic becomes noisy and lower-signal.

If it happens outside the Topic in DMs or separate chats, the work becomes fragmented and harder to connect back to the shared context.

Trying to solve this with private/public at both Topic and conversation level creates a model that is hard to understand. Users need to reason about who can see what inside one shared space, which adds cognitive load and makes the system feel complicated.

We need a simpler concept that preserves both:

clarity in the main Topic

safe space for smaller-scope exploration

Solution

Introduce Huddles.

A Huddle is a focused side space connected to a Topic. It has its own members and is used for narrower exploration such as:

brainstorming with AI

alignment between two or a few people

research or drafting before sharing more broadly

live or async collaboration on a sub-problem

The Topic remains the canonical shared space for the subject. The Huddle is the smaller working space attached to it.

Core rules

A Huddle always belongs to exactly one Topic

A Topic can have multiple Huddles

Huddles have their own membership

Topic membership and Huddle membership are separate

A Huddle can publish Highlights back to the Topic

Publishing from a Huddle creates a new Topic conversation

Topic members can react to the published result without gaining access to the Huddle itself

This creates a clear model:

Topic = shared subject space

Huddle = narrower working space

Highlight = output of the Huddle

Topic conversation = where broader discussion continues

How Huddles are created

Topic → Huddle

Someone in a Topic wants to work on something with:

AI

one other person

a small group

They create a Huddle from the Topic.

Conversation → Topic

Someone is already in a DM, small group conversation, or AI conversation and realizes this deserves a Topic.

When they create a Topic from that conversation:

if the original conversation had a narrower audience than the new Topic, it becomes the first Huddle

if the original conversation was already intended for the broader Topic audience, it becomes a normal Topic conversation instead

This keeps the distinction clear:

same audience as Topic → normal Topic conversation

narrower audience than Topic → Huddle

Where Huddles appear

In the Topic detail:

the main conversations column shows shared Topic conversations

Huddles appear in their own standalone section

Timeline, Files, and Properties remain part of the shared Topic surface

This means the shared Topic surface stays mostly consistent for everyone, while the Huddles section can vary by member access.

Outside Topics:

in DMs or AI chat, a connected conversation should still feel native to that surface

that surface should show that the conversation is now a Huddle connected to a Topic

users can open the Topic or publish Highlights from there

in search, recents, and notifications, Huddles should appear as their own typed object

What Huddles contain

A Huddle should support:

members

optional title

type (AI brainstorming, small-group, live call)

conversation timeline

published Highlights

active / resolved / archived state

Huddles should support both async text and future live call collaboration.

Usage scenarios

DM conversation becomes a Topic and Huddle

Two people are chatting in a DM and realize the subject deserves a broader shared space.

They create a Topic from the DM.

Because the original conversation had a narrower audience than the new Topic, that conversation becomes the first Huddle in the new Topic. The Huddle keeps its original participants and privacy boundary. The broader shared discussion happens in the Topic.

Brainstorm with AI before replying in Topic

A PM opens a Huddle with AI from a Topic to think through trade-offs and shape an initial proposal.

Once they are ready, they publish a Highlight back to the Topic. This creates a new Topic conversation where the broader group can react and discuss the proposal.

Small-group alignment before sharing broadly

A PM and designer create a Huddle from a Topic to align on a direction privately before bringing it to engineering.

They use the Huddle to explore options, decide on a direction, and publish the summary back into the Topic as a new conversation.

Public conversation becomes a Topic

A broader public or shared conversation already includes the audience that should make up the Topic.

When a Topic is created from that conversation, the original conversation becomes a normal Topic conversation, not a Huddle.

Topic members react to Huddle output

Someone publishes a summary, proposal, or decision from a Huddle.

Peek creates a new Topic conversation that references the Huddle output as a resource. Topic members react and reply in that Topic conversation. They do not gain access to the Huddle itself.

Milestones

Framing

validate Huddle as the right primitive vs private/public conversations

finalize the core model of Topic, Huddle, Highlight, and Topic conversation

align on naming and positioning

Core product model

define Huddle properties and lifecycle

define the Topic detail information architecture including Huddles section

define the publish-back flow from Huddle to Topic conversation

define rules for when an original conversation becomes a Huddle vs a normal Topic conversation

Cross-surface UX

define how Huddles appear in DMs

define how Huddles appear in AI chat

define how Huddles appear in search, recents, and notifications

ensure Huddles do not become a separate top-level product area

Calls and richer collaboration

extend Huddles to support live call collaboration

explore whether Huddle can be the umbrella concept for both text and calls

define how call outcomes publish back into the Topic