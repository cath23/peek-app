Context

Customer message

In tools like Slack, understanding what matters often requires reading everything. That creates noise, pulls people into reactive behavior, and makes it hard for managers and other stakeholders to stay informed without becoming chat readers.

Peek should work differently. Communication should naturally produce high-signal artifacts that preserve what matters without adding extra maintenance burden.

Problem

Important outcomes are currently buried inside ongoing conversations. To understand what changed, what was decided, what was learned, what questions remain open, or what state the conversation has reached, users often need to read long threads in full.

This creates several problems:

users spend too much time scanning communication instead of understanding it

managers and stakeholders are pushed to read too much raw discussion to stay informed

useful knowledge is lost inside message history

the progression of important developments is not explicit

communication produces noise, but not enough preserved signal

Peek needs a lightweight way to extract and preserve what matters as people communicate, without turning communication into manual documentation work.

Solution

Highlights are lightweight, source-based knowledge artifacts created from communication. They preserve the important signal from conversations so users can understand what matters without reading everything.

A Highlight should:

always originate from a specific source message

be easy to create naturally during communication

preserve meaning without requiring additional maintenance

support optional edited Highlight text when the source message alone is not clear enough

be visible in conversation context and roll up into broader surfaces such as Topics and Catch-up

reflect the progression of a conversation over time

Highlights are primarily about knowledge extraction, not work tracking.

Core model

Source-based creation

Every Highlight starts from a specific message.

This gives each Highlight clear provenance and keeps the mental model simple. In future, AI may help generate Highlights using broader surrounding context, but the Highlight should still remain anchored to a specific point in the conversation timeline.

Highlight text

A Highlight may reuse the source message text or have its own edited Highlight text.

This keeps creation lightweight when the source message is already clear, while also supporting clearer phrasing for Topic rollups, Catch-up, or summary-style Highlights.

Highlight types

For MVP, Highlights support these types:

💡 Insight

⚠️ Concern

✅ Conclusion

❓ Question

📃 Summary

Only one Highlight type can be associated with one source message. This should remain true beyond MVP to keep the model simple and easy to understand.

Insight

An Insight Highlight captures an important observation, discovery, learning, or takeaway that changes understanding.

Its purpose is to preserve something others should know because it adds meaningful understanding, even if the broader discussion is still open.

Concern

A Concern Highlight captures an important issue, problem, risk, warning sign, or unresolved tension that needs attention.

Its purpose is to preserve something others should notice because it may block progress, create risk, or indicate that something is wrong or may go wrong.

Summary

A Summary Highlight is a checkpoint synthesis of the conversation up to that point.

Its purpose is to help people quickly understand the current state of the discussion at a given moment in time. A Summary does not require closure. It may include ambiguity, open questions, trade-offs, or unresolved tension.

Conclusion

A Conclusion Highlight captures what the discussion landed on.

It preserves a settled point such as a decision, conclusion, or resolved position reached in the conversation. A Conclusion should reduce ambiguity and make clear what was ultimately agreed or concluded.

Conclusion is a Highlight type, not a conversation state. Separate product semantics for marking a conversation resolved should be defined in a dedicated resolving PRD.

Creation model

Highlights should be easy to create in a natural way while communicating.

MVP creation paths:

message menu action

shortcut-driven creation integrated with Shortcuts

This should make Highlight creation feel like part of writing and responding, not like a separate documentation workflow.

For MVP, Highlights are created manually.

In future, AI may:

suggest candidate Highlights

help rewrite source text into clearer Highlight text

create better checkpoint summaries using broader conversation context

Visibility and downstream use

Highlights are first-class in conversation context, but they also power broader understanding across Peek.

Highlights can be:

viewed in the conversation where they were created

surfaced at Topic level

used in Catch-up when they are visible in shared Topic context

Highlights created in narrower spaces such as Huddles should only appear in Catch-up or other shared Topic-level surfaces after they are referenced into the shared Topic context.

Referencing Highlights from a private Huddle

A Highlight created inside a Huddle can be referenced as the starting point for a new Topic conversation.

This should create a new Topic conversation around the Highlight rather than expose the underlying narrower discussion.

This lets Peek preserve safe exploration in smaller spaces while sharing the useful outcome with the broader audience.

Product principles

communication should naturally produce signal

preserving important knowledge should not require extra maintenance

users should not need to read everything to understand what matters

managers should be able to stay informed without becoming chat readers

Highlights should preserve the timeline of important developments

Peek should remain focused on communication and thinking, not become a work-tracking tool

Out of scope

The following are not defined in this PRD:

Timeline behavior and presentation

detailed Catch-up UI behavior

AI-generated Highlight suggestions

work-tracking semantics such as assignment or status on Highlights

broader multi-message Highlight generation beyond future direction

the rules and workflow for marking a conversation resolved

detailed Huddle-to-Topic publish / reference UI

Usage scenarios

Important insight during a conversation

A participant notices an important user signal in a message and marks it as an Insight Highlight. Others can later understand the key takeaway without rereading the full thread.

Concern raised during a conversation

A participant notices an important issue, risk, or warning sign in a message and marks it as a Concern Highlight. Others can later understand what needs attention without rereading the full thread.

Conclusion captured in the flow of discussion

A team reaches a conclusion in a conversation. Someone creates a Conclusion Highlight from the relevant message so the conclusion remains visible and easy to reference later.

Checkpoint summary

A conversation becomes long and nuanced. A participant creates a Summary Highlight that explains the state of the discussion up to this point, helping others catch up quickly.

Referencing from narrower discussion into shared Topic

A smaller working space arrives at a useful outcome. A participant references a Highlight into the parent Topic, creating a new Topic conversation around that outcome without exposing the full narrower discussion.