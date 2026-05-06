# Security Specification - Mizania

## Data Invariants
- A budget item MUST have a `userId` matching the creator's UID.
- A budget item MUST have a valid `category` and `frequency`.
- The `userId` of an existing budget item is immutable.
- Only the owner can read, update, or delete their budget items.

## The Dirty Dozen Payloads (Rejection Tests)
1. Creating an item with someone else's `userId`.
2. Updating an item's `userId` after creation.
3. Creating an item with a negative `amount` (if we want to enforce positivity).
4. Creating an item with a `label` longer than 100 characters (Resource Poisoning).
5. Listing budget items without a `where('userId', '==', uid)` filter (Query Trust Test).
6. Updating a `createdAt` timestamp from the client.
7. Injecting a ghost field `isAdmin: true` into a budget item.
8. Deleting a budget item belonging to another user.
9. Reading a specific document ID belonging to another user.
10. Using a document ID that is excessively long/illegal characters (ID Poisoning).
11. Bypassing schema by sending `amount` as a string.
12. Trying to update `category` to an invalid value.

## Conflict Report
| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|-------------------|-------------------|-------------------|
| budgetItems| Blocked (isOwner) | N/A               | Blocked (Size limit)|
