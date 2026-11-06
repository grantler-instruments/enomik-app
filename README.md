# enomik-app

Web app for the **enomik 3000**, a DIY wireless MIDI kit built on ESP32 boards and
ESP-NOW. It configures boards over USB MIDI, flashes their firmware, helps debug a
setup and teaches the whole thing in a tutorial. It runs in the browser, needs no
install and works offline as a PWA.

Live: <https://grantler-instruments.github.io/enomik-app/>  
Firmware: [ESP-NOW-MIDI](https://github.com/grantler-instruments/ESP-NOW-MIDI)

## What's in it

| Route | Page |
| --- | --- |
| `/` | Home |
| `/getting-started` | Getting started |
| `/tutorial/*` | Tutorial: chapters with live, embedded tools |
| `/configurator` | Configure a board's pins, peers and global settings |
| `/inspector` | Read a board's configuration back, live input values |
| `/debugger` | MIDI Composer, MIDI monitor, serial monitor |
| `/uploader` | Flash firmware over Web Serial |
| `/tester` | Step-by-step test for a freshly built board |
| `/kits` | Kits and board diagrams |
| `/nfc` | NFC tags |
| `/grantulator` | Granular synth (hidden, linked from the Debugger) |
| `/mpc` | 4x4 sample pads (hidden, linked from the Debugger) |
| `/patcher` | MIDI patcher, a minimal Pure Data (hidden, linked from the Debugger) |

The browser needs Web MIDI and Web Serial: Chrome, Edge or another Chromium
browser. The app warns on Firefox and Safari, which lack Web Serial (Safari also Web
MIDI).

## Development

Requires **Node 22.19 or newer** (CI uses 24): jsdom's `undici` needs it, tests fail
on older versions.

```sh
cd app
npm install     # also installs the git hooks
npm run dev     # http://localhost:5173/enomik-app/
```

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Vitest, once (`npm run test:watch` to keep watching) |
| `npm run coverage` | Tests with a coverage report in `coverage/` |
| `npm run lint` | Biome: lint and format check (`npm run check:fix` fixes) |
| `npm run build` | Type check (`tsc -b`) and production build to `dist/` |
| `npm run preview` | Serve the build |

Type check alone: `npx tsc --noEmit -p tsconfig.app.json` (the root `tsconfig.json`
only holds project references).

### Hooks and CI

- **pre-commit**: lint-staged runs `biome check --write` on staged files.
- **pre-push**: lint, tests and build. A push takes a while.
- **Test** workflow (push to `main`, pull requests): lint, tests, build.
- **Deploy** workflow (push to `main`): builds and publishes to GitHub Pages. There is
  no separate release step: `main` is what's live.

## Structure

Everything lives in `app/`.

```
src/
  App.tsx              routes
  i18n.ts              UI strings, all languages
  i18n.tutorial.ts     tutorial strings, spread into each language
  components/          pages (Configurator.tsx, Debugger.tsx, …) and their parts
    common/            SectionCard, CollapsibleSection
    layout/            PageLayout: title, info hint, sticky toolbar
    tutorial/          chapters.tsx (the chapter tree) and content blocks
    configurator/ inspector/ pinmapping/ kits/ tester/ grantulator/
  store/               zustand stores
    midi.ts            Web MIDI access, message log, device protocol (SysEx)
    io.ts              pin configuration being edited
    serial.ts          Web Serial: monitor and flashing (esptool-js)
    device.ts          connected device, firmware compatibility
    grantulator.ts mpc.ts …
  hooks/               useToast, useGrantulatorEngine, useMpcEngine, …
  utils/               pure logic: MIDI parsing, pinouts, audio patches, …
  test/                test setup and render helper
public/
  firmware/            firmware binaries, see below
  tutorial/            tutorial photos and screenshots
  samples/             audio samples (CC0, see LICENSE.md there)
```

Conventions:

- A page wraps its content in `PageLayout`. Pages that also appear in the tutorial
  take an `embedded` prop: no page chrome, toolbar inline.
- `src/pages.test.tsx` renders every route and tutorial page in the whole app, in
  every language, and fails on crashes, React errors (like invalid HTML nesting)
  and translation keys that don't exist. A new page or
  tutorial section is covered automatically if it has an `<h1>` (`PageLayout`'s
  title).
- Logic that can be pure goes to `utils/` and gets tests next to it
  (`foo.ts` / `foo.test.ts`). Tests run in node; component tests opt into jsdom per
  file.
- State shared between pages lives in a store; stores that persist use zustand's
  `persist` (localStorage). Audio samples go to IndexedDB (`utils/sampleStore.ts`).
- Code comments say why, not what.

## Translations

English, German, Spanish and Chinese. Strings are in `src/i18n.ts`; the tutorial
and some tools have their own files, spread into each language there:
`i18n.tutorial.ts`, `i18n.nfc.ts`, `i18n.audio.ts` (Grantulator, MPC) and
`i18n.tester.ts`. Every language needs every key:
`src/i18n.test.ts` fails on missing or extra keys, lost `{{placeholders}}` and empty
strings. To add a language, add a block with all keys in each of these files.

## Tutorial

Chapters are a tree in `src/components/tutorial/chapters.tsx`:
`{ id, titleKey, Content, sections? }`. The `id`s build the URL
(`/tutorial/tools/mpc`). Content is made of the blocks in `blocks.tsx`
(`Paragraphs`, `Steps`, `Note`, `LiveDemo`, …), with text keys in
`i18n.tutorial.ts`. Code examples link to their source in the ESP-NOW-MIDI repo.

## Firmware

`public/firmware/` holds one folder per firmware version (`0-19-0`, …) with the
binaries and a `manifest.json` (boards, roles, flash options), plus `versions.json`
listing the versions, newest first. The Firmware Uploader reads these.

The ESP-NOW-MIDI repo's release workflow commits new versions here. Every version
in `versions.json` needs a `manifest.json`, or the uploader fails with a 404: some
older releases came without one and needed a copy of the previous manifest.
`src/utils/firmware.test.ts` catches that in CI: it checks that `versions.json`
lists every folder newest first, and that each version has a manifest and every
binary it names. `public/firmware/` is excluded from Biome, since those files are
generated.

Firmware isn't precached by the service worker (it's large); it's always fetched
from the network.

## Audio

The Grantulator and the MPC run on [Elementary Audio](https://www.elementary.audio/).
Its WebAssembly is big, so both pages, and the tutorial sections that embed them,
load lazily: Elementary is only fetched when one of them opens. The patches are pure
functions (`utils/grantulator.ts`, `utils/mpc.ts`), tested with Elementary's offline
renderer.
