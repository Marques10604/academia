---
phase: 02-backup-history-check-in
plan: 01
subsystem: backup-and-restore
tags: [backup, restore, indexeddb, schema-2, share-sheet, dailyLogs]
status: complete

requires: []
provides:
  - "src/domain/backup.js: pure backup format (buildBackup, parseBackup, backupSummary, prepareRestore, backupStatus, backupFileName, BACKUP_STORES, BACKUP_NUDGE_WORKOUTS)"
  - "Schema 2 database with the dailyLogs store (create-if-missing); readStores and replaceStores, each one transaction"
  - "#/backup screen: download, Android share sheet as .txt, file import with one-line summary and confirm"
  - "Restore entry on the first screen, 'Ultimo backup' line on Today and Settings, reminder after 3 workouts without a backup"
affects: ["02-02", "02-03"]

actuals:
  tokens: 28000
  tasks: 3
  commits: 3
plan_head_before: 273d1f88ac2126840c600d2cc4cc874c6b5d02ac
plan_head_after: 675b425ed1a006968cde98a2626f132dab367c03

tech-stack:
  added: []
  patterns:
    - "parseBackup validates only and keeps every accepted row verbatim (no field picking), so restored rows deep-equal exported rows"
    - "Row checks per store run a field only when it is present (partial exercisePrefs rows are normal)"
    - "New stores must be added to BACKUP_STORES; 08-backup compares that list with the real database"
    - "Restore = clear + put of every store in ONE readwrite transaction; any error aborts and leaves current data untouched"

key-files:
  created:
    - src/domain/backup.js
    - src/ui/backup.js
    - test/backup.test.js
    - tools/e2e/08-backup.mjs
  modified:
    - src/data/db.js
    - src/domain/dates.js
    - src/app.js
    - src/ui/onboarding.js
    - src/ui/today.js
    - src/ui/settings.js
    - sw.js

key-decisions:
  - "Backup envelope: {app:'academia', format:1, schemaVersion, appVersion, exportedAt, counts, stores}; the in-progress draft ('active') is never exported"
  - "Share sends the same text as text/plain .txt (Chrome on Android rejects application/json); 'Baixar arquivo' is always rendered"
  - "After a restore, lastBackupAt = the file's exportedAt, so the 3-workout counter restarts from the backup's own date"
  - "'#/backup' passes the onboarding gate so a wiped phone can restore before onboarding"
  - "Version stays 0.2.1; 02-03 bumps to 0.3.0 and publishes"

requirements-completed: [BKP-01, BKP-02, BKP-03]

duration: ~1h
completed: 2026-11-18
---

# Phase 2 Plan 1: Backup and restore Summary

One-file JSON backup of every store (download or Android share sheet as .txt), restored from the first screen of a wiped app in one transaction, with schema 2 (dailyLogs) and the "ultimo backup" age plus a 3-workout reminder.

## What was built

- **Task 1 (tracer, 33d5404):** pure `backup.js` with unit tests, `readStores`/`replaceStores` in `db.js`, the `#/backup` screen, `#/backup` through the onboarding gate, and "Já tenho um backup — restaurar" on the first screen. E2E 08-backup proves export -> wipe -> restore gives identical stores.
- **Task 2 (726842e):** `SCHEMA_VERSION = 2` with a create-if-missing `dailyLogs` store (keyPath `localDate`), validated in `parseBackup` and counted in the summary line ("2 check-ins"); restore refused while a workout draft exists (at preview and again at confirm). E2E now builds a real schema-1 database first and proves the upgrade keeps data; refusal paths (not JSON, other app, schema 99) and the open-workout case are covered.
- **Task 3 (675b425):** `backupStatus` / `BACKUP_NUDGE_WORKOUTS = 3`, `backupAgeText`, age line on Today, Settings and the backup screen, reminder card with "Fazer backup agora", the share button (shown only when `navigator.canShare` accepts a text/plain file), `sw.js` re-stamped (35 files).

## Plan-checker corrections applied

1. `exercisePrefs` validated field by field only when present; unit tests and the E2E seed include a note-only row and a unit-only row, and both round-trip.
2. `parseBackup` is validate-only; unit test with extra session/entry/set fields (`restEndsAt`, unknown fields) shows rows come back deep-equal.
3. Second guard `grep -c "'accept'\|\"accept\"" src/ui/backup.js` = 0 (together with the `accept\s*:` guard = 0).

## Verification (final run)

- `node --test`: pass 92, fail 0
- `node tools/smoke.mjs`: PASS 01-core-loop ... 08-backup, `smoke: 9 passed, 0 failed`
- `node tools/stamp-sw.mjs --check`: `sw.js em dia`, exit 0
- Guards: `innerHTML` files in src = 0; both `accept` greps = 0; canShare 4, text/plain 3, sw.js lists both new modules.

## Deviations from Plan

None in behavior. Notes:

- **[Rule 3 - E2E harness]** Part B navigates to `#/hoje` when the page is already on that hash, which is a same-document navigation with no re-render; added `page.reload()` before asserting the reminder. `deleteDatabase` worked in headless Chrome, so the `clearSiteData` fallback was not needed.
- **Flaky existing test:** `06-unit-placa` failed once in a full run ("faixa em placa") and passed alone and in the next full run; not caused by this plan (no change touches the workout screen). Not investigated further.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model (T-02-01 size cap, validation and text-node rendering; T-02-03 single transaction and confirm; T-02-04 create-if-missing upgrade proven by E2E Part A).

## Pending human checks (phone only)

After 0.3.0 is published (end of 02-03), on the Android phone: Config -> "Backup e restauração" -> "Enviar (Drive, WhatsApp…)" and send it to yourself on WhatsApp; then "Baixar arquivo". Then pick the downloaded .json, and the .txt saved from WhatsApp, with the file picker. Expected: the share sheet lists Drive and WhatsApp, the download lands in Downloads, the picker does not grey out either file, the summary line shows the right workouts and dates, and "Cancelar" leaves everything unchanged. (Share sheet and system file picker cannot run in headless Chrome; text/plain sharing is MEDIUM confidence in STACK.md.)

## Self-Check: PASSED

- Files exist: src/domain/backup.js, src/ui/backup.js, test/backup.test.js, tools/e2e/08-backup.mjs
- Commits exist: 33d5404, 726842e, 675b425
