# Proper `tree` command for the project:
```bash
tree --gitignore -I 'assets|.git' -a 
```

# Rules:
1. Any `capacitor` plugin added to the root `package.json` should be added to the `package.json` in the MobileApp workspace.

## TODOs:
- [ ] Update the webhook subscription for the needed types of messages such as reply to ads (Intake) in both messenger and Instagram.
- [ ] Publish both the whatsapp app bot and the messenger app bot on meta for developers.
- [ ] Add: Add admin mcp write features for all endpoints and and bulk data.
- [ ] Add: Alumni students should have public profile pages with their username where their posts don't need approval.
- [ ] Fix: Scrolling to the top inside a modal popup interferes with pull to refresh mechanism in android.
- [ ] Add: Option to delete academic calendar year after creating it and naturally go back to the last available one.
- [ ] Add: custom date ranges to date field in the form component and use it in places like alumni sign up graduation date to start from 2016.
- [ ] Fix: form search select field does not filter properly due to remove vowels.
- [ ] Add: When any of the form usage shows an error, the container should smooth scroll to make sure the error is in view. Same for the vide upload progress bar.
- [ ] Add: search field to table header elements with optional prop that will only show rows where any colum contains the query.
- [ ] Add: Option to import data to db table via csv with required fields in the table component with add behaviour and a prop to allow import and a point to bulk add end point.
- [ ] The notfound arabic text does not use the correct font, also it should not be arabic in admin pages.
- [ ] search-select field should allow new values on prop.
- [ ] global is loading/submitting spinner state should be handled via hook context.
- [ ] Change the harvest in app browser icon from x to home icon.
- [ ] App opening normally should not navigate to the last opened page.
- [ ] Full page options selector should be changed for a compact options grid in the staff department selection page.
- [ ] In browser chat instead of the contact us form that matches the existing bot design.
- [ ] Greyscaling schoolevery in dark mode with a boolean toggle and a night icon at the bottom.
- [ ] Remove departments without a whatsapp number in the info system.
- [ ] Hide scrollbars platform wide.
- [ ] Use form component in alumni management popup.
- [ ] Drag and drop for file fields.
- [ ] Progress bar similar to video upload for collage photos upload with cancel option.
- [ ] Fix: Content-Security-Policy: The page’s settings blocked an inline script (script-src-elem) from being executed because it violates the following directive: “script-src 'self' https://challenges.cloudflare.com”. Consider using a hash ('sha256-O+8D+Fyfyg5FMqShKccJ0wTnQ7ALrwd3ZE3d7L75ch0=') or a nonce in fileviewer for files.
- [ ] Fix transcoding/encoding video breaks the file audio with weird noise.
- [ ] Fix upload video field and frame selector field not working for video types before processing.
- [ ] Fix Frame selector not showing loading indicator when loading the frame on change.
- [ ] Fix video link should not work for a file that is still processing.
- [ ] Fix: Videos with tall aspect ratio don't have a max height and so their photo collage takes up the entire frame.
- [ ] Add a narrow/wide option for video uploads similar to photo collages and update the css accordingly.
- [ ] Editing Photo Collage or Videos should also allow editing the position/order.
- [ ] Allow interactive solves on turnstile.
- [ ] Drag and drop for file fields.
- [ ] Progress bar similar to video upload for collage photos upload with cancel option.
- [ ] Fix: Content-Security-Policy: The page’s settings blocked an inline script (script-src-elem) from being executed because it violates the following directive: “script-src 'self' https://challenges.cloudflare.com”. Consider using a hash ('sha256-O+8D+Fyfyg5FMqShKccJ0wTnQ7ALrwd3ZE3d7L75ch0=') or a nonce in fileviewer for files.
- [ ] Fix transcoding/encoding video breaks the file audio with weird noise.
- [ ] Fix upload video field and frame selector field not working for video types before processing.
- [ ] Fix Frame selector not showing loading indicator when loading the frame on change.
- [ ] Fix video link should not work for a file that is still processing.
- [ ] Fix: Videos with tall aspect ratio don't have a max height and so their photo collage takes up the entire frame.
- [ ] Add a narrow/wide option for video uploads similar to photo collages and update the css accordingly.
- [ ] Editing Photo Collage or Videos should also allow editing the position/order.
- [ ] Allow interactive solves on turnstile.
- [ ] Add an admission requirements endpoint from the info system and/or the info system file.
- [ ] Syncing locales is useless when assets are already synced in the deployment script.
- [ ] SchoolEverywhere in admin side bar should open the in app browser accordingly.
- [ ] Swipe on videos should also work on touch/hover in mobile and the loading indicator should be a progress bar at the top because it currently hidden by play icon.



