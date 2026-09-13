# API Reference — v1

Single source of truth for the Android client's networking layer. Every
endpoint below is served from `src/routes/v1/` via `registerV1Routes()`
(`src/routes/v1/index.ts`). Base path for all endpoints is the host root —
paths already include `/api/v1`.

**Auth requirement key:**
- 🔓 **Public** — no `Authorization` header required.
- 🔒 **Authenticated** — requires `Authorization: Bearer <token>` (Firebase ID
  token today; see the OTP scope-boundary note under Auth).

**Response envelope**: all endpoints use `src/utils/response.ts`. Success
responses are `{ success: true, data, timestamp }` (`sendOk`/`sendCreated`)
or `{ success: true, data, pagination: { total, limit, offset, hasMore }, timestamp }`
(`sendPaginated`). A `sendNoContent` response is `204` with no body. Errors
are `{ success: false, error: { code, message }, timestamp, requestId }` with
the HTTP status carried on the `AppError` subclass thrown (`src/utils/error.ts`).

---

## Auth

Passwordless — phone or email + a 6-digit OTP code, no password field
anywhere in this flow.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/request-code` | 🔓 | Request an OTP code for a phone number or email. |
| POST | `/api/v1/auth/verify-code` | 🔓 | Verify the OTP code; creates or finds the User and issues a session. Optional `sessionKey` in the body flushes any memory candidates buffered during an anonymous pre-auth conversation into permanent storage. |
| POST | `/api/v1/auth/session` | 🔒 | Exchange a verified Firebase ID token for an app session (pre-existing, Firebase-token flow). |
| POST | `/api/v1/auth/logout` | 🔒 | Invalidate the current session. |
| GET | `/api/v1/auth/me` | 🔒 | Current authenticated user's identity (uid, email, roles). |
| POST | `/api/v1/auth/refresh` | 🔒 | Exchange a refresh token for a new access token. |

**Known scope boundary**: the OTP flow issues a session via the same token
mechanism `/auth/session` uses, which the existing Firebase-only
`authenticate` middleware cannot independently verify end-to-end — see
`ARCHITECTURE.md`'s Layer 5 section.

---

## Presence

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/presence/resolve?companionId=<id>` | 🔒 | Current companion/world state for the client's video/light-state resolver. Sourced exclusively from the Context Engine — never a computed relationship-closeness label. |

---

## Conversation

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/conversations` | 🔒 | Start a new conversation. `companionId` optional in the body — defaults to the user's own companion if omitted. Returns the new conversation's id. |
| GET | `/api/v1/conversations/:id/messages` | 🔒 | Paginated message history (`?limit=&offset=`) for the mid-conversation scrolled view. |
| POST | `/api/v1/conversations/:id/messages` | 🔒 | Send a message on an existing conversation; delegates entirely to the Conversation Engine (context, prompt, LLM call, memory-consent flow). |
| GET | `/api/v1/conversations/:id/events` | 🔒 | Server-Sent Events stream of live conversation state: `kai:speaking_start`, `kai:speaking_end`, `video:state_change`. |

---

## Memories

User-scoped, ownership-checked. Distinct from the older companion-scoped
search/retrieve/timeline endpoints under `/api/v1/companions/:companionId/memories/*`
(unchanged, still available for companion-context views).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/memories?limit=` | 🔒 | List the authenticated user's consented memories, newest-consented first (backs the Memories timeline). |
| GET | `/api/v1/memories/:id` | 🔒 | Single memory detail (backs the Memory detail view). |
| DELETE | `/api/v1/memories/:id` | 🔒 | Soft delete ("forget this") — sets `deletedAt`. Never hard-deletes a single memory. |

---

## Planner

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/planner/events` | 🔒 | Create a planner event. Fields: `title`, `eventDate`, `recurrence?`, `kaiSuggestionText?`, `createdFrom?` (`"USER_STATED"` \| `"INFERRED"`, defaults to `USER_STATED`), `description?`, `companionId?`, `metadata?`. |
| GET | `/api/v1/planner/events?limit=` | 🔒 | List the user's planner events. |
| GET | `/api/v1/planner/events/:id` | 🔒 | Single planner event detail. |
| PATCH | `/api/v1/planner/events/:id` | 🔒 | Update any subset of the create fields, plus `status` (`"SCHEDULED"` \| `"COMPLETED"` \| `"CANCELLED"`). |
| DELETE | `/api/v1/planner/events/:id` | 🔒 | Soft delete. |

---

## Nudges

One row per user — simple booleans, no frequency/quiet-hours sub-settings.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/nudges/preferences` | 🔒 | Current per-category toggle state: `careHydration`, `peopleToRemember`, `checkingIn` (all default `true`). |
| PATCH | `/api/v1/nudges/preferences` | 🔒 | Update any subset of the three booleans. Creates the row with defaults + patch if none exists yet. |

---

## Profile

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/users/me` | 🔒 | Signed-in status, `activeCompanion` (seed key, e.g. `"kai"`), `addressTerm`, `memoryCount`, `accountCreatedAt` — backs the delete-confirmation screen's stats strip. |
| PATCH | `/api/v1/users/me` | 🔒 | Update `activeCompanion` and/or `addressTerm`. |
| DELETE | `/api/v1/users/me` | 🔒 | **Hard-deletes** the account. Every dependent table (Companion, Conversation, Message, Memory, Moment, Notification, PlannerEvent, NudgePreference, etc.) cascades via the schema's `onDelete: Cascade` relations — irreversible, matching "Kai will forget everything immediately, this cannot be undone." |
| GET | `/api/v1/users/profile` | 🔒 | Pre-existing profile fields (name, avatar, bio) — separate from `/users/me`'s Profile-screen summary. |
| PATCH | `/api/v1/users/profile` | 🔒 | Update name/avatar/bio. |
| GET | `/api/v1/users/preferences` | 🔒 | Language/timezone/notification/privacy preferences. |
| PATCH | `/api/v1/users/preferences` | 🔒 | Update those preferences. |

---

## Privacy

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/privacy/export` | 🔒 | Full synchronous data export: memories, messages, planner events. Returns the data directly (see `PrivacyApplicationService`'s doc comment for why synchronous is the right call at current data volume; swap for a queued job later without changing this endpoint's shape if that changes). |

---

## Billing

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/billing/status` | 🔒 | Current tier (`"FREE"` \| `"PREMIUM"`) and gated features (`voicePlayback`, `secondCompanion`). |
| POST | `/api/v1/billing/subscribe` | 🔒 | Start a subscription. Body: `{ "plan": "PREMIUM_MONTHLY" \| "PREMIUM_YEARLY" }`. Goes through `IPaymentProvider` (currently `MockPaymentProvider` — no real vendor chosen yet); on success upgrades the user to `PREMIUM`. |

**Server-side entitlement enforcement**: `BillingApplicationService
.assertEntitled(context, feature)` throws a 403 for a FREE user. Any future
endpoint returning voice-playback URLs or Kai access must call it before
returning data — entitlement is never enforced client-side only. No such
endpoint exists yet in this codebase.

---

## Other (pre-existing, not part of the Android screens above)

These predate this pass and remain available, but aren't part of the
screen/flow categories above.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health`, `/health/live`, `/health/ready` | 🔓 | Service health checks. |
| GET | `/api/v1/world`, `/world/scene`, `/world/today` | 🔒 | Legacy world-state endpoints (superseded by `/presence/resolve` for client use). |
| POST | `/api/v1/world/refresh` | 🔒 | Force-refresh world state. |
| POST | `/api/v1/interactions/start` | 🔒 | Legacy interaction start (superseded by `POST /conversations`). |
| POST | `/api/v1/conversations/:conversationId/continue` | 🔒 | Legacy interaction continue (superseded by `POST /conversations/:id/messages`). |
| GET | `/api/v1/conversations/:conversationId/history` | 🔒 | Legacy history endpoint (superseded by `GET /conversations/:id/messages`). |
| GET | `/api/v1/companions/:companionId/memories`, `/search`, `/timeline` | 🔒 | Companion-scoped memory views. |
| GET | `/api/v1/companions/:companionId/relationship`, `/timeline`, `/dimensions`, `/memories` | 🔒 | Relationship state — raw signals only (`state`, `metadata`), never a named closeness level/tier. |
| GET | `/api/v1/moments/upcoming`, `/history`, `/callbacks` | 🔒 | Currently deliberate stubs — always return an empty array. |
| GET/PATCH | `/api/v1/notifications/preferences` | 🔒 | Notification channel/frequency preferences (distinct from Nudges above). |
| GET | `/api/v1/notifications/history` | 🔒 | Notification history. No unread counts/badge numbers are ever included in any response — the client never shows notification badges. |
| POST | `/api/v1/notifications/tokens` | 🔒 | Register a push notification token. |
| PATCH | `/api/v1/notifications/:notificationId/read` | 🔒 | Mark a notification read. |
| GET | `/api/v1/settings` | 🔒 | All settings categories (general/privacy/notifications/companion). |
| PATCH | `/api/v1/settings/general`, `/privacy`, `/notifications`, `/companion` | 🔒 | Update a settings category. |

A separate, older `src/api/*/*.routes.ts` + `mountApi()` layer also exists
and is mounted alongside `src/routes/v1/` for backward compatibility — it is
not part of this reference; new client work should only ever target the
paths listed above.
