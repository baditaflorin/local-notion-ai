# 0067 - State Management Convention

## Status

Accepted

## Context

Workspace documents are persisted through Yjs/IndexedDB. Phase 3 introduces small UI/session settings and transient output states.

## Decision

- Documents remain in `WorkspaceStore`.
- AI output remains ephemeral UI state and can be exported/copied/printed by user action.
- Settings live in a versioned localStorage document validated by zod.
- Share hash state imports documents into the workspace rather than becoming a second live store.
- Clear local data clears the workspace and transient AI output; settings remain because they are preferences, not workspace data.

## Consequences

The app has one canonical workspace store and one small preferences store.

## Alternatives Considered

- Put settings into Yjs. Rejected because settings are browser preferences, not workspace documents.
