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
- [ ] In browser chat instead of the contact us form that matches the existing bot design from whatsapp and instagram.
- [ ] Add: Alumni students should have public profile pages with their username in the url path where their posts don't need approval. The url should appear in their profile page to share with others and posts should get a new badge for that page.
- [ ] Add an admission requirements endpoint from the info system and/or the info system file and connect it to the corresponding public page(s). Should work with the existing offline prefetch and api cache in the mobile app as well the assistant layer, mcp, gemini/siri shortcuts and appfunctions and entities and indexing etc...
- [ ] Greyscaling schoolevery in app browser in dark mode with a boolean toggle for developer to completely disable and a night icon at the bottom for user to toggle if needed.
- [ ] Fix upload video frame selector field not working for some video types/codecs/containers before processing. No need to actually make it work just show a message that say it will allow selecting in edit after processing.
- [ ] On Instagram, when the chat bot responsds to the user the interactive buttons are shown to both the user and the sender (the page/account that the bot is sending from).
- [ ] Allow handover using the new meta protocol from the bot to a human user (also not urgent).
- [ ] Make the bot only reply within opening hours with a new setting as well and send a generic reply outside of opening that can be edited in the static content info system (read the full updateinfosystem file and the config-tmp file to understand).
- [ ] Add more info to the static content of the info system such as the message that is sent to select from menu or the message to select a language etc... (read the full updateinfosystem file and the config-tmp file to understand).
