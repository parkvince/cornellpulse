# CornellPulse real-device and assistive-technology test plan

Version: **2026-08-09.1**  
Status: **INSTRUCTIONS/TEMPLATE ONLY — NO REAL-DEVICE OR ASSISTIVE-TECH EXECUTION CLAIMED**

Use the release-candidate staging URL/artifact. Never use real crisis disclosures or personal data. For every run record tester, date/time, app SHA/artifact, device model, OS/browser/AT versions, orientation, network mode, text size/zoom, result, screenshot/video/log path, defect ID, and retest evidence.

## Shared route/state script

Test onboarding and reset; home; empty and populated History & Privacy; check-in initial validation, Back preservation, native radio/checkbox touch/mouse/keyboard operation, optional text deletion, ordinary and crisis result, save/replace/complete/dismiss/reminder/export/delete; resource search/filter/open-now/detail/call/text/directions/website; consent on/off/withdrawal; offline warm and cold start; failed/slow/rate-limited/unauthorized/maintenance API states; disabled `/peer`, `/peer/signup`, `/peer/reference`, `/admin`; malformed resource deep link; and 404. Verify Immediate help from every major screen and that it distinguishes 911, 988, Cornell Health, and Cornell Public Safety.

## iPhone Safari and PWA

- Minimum targets: current supported small-screen iPhone and modern notched iPhone on current supported iOS.
- Safari at default and 200% page zoom/text size; portrait/landscape; light/dark OS settings if supported; reduce motion; larger text; VoiceOver separately.
- Add to Home Screen, standalone launch, offline warm/cold launch, update after a new service worker, safe areas, link handoff to Phone/Messages/Maps, virtual-keyboard focus/scroll, history persistence and deletion.

## Signed Capacitor iOS build on macOS/Xcode

- On supported macOS/Xcode, run dependency sync, build/archive with the approved bundle/team/signing profile, install on a physical supported iPhone, and record build/signing output without certificates/private keys.
- Verify App Transport Security, app icons/splash, orientation/safe areas, external schemes, offline behavior, update path, privacy manifest/permission prompts, crash logs, and the shared route script.

## Android emulator and physical Android

- Test a 320px-class emulator, a current Pixel-class emulator, and at least one physical supported Android device/API level.
- Verify Chrome/PWA install and signed Capacitor debug/release candidate as applicable; font/display scaling, TalkBack, switch/keyboard, WebView version, back navigation, keyboard resize, safe areas/cutouts, link intents, offline/update, backup-disabled behavior, and shared route script.

## Assistive technology

- **VoiceOver:** Safari/PWA and signed iOS build; rotor landmarks/headings/links/forms, labels/hints/states, focus restoration, error/status announcements, modal trap/Escape-equivalent, reading order, crisis actions.
- **TalkBack:** Chrome/PWA and Android app; explore-by-touch, swipe order, labels/states, forms, dialogs, announcements, external intents, crisis actions.
- **NVDA:** current Firefox and Chrome on Windows; browse/focus modes, landmarks/headings/forms, native controls, dialog focus, live regions, table/list semantics, zoom/reflow.
- **Keyboard-only:** Tab/Shift+Tab/Enter/Space/arrows/Escape; no focus trap except modal; visible focus; no pointer-only action; 200% and 400% zoom/reflow.
- **Reduced motion/magnification:** OS/browser reduce-motion, 200% text, 400% zoom at 1280 CSS pixels, high-contrast/forced-colors where applicable.

## Evidence template

Platform/device/AT: __________________  OS/browser versions: ________________________________  
Artifact/SHA and staging URL: ______________________________________________________________  
Viewport/orientation/zoom/text/reduced-motion: _____________________________________________  
Shared script result: [ ] Pass  [ ] Fail  [ ] Blocked  
Accessibility result: [ ] Pass  [ ] Fail  [ ] Blocked  
Evidence paths: __________________________________________________________________________  
Defects and severity: ____________________________________________________________________  
Tester/signature: __________________________________________  Date: _________________________  
Independent retest/signature: _______________________________  Date: _________________________
