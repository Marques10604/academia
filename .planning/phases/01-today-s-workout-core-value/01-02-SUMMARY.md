---
phase: 01-today-s-workout-core-value
plan: 02
subsystem: install-shell
tags: [pwa, manifest, service-worker, css, node-test]
status: complete

requires: []
provides:
  - "styles.css: dark theme and the whole shared class vocabulary (48 px tap targets, pull-to-refresh blocked)"
  - "manifest.webmanifest + provisional generated icons + .nojekyll (installable standalone pt-BR PWA identity)"
  - "sw.js: versioned atomic precache, cache-first, no takeover of open clients"
  - "tools/stamp-sw.mjs (+ --check) and src/version.js APP_VERSION"
  - "package.json (ES module, node >=22, no dependencies)"
affects: [01-03, 01-04, 01-05, 01-06]

actuals:
  tokens: 11000
  tasks: 3
  commits: 3
plan_head_before: f53e1e536e69e2fc45018e6ac62ee6201e65603c
plan_head_after: c3ceefeb57aeda2be7156d5e57d2001b3247e2ae

tech-stack:
  added: []
  patterns:
    - "sw.js VERSION and ASSETS are generated from src/version.js and the directory tree by tools/stamp-sw.mjs; --check is the freshness gate"
    - "Icons generated with node:zlib + a hand-built CRC table (no dependencies)"

key-files:
  created:
    - package.json
    - styles.css
    - manifest.webmanifest
    - .nojekyll
    - icons/icon-192.png
    - icons/icon-512.png
    - tools/make-icons.mjs
    - tools/stamp-sw.mjs
    - src/version.js
    - sw.js
    - test/assets.test.js
  modified: []

key-decisions:
  - "stamp-sw normalizes CRLF to LF before comparing, so --check is stable under Windows autocrlf"
  - "sw.js comments avoid the literal word skipWaiting so the grep acceptance check (count == 0) is honest"

requirements-completed: [FUND-01, FUND-03]

coverage:
  - id: D1
    description: "styles.css defines every shared class with 48 px tap targets and overscroll-behavior-y: contain"
    requirement: FUND-01
    verification:
      - kind: unit
        ref: "node --test test/assets.test.js (styles)"
        status: pass
  - id: D2
    description: "Manifest: id academia, standalone, relative start_url/scope, 192/512 icons (512 also maskable), real PNGs with matching IHDR sizes"
    requirement: FUND-01
    verification:
      - kind: unit
        ref: "node --test test/assets.test.js (manifest, .nojekyll)"
        status: pass
  - id: D3
    description: "sw.js precaches a stamped list under academia-<VERSION>, cache-first, no skipWaiting / clients.claim, never lists tools/test/.planning"
    requirement: FUND-03
    verification:
      - kind: unit
        ref: "node --test test/assets.test.js (service worker)"
        status: pass
  - id: D4
    description: "stamp-sw --check exits 1 with the Portuguese message when sw.js is stale, 0 when fresh"
    requirement: FUND-03
    verification:
      - kind: manual-script
        ref: "set VERSION to 9.9.9 -> --check rc=1; re-stamp -> --check rc=0"
        status: pass
---

# Phase 1 Plan 02: Install shell - styles, manifest, icons, versioned service worker Summary

**Dark thumb-friendly stylesheet with the full shared class vocabulary, a standalone pt-BR manifest with generated provisional icons, and a hand-written versioned atomic-precache service worker kept complete by tools/stamp-sw.mjs --check.**

## Accomplishments

- `styles.css` defines all classes from the plan interface contract (.screen through .set-row.ramp), 48 px minimum tap targets, 64 px `.btn-big`, and `overscroll-behavior-y: contain` to stop pull-to-refresh reloads mid-workout.
- `manifest.webmanifest`: `id: academia`, standalone, portrait, relative `start_url`/`scope`, icons 192 (any), 512 (any) and 512 (maskable as a separate entry).
- `tools/make-icons.mjs` writes valid RGBA PNGs (dumbbell inside the central 60%, maskable-safe); visually checked. Provisional until Phase 4 (LANC-01).
- `sw.js`: `const VERSION` on line 1, `ASSETS` between `// ASSETS-START` / `// ASSETS-END`, atomic `cache.addAll` install, old `academia-*` caches deleted on activate, cache-first with `ignoreSearch`, navigation falls back to cached `./index.html`, cross-origin and non-GET ignored, no forced activation and no client takeover (a new version waits until the app is fully closed).
- `tools/stamp-sw.mjs` copies `APP_VERSION` into sw.js and lists `./`, `index.html`, styles, manifest, `icons/**`, `src/**` (18 files right now, including the 01-01 tracer files already on disk); `--check` guards freshness.

## Verification

```
$ node --test
ℹ tests 4
ℹ pass 4
ℹ fail 0
$ node tools/stamp-sw.mjs        -> sw.js v0.1.0 com 18 arquivos
$ node tools/stamp-sw.mjs --check -> sw.js em dia (rc 0)
  (after forcing VERSION 9.9.9)   -> sw.js desatualizado: rode node tools/stamp-sw.mjs (rc 1)
$ node tools/smoke.mjs core-loop
PASS 01-core-loop
smoke: 1 passed, 0 failed
```

Acceptance greps: `"type": "module"` = 1, `"engines"` = 1, `overscroll-behavior-y` >= 1, `badge-calibracao` >= 1, `"display": "standalone"` = 1, `maskable` >= 1, `.nojekyll` present, `icon-512.png` present, `./styles.css` in sw.js = 1, `./manifest.webmanifest` in sw.js = 1, `skipWaiting` = 0, `academia-` = 2, `APP_VERSION = '0.1.0'` = 1.

## Deviations from Plan

None - plan executed as written. Notes:

- Because 01-01 already landed, the first stamp listed 18 files (tracer src files included) instead of only this plan's own files; 01-03 must still re-stamp after adding its files and gate on `--check`.
- `index.html` does not yet link `styles.css`, the manifest or the icon, nor register `sw.js`; that wiring is 01-03's scope (per the plan's coupling note).

## Pending Human Checks

- Install-on-phone and offline behavior of the worker cannot be verified until 01-03 registers it and publishes; covered by the consolidated phone check in 01-06.

## Known Stubs

None. Icons are intentionally provisional (replaced in Phase 4, LANC-01).

## Threat Flags

None. T-01-03 mitigated (atomic precache, old caches deleted, no forced activation or takeover, stamp --check); T-01-15 mitigated (test asserts tools/, test/, .planning, .claude, package.json are never listed); T-01-SC mitigated (no package installs).

## Self-Check: PASSED

All 11 plan files exist; commits 8ddbbb5, cd1b089 and c3ceefe are ancestors of HEAD.
