# SRI EDITING STUDIO — Payload-First Security Specification

## 1. Core Data Invariants
1. **Identity & Single Admin Gate**: Admin privileges are restricted strictly to verified identity (`request.auth.token.email == 'g03608160@gmail.com' && request.auth.token.email_verified == true`) or an admin registry entry. Clients can never elevate `role: 'admin'` on `/users/{userId}` or write to `/admins/{userId}`.
2. **PII Isolation**: Email, phone, and private notes reside in `/users/{userId}/private/{docId}` (readable/writable only by `isOwner(userId)` or `isAdmin()`).
3. **Project Ownership & Workflow Integrity**: Every `/projects/{projectId}` document belongs to `customerId == request.auth.uid` on creation, starts in `'Request Submitted'`, and enforces strict `affectedKeys().hasOnly(...)` transitions. Customers cannot self-approve, mark completed, or read another customer's projects.
4. **Master Gate on Subcollections**: `/projects/{projectId}/history` and `/projects/{projectId}/messages` verify parent ownership via `get(/databases/$(database)/documents/projects/$(projectId))`.
5. **Review Integrity & Moderation**: Reviews can only be submitted for a project owned by `request.auth.uid` whose status is `'Completed'`, must initialize `moderationStatus: 'pending'`, `featured: false`, and `adminReply: ''`, and only admin can moderate or reply.
6. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps are enforced via `request.time`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Shadow Role Escalation**: Customer creates `/users/{uid}` with `role: 'admin'`.
2. **Ghost Field Injection**: Customer creates `/projects/{id}` with an extra undocumented field `isPaid: true`.
3. **Spoofed Project Ownership**: Authenticated customer A creates `/projects/{id}` with `customerId: 'customerB'`.
4. **State Shortcutting**: Customer creates `/projects/{id}` directly with `status: 'Completed'` or updates `status` from `'Request Submitted'` to `'Completed'`.
5. **Cross-Customer Read / Scrape**: Customer A calls `get` or `list` on `/projects` without `customerId == auth.uid`.
6. **Terminal State Tampering**: Customer updates a `'Completed'` or `'Cancelled'` project.
7. **Unverified Email Admin Spoof**: Token with `email: 'g03608160@gmail.com'` and `email_verified: false` attempts admin write on `/services/{id}`.
8. **Fake Review Self-Approval**: Customer submits `/reviews/{id}` with `moderationStatus: 'approved'` or `featured: true`.
9. **Review Without Completed Project**: Customer submits `/reviews/{id}` referencing a non-existent or `'Reviewing'` project.
10. **Customer Modifies Admin Reply**: Customer updates `adminReply` on their own review.
11. **Resource Poisoning (ID & String Overflow)**: Attacker uses a 500-char document ID or invalid characters (`../etc/passwd`) or >3000-char description.
12. **Client-Side Timestamp Forgery**: Client sends `createdAt: new Date('2020-01-01')` instead of `serverTimestamp()`.
