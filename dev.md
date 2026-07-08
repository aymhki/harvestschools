
## When adding a new page to the website:
1. Create the page jsx file in the `src/pages` directory or subdirectory.
2. Import and add the page route with its adjacent component in `src/AppClient.jsx` and `src/AppServer.jsx` (Add to `src/AppAdmin.jsx` if it is an admin page).
3. Add the page route to `prerender.js` if it was not one of the admin pages that should not be indexed.

- Note: Do not add ract helment to the new page if it is an admin page as they are not meant to be indexed by search engines.

## When editing an existing page url:
1. Update it in the navbar component
2. Update it in the `src/AppServer.jsx` and `src/AppClient.jsx` files or `src/AppAdmin.jsx` if it is an admin page.
3. Update it in their parent options page if it had one.
4. Update it in any `navigate` refrences in the codebase.
5. Update it in `prerender.js` if it was not one of the admin pages that should not be indexed.


# Proper `tree` command for the project:
```bash
tree --gitignore -I 'assets|.git' -a 
```

## TODOs:
- [x] Move i18n translations to the backend and break down the huge file into multiple smaller ones.
- [x] Move the image assets of the gallery to the backend server instead of the public folder of the frontend.
- [x] h2 line height in the Covid-19 policy page is not correct
- [x] Pass isDevelopment to the update info system script so that it dynamically changes the script it is writing to.
- [x] Add new lines to the llm prompt in the update info system script.
- [x] Remove new lines from the $SCHOOL_CONFIG variable in the update info system script.
- [x] Add the $STRINGS to the update info system script from the original config file.
- [x] Spinner is not taking the entire screen in mobile view.
- [x] The mobile app should open when a harvestschools.com link is clicked if it is installed on the device.
- [ ] The website should show install app prompt at the top or bottom when opened from a mobile device.
- [ ] The top padding for view port in the mobile app should be implemented and tested especially on iOS.
- [x] The advanced mode in the whatsapp chat bot should be smarter about when to show feedback buttons and should show change language buttons as well as return a proper error message if the llm did not response. It should also include a third llm like claude.
- [x] Create a messenger bot that works like the whatsapp bot.
- [ ] Add proper app icons for android and iOS as well as add documentation needed such as privacy policy and terms of service.
- [ ] Publish both the whatsapp app bot and the messenger app bot on meta for developers.
- [ ] Look into adding description to list items that exceed 24 chars in whatsapp api and 20 chars in messenger api.
- [ ] Turn on Auto Decline for the whatsapp chat bot number on iPhone.
- [ ] Verify cron jobs are working and sending notification emails properly.
- [x] Admin Login Height Container needs to be bigger.
- [x] Scroll bars needs to be hidden from admin side bar.
- [x] Select field with label outside and on top not filling the same width as the rest of the input fields in desktop view.
- [ ] Add address option in the main menu of the intermediate mode in the chat bot.
- [ ] Add switch language in the departments menu of the intermediate mode in the chat bot.
- [ ] Large Action Modal Popup Needs to height readjustment for desktop view.
- [ ] If the early playschool department is selected in the main menu of the intermediate mode, there is no need to prompt the user to select stage group in the chat bot.
- [ ] Add an update config button to the info system management page in the admin portal for each tab table.
- [ ] Update the webhook subscription for the needed types of messages such as reply to ads (Intake) in both messenger and Instagram.
- [ ] Implement swipe back gestures in iOS and android mobile app and add actions navigation bar for the mobile app.
- [ ] Look into @capgo/capacitor-native-biometric and capacitor-secure-storage for quick and easy login on the mobile app.
- [ ] Double check all the added icon assets and remove any old placeholders.
- [ ] Add iOS app id when published to the index.html of the main domain and the admin domain.
- [ ] Fix the pull to refresh iOS app problems.
- [ ] h1/2/3 of the options page line height is not set.
- [ ] The clear and save buttons of the admin large action modal popup could be in the modal footer rather than the form footer.
- [ ] Fix the home page video for both chrome and excel.