# Proper `tree` command for the project:
```bash
tree --gitignore -I 'assets|.git' -a 
```

# Rules:
1. Any `capacitor` plugin added to the root `package.json` should be added to the `package.json` in the MobileApp workspace.

## TODOs:

Node done at all yet but not urgent:
- [ ] Add: Add admin mcp write features for all endpoints and and bulk data.
    - [ ] Add a generate oauth token in the admin settings modal. Use the exisitng style and use stepup. The token can be deleted or rotated but the user could not have more than one token at a time.
    - [ ] Make it so that if the mcp server access request includes the oAuth Client ID (username) and oAuth Client Secret (generated token) then the mcp server exposes the tools/endpoints that match the username permission levels only.
    - [ ] Create all the functions/tools for each single endpoint the admin already has in the backend and connect them to work in the mcp server. Note that add, edit/update, and delete operations should all allow bulk operations all at once.
- [ ] In browser chat instead of the contact us form that matches the existing bot design from whatsapp and instagram.

Need to be implemented but not in plan yet (maybe important except for handover):
- [ ] On Instagram, when the chat bot responsds to the user the interactive buttons are shown to both the user and the sender (the page/account that the bot is sending from).
- [ ] Allow handover using the new meta protocol from the bot to a human user (also not urgent).
- [ ] Make the bot only reply within opening hours with a new setting as well and send a generic reply outside of opening that can be edited in the static content info system (read the full updateinfosystem file and the config-tmp file to understand).
- [ ] Add more info to the static content of the info system such as the message that is sent to select from menu or the message to select a language etc... (read the full updateinfosystem file and the config-tmp file to understand).
- [ ] Library should also get a delete all end point.

Node done at all yet but important now:
- [ ] Add: Alumni students should have public profile pages with their username in the url path where their posts don't need approval. The url should appear in their profile page to share with others and posts should get a new badge for that page.
- [ ] Greyscaling schoolevery in app browser in dark mode with a boolean toggle for developer to completely disable and a night icon at the bottom for user to toggle if needed.
- [ ] Fix upload video frame selector field not working for some video types/codecs/containers before processing. No need to actually make it work just show a message that say it will allow selecting in edit after processing.
- [ ] Fix signing in with biometrics in the capacitor app failing with "Human verification failed" on both the admin login and the alumni login. `pendingTurnstileToken` only lives for the duration of one Form submit, so every caller outside that window sent no token to an endpoint that required one. Four callers were affected, not just biometrics: both biometric logins, and the "Resend code" button on both password reset screens. The two logins now require a token only when `X-Client-Platform` is not `native`, so the web stays fail-closed; the two resend endpoints no longer require one at all since they are already gated on a live reset challenge and rate limit their own sends (will test in production, needs a store build for the app half).
- [ ] Add an admission requirements endpoint from the info system and/or the info system file and connect it to the corresponding public page(s). Should work with the existing offline prefetch and api cache in the mobile app as well the assistant layer, mcp, gemini/siri shortcuts and appfunctions and entities and indexing etc...

Kinda done, but needs more testing in production:
- [x] Progress bar similar to video upload for collage photos upload with cancel option (will test after heic is fixed).
- [x] Fix transcoding/encoding video breaks the file audio with weird noise. The audio is no longer re-encoded at all: `-c:a copy` whenever the source codec is MP4-safe. Verified against the seven real videos in Downloads/Harvest Schools/Vids (all stereo AAC, AV1/VP9 video) through the actual `media_probe_video` path: every one takes the copy branch, and the output audio stream MD5 matches the source byte for byte. Sources whose codec cannot be muxed into MP4 (PCM etc.) still encode, but downmix with `-ac 2` first so the bitrate is not split across channels (will test in production).
- [x] Add: Tables with action, edit or delete buttons should keep those columns sticky to the right by default, the same way the first column is sticky to the left, so only the columns in between scroll (i think this mostly work but to confirm i need to change the sticky row and column, i remember i used to be able to do that by changing one number in the code but you seem to have changed it in this session previous commits, i think it should be editable modfiable via a prop passed to the table like maxStickyColumnIndex={7} or maxStickyRowIndex={4} or something like that where the default is only the first row and the first column as currently is the case when allowsticky is passed)
- [x] Fix Frame selector not showing loading indicator when loading the frame on change (will test in production).
- [x] Editing Photo Collage or Videos should also allow editing the position/order. Root cause: "Choose the position myself" always sent `after_id: 0`, so `gallery_apply_placement` matched no row and fell through to the end of the list — which is why it looked like it "did not work at all", and why the admin list (reloaded, showing the new wrong order) disagreed with the public page (cached 5 minutes, still showing the old one). The rule-injected "Place after" select never got its ref: `getCommonInputProps` read `fieldRefs.current[field.id]` before the effect that creates it, and unlike Careers this modal has no file or date field to force a second render, so React bailed out every time and `.current` stayed null. `getCommonInputProps` now uses the `ensureFieldRef` helper that was already in the file. Verified in Chrome on both collages and videos by capturing the request body: `after_id` now carries the real id and the row lands exactly where it was placed.
- [x] SiteVerify still flagged as sometimes not working on cloudflare (needs time to confirm).
- [x] Add: "Import From CSV" next to the existing Export CSV on every admin table/list that has an add option, driven by an optional prop and a matching bulk add endpoint per domain. A wrongly formatted or incomplete CSV must come back with a descriptive error naming the offending row and column plus an example of correct usage for that endpoint's fields. The MCP bulk tools must not reuse the CSV endpoint, they take JSON, and only share the underlying add function (you need to provide the data for me to test this one incuding faulty data to see the errors i would get).
- [x] Add: Accept iPhone HEIC photos. The production ImageMagick (`convert`) has no HEIC/HEIF/AVIF delegate, so they are converted to JPEG in the browser via a lazily imported `heic2any` before upload; the server only ever receives JPEG.

