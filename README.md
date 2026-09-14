# Divoolee — Magic Ascent v3

Static HTML/CSS/JavaScript, ready for GitHub Pages. No API key, build step, or database.

## GitHub Pages
1. Extract this ZIP locally (do not upload the ZIP itself).
2. Create a repository, public if using GitHub Free.
3. Upload all extracted files and the assets folder. index.html must be at the repository root.
4. Commit changes. Go to Settings → Pages → Deploy from a branch → main → /(root) → Save.
5. Use the Visit site URL shown by GitHub. Publication may take up to 10 minutes.

Official docs: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
The included .nojekyll file disables Jekyll processing. All game references are relative and work in a repository subpath.

## What changed in v3
- Reward selection appears only after all three lives have been lost.
- Live score and route reset, but the completed run result is eligible for ONE prize until the next run or reload.
- Higher score speeds gameplay up to 3.6x. Platforms narrow sooner; moving/crumbling platforms appear earlier. Collision simulation uses small substeps to avoid tunneling at high speed. Fire warning duration stays at 0.85 real seconds.
- Smooth camera follow, blended sprite poses, body squash/stretch and lean.
- Tap the home character to turn from back to front through eight rendered views; tap again to reverse. This is a multi-view 2.5D animation, not a free-rotating 3D mesh.

## Controls
Auto-bounce. Arrows/A/D or touch arrows/drag to steer. Space/Up/Boost for an extra leap every 2.6 seconds. P pauses. Audio begins after user interaction; master mute and separate music toggle are provided.

## Demo restrictions
Registration is demonstrative; no name or phone number is stored or transmitted. Best score, settings and a demo claim receipt are local to this browser. One claim locks the campaign across future runs on this browser. Clearing storage or switching devices bypasses this, so it is NOT identity verification or anti-cheat. Codes are DEMO only. A real prize campaign needs a server, verified identity, score validation, inventory and an atomic unique claim per player/campaign. GitHub Pages does not supply that backend.

## Local preview
With Python 3: python3 start-local.py (Windows: py -3 start-local.py). Opens http://127.0.0.1:8790/. Keep the process running.

## Files
engine.js: physics, speed and reward thresholds. rewards.js: local lock. audio.js: original procedural music and effects. game.js: UI and rendering. turntable.js: interactive character views. style.css / index.html: presentation. Font files and their OFL license are bundled. Assets require no runtime downloads. No original show soundtrack files are included.

15 logic tests: node --test verification/test-ascent.cjs. UI wiring was checked in a simulated DOM; front-facing turn and post-run reward view were observed in a browser. Sound quality and difficulty across devices still need playtesting.

Persian instructions: README-FA.html.
