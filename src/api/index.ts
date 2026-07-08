/**
 * Peek data-access seam (Phase 1 — see PRODUCTION-PLAN.md).
 *
 * The ONLY module tree components and pages may read app data through.
 * Phase 1 internals merge the static mocks in src/data with the runtime
 * override providers; Phase 2 swaps those internals to Convex
 * queries/mutations entity by entity without touching consumers.
 */
export * from './types'
export * from './reference'
export * from './directory'
export * from './unread'
export * from './desk'
export * from './currentUser'
export * from './people'
export * from './topics'
export * from './huddles'
export * from './messages'
export * from './actions'
export { useStarred } from '@/api/internal/starred'
export { PeekDataProvider } from './store'
