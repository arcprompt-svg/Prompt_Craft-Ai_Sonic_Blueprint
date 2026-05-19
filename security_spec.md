# Security Specification - Pillar Engine

## Data Invariants
1. **Master Prompts**: Must belong to an authenticated user (`userId`). Visibility can be 'private' or 'public'.
2. **Templates**: Must belong to an authenticated user (`userId`).
3. **Collab Sessions**: Are identified by a random ID. Participants can update the session state (`formState`).
4. **Participants**: Each participant record must match the `uid` of the authenticated user.

## The Dirty Dozen Payloads (Target: PERMISSION_DENIED)
1. **Identity Spoofing (Master Prompt)**: Attempting to save a prompt with someone else's `userId`.
2. **Unauthorized Update (Master Prompt)**: User A attempting to update User B's private prompt.
3. **Publicity Leak**: User A attempting to read User B's 'private' prompt.
4. **ID Poisoning (Session)**: Using a 1MB string as `sessionId`.
5. **State Shortcut (Session)**: Setting `updatedAt` to a future date manually (not using server timestamp? Actually the app uses `ISOString`, we should ideally use `serverTimestamp`).
6. **Presence Spoofing**: User A creating a participant record with User B's `uid`.
7. **Phantom Session**: Creating a participant in a session that doesn't exist.
8. **Malformed PromptState**: Saving a template with `genre1` as a huge number instead of one of the allowed genres.
9. **Spammy Keywords**: Saving `logic` with a 1MB string.
10. **Template Hijack**: User A deleting User B's template.
11. **Session Hijack**: User A updating `lastUpdatedBy` in a session to someone else.
12. **Unverified Auth**: Accessing private data when `email_verified` is false (if required).

## Test Runner (firestore.rules.test.ts)
(Logic placeholder for tests that would be run in a real environment)
