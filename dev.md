# Proper `tree` command for the project:
```bash
tree --gitignore -I 'assets|.git' -a 
```

# Rules:
1. Any `capacitor` plugin added to the root `package.json` should be added to the `package.json` in the MobileApp workspace.

## TODOs:
- [ ] Add: Add admin mcp write features for all endpoints and and bulk data.
    - [ ] Add a generate oauth token in the admin settings modal. Use the exisitng style and use stepup. The token can be deleted or rotated but the user could not have more than one token at a time.
    - [ ] Make it so that if the mcp server access request includes the oAuth Client ID (username) and oAuth Client Secret (generated token) then the mcp server exposes the tools/endpoints that match the username permission levels only.
    - [ ] Create all the functions/tools for each single endpoint the admin already has in the backend and connect them to work in the mcp server. Note that add, edit/update, and delete operations should all allow bulk operations all at once.
- [ ] Add: Alumni students should have public profile pages with their username in the url path where their posts don't need approval. The url should appear in their profile page to share with others and posts should get a new badge for that page.
- [ ] Add: Option to delete academic calendar year after creating it and naturally go back to the last available one.
- [ ] Add: optional custom date ranges to date field in the form component and use it in places like alumni sign up graduation date to start from 2016.
- [ ] Fix: form search select field does not filter properly due to removed vowels.
- [ ] Add: search field to table header elements with optional prop that will only show rows where any colum/row contains the query.
- [ ] search-select field should allow non existing values if an optional prop is passed.
- [x] Change the harvest in app browser icon from x to home icon in both iOS and android.
- [ ] App opening normally should not navigate to the last opened page.
- [ ] Full page options selector should be changed for a compact options grid in the staff department selection page using the same image urls that the academics departments used where needed.
- [ ] In browser chat instead of the contact us form that matches the existing bot design from whatsapp and instagram.
- [ ] Greyscaling schoolevery in app browser in dark mode with a boolean toggle for developer to completely disable and a night icon at the bottom for user to toggle if needed.
- [x] Hide scrollbars platform wide.
- [ ] Drag and drop for all the file fields with proper UI.
- [ ] Progress bar similar to video upload for collage photos upload with cancel option.
- [ ] Fix: Content-Security-Policy: The page’s settings blocked an inline script (script-src-elem) from being executed because it violates the following directive: “script-src 'self' https://challenges.cloudflare.com”. Consider using a hash ('sha256-O+8D+Fyfyg5FMqShKccJ0wTnQ7ALrwd3ZE3d7L75ch0=') or a nonce in fileviewer for files.
- [ ] Fix transcoding/encoding video breaks the file audio with weird noise.
- [ ] Fix upload video field and frame selector field not working for some video types/codecs/containers before processing.
- [ ] Fix Frame selector not showing loading indicator when loading the frame on change.
- [ ] Fix video link column/row should not work for a file that is still processing.
- [ ] Fix: Videos with tall aspect ratio don't have a max heighted containers and so their photo collage takes up the entire view port even in mobile view.
- [ ] Add a narrow/wide option for video uploads similar to photo collages and update the css accordingly.
- [ ] Editing Photo Collage or Videos should also allow editing the position/order.
- [ ] Allow interactive solves on turnstile.
- [ ] Add an admission requirements endpoint from the info system and/or the info system file and connect it to the corresponding public page(s).
- [x] Syncing locales is useless when assets are already synced in the deployment script, isn't it? or does the sha generated defer?
- [x] SchoolEverywhere in admin side bar should open the in app browser accordingly.
- [ ] Swipe on videos should also work on touch/hover in mobile and the loading indicator should be a progress bar at the top because it currently hidden by play icon.
- [ ] Separate BOT_ON for whatsapp and messenger/Instagram.
- [ ] Add a new column to the info system departments table available_to_chat_with where if it false then the bot should not show it in the chat with department menu for now student affairs, american department, and accounting are off. Bot should indicate that some department numbers are hidden because they are not available to chat with
- [ ] Look into adding static content in the info system to edit things like the tuition fees disclaimer or the faqs or important notes used here and there in the bot like the minimum registration age requirement.
- [ ] SiteVerify still flagged as sometimes not working on cloudflare.

