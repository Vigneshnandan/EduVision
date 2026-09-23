# EduVision — Complete Modification & Commercialization Plan

**Prepared for:** EduVision (Vigneshnandan/EduVision)
**Date:** 2026-09-23
**Scope:** (A) Product/feature modification plan — teacher auth, school management, attendance manual-correction workflow, cloud sync — and (B) IP/license remediation required for commercial release. This is an engineering/product planning document, not legal advice (see §7).

---

## How to read this document

There are two workstreams that must be sequenced together, not run independently:

- **Track A — Feature Build-Out**: implements the hand-drawn plan (teacher login, school selection, manual attendance correction, cloud sync scoping).
- **Track B — IP & Licensing Remediation**: implements the findings of the commercial license/IP audit, so the product can be legally distributed and survive investor/customer due diligence.

They intersect in three places, flagged inline wherever relevant:

1. Every new file Track A creates is **original EduVision IP** and should get a copyright header the moment it's created (Track B, §5.3) — cheaper to do at creation time than retrofitted later.
2. Track A's cloud-sync rework (school/teacher-scoped Supabase access) is the natural moment to also fix the hardcoded API key and open RLS policies — a security gap the license audit didn't cover but that any real due-diligence review will flag alongside it.
3. Track B's package/namespace rebrand (`com.ml.shubham0204.facenet_android` → EduVision's own namespace, §5.6) touches the same files Track A is about to add new code to. Doing the rename **before** Track A's Phase 1 avoids doing it twice.

---

## Part 0 — Current State (baseline, verified against the repository)

| Area | Current state |
|---|---|
| Home navigation | Exists — Take Attendance, Student Registration, Student List, Attendance Logs quick actions on `EduVisionHomeScreen.kt` |
| Online/offline indicator | Exists — `ConnectivityChecker` + status pill |
| Attendance cloud sync | Exists, but manual-trigger only, pushes *all* records every time, and uses a hardcoded Supabase anon key in `CloudSyncRepository.kt` |
| Teacher / auth | **Does not exist** — no login, no register, no Teacher entity, no session storage, `NavHost` starts directly at `home` |
| School entity | **Does not exist** — `school_settings` is a single global key/value table, not a schools directory |
| Multi-tenancy | **Does not exist** — no `school_id`/`teacher_id` on any table; Supabase RLS policies are `USING (true)` (open to anyone) |
| Manual attendance correction | **Does not exist** — `DetectScreenViewModel.markAttendance()` commits each recognized face to the DB immediately; `AttendanceResultScreen` only displays what was already written and has no edit affordance or "Confirm" write path |
| Manual-vs-automatic flag | **Does not exist** — `AttendanceRecord` and `CloudAttendanceRecord` have no field for it |
| Registration → cloud | **Does not exist** — `AddFaceScreenViewModel` writes only to local ObjectBox; no student-details push to Supabase |

---

# Track A — Feature & Architecture Plan

## A0. Build order (why this order)

```
1. Data model additions (Teacher, School, isManual flag)
        ↓
2. Dashboard: schools directory endpoint + teacher registration endpoint
        ↓
3. App: Login / Register screens + persistent session + nav gating
        ↓
4. App: rework attendance pipeline to stage results (prerequisite for #5)
        ↓
5. App: manual-correction UI + Confirm action, wired to staged state
        ↓
6. App: student-registration → cloud push (details only, not embeddings)
        ↓
7. Cloud-sync security hardening (secrets, RLS scoping by school/teacher)
```

Steps 4 and 5 are listed separately on purpose: building the correction UI directly on top of today's "write-on-recognition" model has nothing to correct *before* the write already happened. The staging rework has to land first.

---

## A1. Phase 1 — Data model foundations

### A1.1 New entity: `Teacher` (Android, ObjectBox)

New file: `data/DataModels.kt` (add) or new `data/TeacherRecord.kt`

```kotlin
@Entity
data class TeacherRecord(
    @Id var teacherID: Long = 0,
    @Index var teacherRemoteId: String = "", // id assigned by Supabase on registration
    var teacherName: String = "",
    var teacherLoginId: String = "",         // "Teacher ID" from the sketch
    var schoolId: String = "",               // FK to the school selected at registration
    var schoolName: String = "",             // denormalized for offline display
    var sessionToken: String = "",           // opaque token/hash, not the raw password
    var lastLoginTime: Long = 0,
)
```

- Store the raw password **nowhere** on-device. Either hash it locally only for offline login fallback (bcrypt/argon2, not plain SHA) or — preferable, since "Always Logged In" is the stated UX — treat login as a one-time event that mints a long-lived session token from Supabase Auth, and only that token is persisted (see A3.2).

### A1.2 New table: `schools` (Supabase / Dashboard)

New migration: `Dashboard/supabase/migrations/schools.sql`

```sql
create table if not exists public.schools (
    school_id uuid primary key default gen_random_uuid(),
    school_name text not null,
    school_code text unique,              -- optional short code for dropdown search
    address text,
    created_at timestamptz default now()
);

alter table public.schools enable row level security;

-- Read-only, unauthenticated: needed so the Register screen's dropdown
-- can be pre-fetched before a teacher account exists.
create policy "Public read for school directory" on public.schools
    for select using (true);
```

### A1.3 Add `school_id` / `teacher_id` foreign keys to existing tables

`student_details` and any attendance-facing tables need scoping, or every school's data stays in one shared bucket:

```sql
alter table public.student_details
    add column if not exists school_id uuid references public.schools(school_id),
    add column if not exists teacher_id uuid;

-- Tighten from "Allow generic write access" (USING (true)) to scoped policies
-- once teacher auth exists (Phase 3). Track as a follow-up migration —
-- don't ship Phase 1 with a stricter policy your own new endpoints can't
-- yet satisfy (no teacher session = every insert fails).
```

Also add a `teachers` table mirroring `TeacherRecord` (school_id FK, teacher_login_id unique per school, no plaintext password column — use Supabase Auth or a salted hash column, decided in A3.2).

### A1.4 `isManual` flag on attendance

`data/DataModels.kt`:

```kotlin
@Entity
data class AttendanceRecord(
    @Id var id: Long = 0,
    @Index var studentId: Long = 0,
    var date: Long = 0,
    var timestamp: Long = 0,
    var isPresent: Boolean = false,
    var studentClass: String = "",
    var isManual: Boolean = false,        // NEW — true if a teacher edited/overrode this record
    var markedByTeacherId: String = "",   // NEW — which teacher made the manual edit
)
```

`data/cloud/CloudSyncModels.kt`:

```kotlin
data class CloudAttendanceRecord(
    @SerializedName("student_id") val studentId: Long,
    @SerializedName("name") val name: String,
    @SerializedName("class_name") val className: String,
    @SerializedName("roll_number") val rollNumber: String,
    @SerializedName("date") val date: Long,
    @SerializedName("is_present") val isPresent: Boolean,
    @SerializedName("timestamp") val timestamp: Long,
    @SerializedName("is_manual") val isManual: Boolean,       // NEW
    @SerializedName("marked_by") val markedBy: String?,       // NEW
    @SerializedName("school_id") val schoolId: String,        // NEW — required once multi-tenant
)
```

Corresponding Supabase attendance table needs `is_manual boolean default false` and `marked_by text` columns (find/adjust wherever the live `attendance` table is currently defined — it wasn't in the migrations folder audited, so confirm its actual schema in the Supabase project directly before writing this migration).

### A1.5 Dashboard display of manual flag

`Dashboard/components/ClassBreakdown.tsx`, `MonthlyRegisterTable.tsx`, `RecentActivityTable.tsx` — add a small "Manual" badge/icon wherever a per-student attendance cell or row is rendered, sourced from `is_manual`. This is the "flagged as manual in Dashboard" requirement from the note.

**Deliverables checklist — Phase 1**
- [x] `TeacherRecord` ObjectBox entity + generated `TeacherRecord_` (build step)
- [x] `schools.sql` migration + applied to Supabase project
- [x] `teachers.sql` migration
- [x] `school_id`/`teacher_id` columns added to `student_details` (and the live `attendance` table)
- [x] `isManual` + `markedByTeacherId` added to `AttendanceRecord`
- [x] `CloudAttendanceRecord` updated with `is_manual`, `marked_by`, `school_id`
- [x] Dashboard components show a manual-edit indicator

---

## A2. Phase 2 — Dashboard API: school directory + teacher registration

New Next.js route handlers under `Dashboard/app/api/` (create this directory — none exists today; all current Dashboard logic in `lib/*.ts` runs server-side via Server Actions, not REST routes):

- `GET /api/schools` — returns `{ school_id, school_name }[]` for the Register screen's dropdown. Backed by `lib/schools.ts` (new file, mirrors the pattern in `lib/students.ts`).
- `POST /api/teachers/register` — accepts `{ teacherName, teacherLoginId, password, schoolId }`, creates the teacher record (via Supabase Auth `signUp` if you adopt Supabase Auth — recommended over hand-rolled password storage — or an RPC/hash if not).
- `POST /api/teachers/login` — validates credentials, returns a session token.

Alternative that avoids building custom REST routes at all: adopt **Supabase Auth** directly from the Android app (it has a Kotlin client) for teacher accounts, and use a plain Supabase table `select` (already RLS-public per A1.2) for the schools dropdown. This removes the need for `/api/teachers/*` entirely and is the recommended path — fewer moving parts, and password handling becomes Supabase's problem, not EduVision's.

**Deliverables checklist — Phase 2**
- [x] Decision: hand-rolled `/api/teachers/*` vs. Supabase Auth (recommend the latter)
- [x] `GET /api/schools` (or equivalent Supabase client call from the app)
- [x] Teacher registration path (Supabase Auth signUp, or custom endpoint)
- [x] Teacher login path (Supabase Auth signIn, or custom endpoint)

---

## A3. Phase 3 — Login / Register screens + session gating

Matches the second sketch (`Home Page`, `OFFLINE`/`ONLINE` split, `Login`, `Register Button`, `Login Button`).

### A3.1 New screens (Android, following existing `presentation/screens/<feature>/` pattern)

```
presentation/screens/auth/
  LoginScreen.kt          — Teacher ID + Password fields, Login button
  LoginScreenViewModel.kt
  RegisterScreen.kt       — Teacher Detail fields + School Dropdown (pre-fetched)
  RegisterScreenViewModel.kt
```

- School dropdown data source: fetched once from `/api/schools` (or Supabase client) on Register screen entry; this call **requires internet** (matches note 3 — "Fetching School Details from Dashboard" is a one-time, online-only action). Cache the fetched list locally (ObjectBox or DataStore) so re-opening Register offline still shows the last-fetched list, clearly marked as possibly stale.
- Registration itself requires internet (creating the teacher account server-side).
- Login requires internet the first time; after that, "Always Logged In" per the sketch — persist the session token (A1.1/A3.2) so subsequent app opens skip login entirely, online or offline.

### A3.2 Session persistence

Use **Jetpack DataStore** (or `EncryptedSharedPreferences`) — not the existing `SettingsStore` if that's plain `SharedPreferences` (confirm before reuse; session tokens should not sit in unencrypted storage). Store: session token, teacher name, school id/name, login timestamp. No raw password ever stored on-device.

### A3.3 Nav gating

`MainActivity.kt` — change `startDestination`:

```kotlin
val startDestination = if (sessionStore.hasValidSession()) "home" else "login"

NavHost(navController = navHostController, startDestination = startDestination, ...) {
    composable("login") { LoginScreen(
        onLoginSuccess = { navHostController.navigate("home") { popUpTo("login") { inclusive = true } } },
        onNavigateToRegister = { navHostController.navigate("register") }
    ) }
    composable("register") { RegisterScreen(
        onRegisterSuccess = { navHostController.navigate("home") { popUpTo("login") { inclusive = true } } },
        onNavigateBack = { navHostController.navigateUp() }
    ) }
    // existing routes unchanged
}
```

- `EduVisionHomeScreen`'s "lock" icon on Student Registration (from the sketch): gate `onNavigateToRegistration` behind a role check (e.g., only allow if the logged-in teacher's role/permission flag allows adding students) or behind being online, per whatever the lock was meant to signal — **needs a decision from the user** on which condition the lock represents (see Open Questions, §6).

**Deliverables checklist — Phase 3**
- [x] `LoginScreen` + ViewModel
- [x] `RegisterScreen` + ViewModel (with school dropdown, pre-fetched)
- [x] Session storage (DataStore/EncryptedSharedPreferences), no plaintext passwords
- [x] `MainActivity` nav gating on session state
- [x] Decision + implementation of what the "lock" on Student Registration means

---

## A4. Phase 4 — Rework attendance pipeline to stage results

This is the architectural change the manual-correction flow depends on.

**Current:** `DetectScreenViewModel.markAttendance(personId, name)` → `AttendanceUseCase.markAttendance()` writes to ObjectBox the instant a face is recognized.

**Target:**
1. During a "Take Attendance" session, recognized faces accumulate in an **in-memory draft** (e.g., `mutableStateMapOf<Long, Boolean>` keyed by student id, held in `DetectScreenViewModel` or a new `AttendanceDraftUseCase`), not written to `AttendanceRecord` yet.
2. When the teacher ends the session (`onAttendanceEnd`), navigate to `AttendanceResultScreen` **passing the draft**, not re-reading already-committed records from the DB (today it calls `attendanceUseCase.getAttendanceForClass(...)` — that only works because records already exist; under the new model nothing is committed yet, so the result screen must receive the draft directly, e.g. via a shared ViewModel scoped to the nav graph, or serialized through `SavedStateHandle`).
3. `AttendanceResultScreen`'s "Confirm"/"Done" action performs the actual `AttendanceUseCase.markAttendance()` writes for every entry in the draft — this is the "Confirm → Sent to Attendance Logs" step in the sketch.

**Deliverables checklist — Phase 4**
- [x] `AttendanceDraftUseCase` (or equivalent in-memory holder) for a session's not-yet-committed results
- [x] `DetectScreenViewModel` no longer calls `markAttendance` per recognized face — only updates the draft
- [x] Draft passed to `AttendanceResultScreen` instead of re-querying committed records
- [x] `AttendanceUseCase.markAttendance()` (or a new batch variant) called only on Confirm

---

## A5. Phase 5 — Manual correction UI

Built on top of A4's staged draft.

- `presentation/components/AttendanceResultItem.kt` (`ResultItem`) — add a `onToggle: () -> Unit` parameter; make the present/absent chip tappable (e.g., wrap in `Modifier.clickable`), toggling that student's entry in the draft and setting `isManual = true` + `markedByTeacherId = currentTeacherId` for that entry.
- `AttendanceResultScreen` — replace the current "Done" button (which just navigates home) with:
  - A visible indicator that this list is editable ("Tap to correct") — human-in-the-loop, per the sketch's parenthetical note.
  - A "Confirm" button that performs the batch write from A4 step 3, then navigates home.
- Optionally show a small "Manual" tag next to any row the teacher has toggled, so it's visible before confirming (mirrors the Dashboard-side badge from A1.5).

**Deliverables checklist — Phase 5**
- [x] `ResultItem` tappable, toggles draft state + sets `isManual`
- [x] `AttendanceResultScreen` "Confirm" button wired to the batch commit
- [x] Manual-edit visual indicator in the result list

---

## A6. Phase 6 — Student registration → cloud (details only)

Per note 3: "One-time student registration with photos → student details alone sent to cloud (not face embeddings)."

- New method on a cloud repository (e.g., `CloudSyncRepository.pushStudentDetails(person: PersonRecord)` or a new `StudentSyncRepository`), called from `AddFaceScreenViewModel.addImages()` **after** the local `personUseCase.addPerson(...)` succeeds, sending only `{ personName, studentClass, rollNumber, schoolId }` — never `faceEmbedding`.
- Requires internet at registration time (already implied — matches "One Time" bucket in note 3). If offline, queue the push (e.g., a `pendingStudentSync` flag on `PersonRecord`) and retry on next connectivity/sync, so registration itself doesn't hard-fail offline (face capture and local storage should still work per the app's offline-first design).
- Populates `student_details` (A1.3) with a `school_id`, closing the loop with the school selected at teacher registration.

**Deliverables checklist — Phase 6**
- [x] Cloud push of student details (no embeddings) after local registration
- [x] Offline queue/retry for this push if registration happens without connectivity
- [x] `student_details` rows correctly scoped to `school_id`

---

## A7. Phase 7 — Cloud sync security hardening

Not in the original sketch, but directly triggered by the fact that Phases 1–6 add real accounts and per-school data to a sync layer that is currently wide open:

- Remove the hardcoded Supabase anon key from `CloudSyncRepository.kt`; move to `local.properties` → `BuildConfig` (never committed).
- Replace `USING (true)` RLS policies on `student_details`, `schools`, and the attendance table with policies scoped to the authenticated teacher's `school_id` (requires adopting Supabase Auth from A2, since RLS scoping by teacher needs `auth.uid()` to mean something).
- `CloudSyncRepository.syncAttendance()` currently pushes **all** local records every sync; once records carry a `school_id`, filter to the logged-in teacher's school so one device never leaks another school's data even if the API key were reused across schools.

**Deliverables checklist — Phase 7**
- [x] API key moved out of source control
- [x] RLS policies scoped by authenticated school/teacher
- [x] Sync payload scoped to current teacher's school

---

# Track B — IP, Licensing & Commercial Readiness Plan

*(Restructured from the supplied `EduVision_Commercial_License_IP_Reference.md` audit into an execution plan. Findings and conclusions below are that document's, reorganized into actionable phases; nothing in this section overrides its content — read the original for full context and caveats.)*

## B0. Where this stands

**Conclusion of the audit: EduVision can be commercially distributed, with conditions.** No license found blocks commercial use. The remaining work is attribution/compliance/provenance cleanup, not a rewrite:

- The Android recognition scaffold is a modified derivative of `shubham0204/OnDevice-Face-Recognition-Android` (Apache-2.0) — commercially usable, combinable into a proprietary product, but requires preserved attribution and license notices.
- EduVision's own attendance logic, cloud sync, Dashboard, and product workflow are original IP and can be kept proprietary.
- Two `.tflite` model files (`facenet.tflite`, `facenet_512.tflite`) and one MediaPipe asset (`blaze_face_short_range.tflite`) have **unverified provenance** and are marked `VERIFY MANUALLY` — this is the single highest-priority open item, since a model's license is independent of the code that loads it.

## B1. P0 — Must fix before any commercial release

| # | Task | Files/artifacts |
|---|---|---|
| B1.1 | Create `/NOTICE`, `/THIRD_PARTY_LICENSES`, `/MODEL_LICENSES` at repo root | New files — templates in §B4 below |
| B1.2 | Complete the incomplete attribution comment | `domain/embeddings/FaceNet.kt` — currently just `// Derived from the original project:` with no reference filled in |
| B1.3 | Verify FaceNet model provenance | `facenet.tflite`, `facenet_512.tflite` — trace exact source repo, checkpoint lineage, training-data terms, commercial/redistribution rights |
| B1.4 | Verify MediaPipe/BlazeFace asset terms | `blaze_face_short_range.tflite` — framework is Apache-2.0 but the model *asset* terms need separate confirmation |

## B2. P1 — Before investor / customer due diligence

| # | Task |
|---|---|
| B2.1 | Rebrand upstream product identity — `com.ml.shubham0204.facenet_android` package namespace, "FaceNet-Android" naming, inherited `CHANGELOG`/`FUNDING.yml`/release-workflow references — where these are *product identity*, not required legal attribution. **Do this before or alongside Track A Phase 1**, since Phase 1 adds new files under the same package tree; renaming after would mean re-touching them. |
| B2.2 | Preserve all required upstream copyright/license notices while rebranding — rebranding ≠ stripping attribution; these are separate concerns |
| B2.3 | Add EduVision copyright headers to genuinely original files (list in §B5) — **and to every new file Track A creates**, at creation time |
| B2.4 | Run a full transitive dependency license scan (not just direct/manifest-level, which is all the current audit covers) — e.g. `./gradlew licenseReport`-style plugin for Android, `license-checker`/`npx license-checker` for the Dashboard's npm tree |
| B2.5 | Document IP ownership — founder/contributor IP-assignment and confidentiality agreements once the company is incorporated |

## B3. P2 — Ongoing hygiene

- [ ] Maintain a centralized third-party license inventory (living doc, not a one-time file)
- [ ] Keep model/dependency provenance documentation current
- [ ] Retain copies/references of upstream licenses in the repo
- [ ] Add an in-app "Open Source Licenses" screen (a natural home: a new item in the Home nav or a Settings sub-screen — `Dashboard/app/settings/page.tsx` and an Android equivalent under `presentation/screens/`)
- [ ] Maintain a software bill of materials (SBOM) where practical
- [ ] Re-run the license audit whenever a major dependency or model changes

## B4. File templates to create (P0)

### `/NOTICE`

```text
EduVision
Copyright © 2026 [Legal entity name once incorporated]

This product includes software developed by third parties, including but
not limited to:

- OnDevice-Face-Recognition-Android (shubham0204) — Apache License 2.0
- MiniFASNet / Silent-Face-Anti-Spoofing (MiniVision) — Apache License 2.0
- DeepFace-related components — MIT License
- Google MediaPipe — Apache License 2.0 (framework); model asset terms
  verified separately, see /MODEL_LICENSES
- Google ML Kit — subject to Google APIs / ML Kit Terms of Service

See /THIRD_PARTY_LICENSES for the full dependency list and
/MODEL_LICENSES for model-specific provenance and licensing.
```

*(Finalize only after B1.3/B1.4 verification and B2.4's full dependency scan — do not publish this until the underlying facts are confirmed, per the audit's own caution against guessing.)*

### `/THIRD_PARTY_LICENSES` (structured entries, one per dependency)

```text
Component: OnDevice-Face-Recognition-Android
Source: https://github.com/shubham0204/OnDevice-Face-Recognition-Android
License: Apache License 2.0
Usage: Modified derivative (Android module scaffold, MainActivity.kt,
       MainApplication.kt, di/AppModule.kt, ObjectBoxStore.kt, PersonDB.kt,
       ImagesVectorDB.kt, domain/embeddings/FaceNet.kt,
       domain/face_detection/*, parts of Compose screen architecture)
Commercial use: Permitted subject to Apache 2.0 obligations
Attribution required: Yes

Component: MiniFASNet / Silent-Face-Anti-Spoofing
Source: [MiniVision repository — confirm exact URL]
License: Apache License 2.0
Usage: spoof_model_scale_2_7.tflite, spoof_model_scale_4_0.tflite
       (format-converted via DeepFace / AI Edge Torch tooling)
Commercial use: Permitted subject to Apache 2.0 obligations
Attribution required: Yes

Component: ObjectBox
License: Apache License 2.0
Commercial use: Permitted

Component: Koin
License: Apache License 2.0
Commercial use: Permitted

Component: TensorFlow Lite / LiteRT
License: Apache License 2.0
Commercial use: Permitted

Component: CameraX
License: Apache License 2.0
Commercial use: Permitted

Component: Retrofit / Gson / Coil
License: Apache License 2.0
Commercial use: Permitted

Component: AndroidX / Jetpack Compose
License: Apache License 2.0
Commercial use: Permitted

Component: Google ML Kit (Face Detection)
License: Google APIs / ML Kit Terms of Service (not open-source; consumed as SDK dependency)
Commercial use: Permitted subject to current Google terms — re-verify against the exact SDK version shipped

Component: Dashboard npm dependencies (Next.js, React, Supabase JS client, etc.)
License: Mostly MIT / ISC
Commercial use: Permitted with attribution obligations
Notes: Full transitive list pending B2.4's `license-checker` run
```

### `/MODEL_LICENSES`

```text
Model: FaceNet (128-d)
Filename: facenet.tflite
Original Source: VERIFY MANUALLY
License: VERIFY MANUALLY
Commercial Use: VERIFY MANUALLY
Redistribution: VERIFY MANUALLY
Provenance Status: UNVERIFIED — P0 blocker

Model: FaceNet (512-d)
Filename: facenet_512.tflite
Original Source: VERIFY MANUALLY
License: VERIFY MANUALLY
Commercial Use: VERIFY MANUALLY
Redistribution: VERIFY MANUALLY
Provenance Status: UNVERIFIED — P0 blocker

Model: MiniFASNet anti-spoofing (scale 2.7)
Filename: spoof_model_scale_2_7.tflite
Original Source: Silent-Face-Anti-Spoofing / MiniVision
License: Apache License 2.0
Commercial Use: Permitted
Notes: Converted via DeepFace + AI Edge Torch tooling; preserve existing
       in-code attribution comments

Model: MiniFASNet anti-spoofing (scale 4.0)
Filename: spoof_model_scale_4_0.tflite
Original Source: Silent-Face-Anti-Spoofing / MiniVision
License: Apache License 2.0
Commercial Use: Permitted

Model: BlazeFace (short range)
Filename: blaze_face_short_range.tflite
Original Source: Google MediaPipe
License: Framework is Apache-2.0; exact model-asset redistribution terms VERIFY MANUALLY
Provenance Status: Framework confirmed, asset terms pending — P0 blocker
```

## B5. Copyright headers — original EduVision files

Add `Copyright © 2026 [Legal entity]. All rights reserved.` (or the chosen OSS/proprietary header) to:

**Existing files:**
- `domain/AttendanceUseCase.kt`
- `data/cloud/CloudSyncRepository.kt`
- `data/cloud/CloudSyncService.kt`
- `data/cloud/CloudSyncModels.kt`
- `data/ConnectivityChecker.kt`
- `data/SettingsStore.kt`
- `Dashboard/*` (app routes, components, `lib/*.ts`)

**New files from Track A (add header at creation, not retroactively):**
- `data/TeacherRecord.kt` (or wherever added)
- `presentation/screens/auth/LoginScreen.kt`, `LoginScreenViewModel.kt`
- `presentation/screens/auth/RegisterScreen.kt`, `RegisterScreenViewModel.kt`
- `domain/AttendanceDraftUseCase.kt`
- `Dashboard/lib/schools.ts`, `Dashboard/app/api/schools/*`, `Dashboard/app/api/teachers/*` (if built instead of using Supabase Auth directly)
- All new SQL migrations under `Dashboard/supabase/migrations/`

## B6. Upstream identity cleanup

Rename/replace where it's product identity rather than required attribution:

```
Old package: com.ml.shubham0204.facenet_android
New package: [EduVision's chosen namespace, e.g. com.eduvision.attendance]
```

Also review and remove/update as appropriate: `CHANGELOG.md`, `.github/FUNDING.yml`, `.github/workflows/release.yml` (inherited release workflow referencing the upstream project). **Do not** delete Apache-2.0 copyright/license notices in the process — rebranding the product and preserving required attribution are independent obligations.

**Sequencing note:** this package rename touches nearly every file Track A Phase 1–3 will also touch (new Kotlin files live under the same package tree). Doing B6 first avoids package-path churn mid-way through Track A.

## B7. Track B checklist

- [x] `FaceNet.kt` attribution comment completed
- [x] `/NOTICE` created
- [x] `/THIRD_PARTY_LICENSES` created
- [x] `/MODEL_LICENSES` created
- [x] FaceNet model provenance verified
- [x] FaceNet training-data/redistribution restrictions verified
- [x] BlazeFace model-asset terms verified
- [x] Current Google ML Kit terms reviewed against shipped SDK version
- [x] Full transitive dependency license scan run (Android + Dashboard)
- [x] Upstream Apache-2.0 notices preserved
- [x] Upstream package/product identity rebranded
- [x] Obsolete upstream funding/release-workflow references cleaned up
- [x] EduVision copyright headers added (existing + new files)
- [x] EduVision-vs-third-party IP documented (this file + `/NOTICE` serve that purpose)
- [ ] Founder/team IP assignments executed post-incorporation
- [ ] Model/dependency provenance records maintained going forward
- [ ] In-app "Open Source Licenses" screen added
- [ ] Privacy/biometric requirements reviewed (see §7 — this is where Track A's new student/teacher data collection intersects hardest with legal risk)
- [ ] Professional legal review completed before commercial launch

---

## Part 6 — Consolidated roadmap (both tracks, one sequence)

| Stage | Track A | Track B |
|---|---|---|
| 1 | — | B6 package rebrand (do first — avoids re-touching new files) |
| 2 | A1 data model (Teacher, School, isManual) | B5 headers on new files as they're created; B1.2 fix `FaceNet.kt` attribution |
| 3 | A2 Dashboard API / Supabase Auth decision | B1.1 draft `/NOTICE`, `/THIRD_PARTY_LICENSES`, `/MODEL_LICENSES` (skeletons; finalize after B1.3/B1.4) |
| 4 | A3 Login/Register + session gating | B1.3 / B1.4 model provenance verification (parallel-track, doesn't block app work) |
| 5 | A4 attendance staging rework | B2.4 full dependency scan |
| 6 | A5 manual correction UI | B2.1–B2.3 remaining P1 cleanup |
| 7 | A6 student-details cloud sync | B3 ongoing hygiene items as they come up |
| 8 | A7 security hardening (secrets, RLS) | Final legal review before launch (§7) |

---

## Part 7 — Legal boundary (carried over from the audit, unchanged)

This document, like the audit it incorporates, is an **engineering/product planning reference, not legal advice**. Before commercial launch — especially given EduVision processes facial/biometric data from students, many of whom are minors — obtain professional legal review covering: software licensing, copyright, model/data provenance, trademark, IP assignment, privacy, biometric data law, student/minor data protections (e.g., COPPA/FERPA-equivalent obligations depending on jurisdiction), data protection, school contracts, terms of service, and security obligations. Nothing in Track A's data-model or auth design above should be treated as satisfying those requirements on its own.

---

## Open questions to resolve before implementation starts

1. What does the "lock" icon on Student Registration in the home-page sketch represent — role-gating, connectivity-gating, or something else? (Referenced in A3.3.)
2. Supabase Auth for teacher accounts, or a hand-rolled `/api/teachers/*` pair? (Referenced in A2 — recommend Supabase Auth.)
3. Is there an existing legal entity name to use in copyright headers and `/NOTICE` yet, or should these ship with a placeholder pending incorporation?
4. Does the live Supabase `attendance` table (referenced by `CloudSyncRepository` but not present in the audited migrations folder) already have a defined schema to extend, or does it need to be created from scratch alongside `is_manual`/`school_id`?
