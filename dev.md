
## When adding a new page to the website:
1. Create the page jsx file in the `src/pages` directory or subdirectory.
2. Import and add the page route with its adjacent component in `src/MainClientRouter.jsx` and `src/MainServerRouter.jsx` (Add to `src/AdminRouter.jsx` if it is an admin page).
3. Add the page route to `prerender-main.js` if it was not one of the admin pages that should not be indexed.

- Note: Do not add ract helment to the new page if it is an admin page as they are not meant to be indexed by search engines.

## When editing an existing page url:
1. Update it in the navbar component
2. Update it in the `src/MainServerRouter.jsx` and `src/MainClientRouter.jsx` files or `src/AdminRouter.jsx` if it is an admin page.
3. Update it in their parent options page if it had one.
4. Update it in any `navigate` refrences in the codebase.
5. Update it in `prerender-main.js` if it was not one of the admin pages that should not be indexed.


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
- [x] The website should show install app prompt at the top or bottom when opened from a mobile device.
- [x] The top padding for view port in the mobile app should be implemented and tested especially on iOS.
- [x] The advanced mode in the whatsapp chat bot should be smarter about when to show feedback buttons and should show change language buttons as well as return a proper error message if the llm did not response. It should also include a third llm like claude.
- [x] Create a messenger bot that works like the whatsapp bot.
- [x] Add proper app icons for android and iOS as well as add documentation needed such as privacy policy and terms of service.
- [x] Look into adding description to list items that exceed 24 chars in whatsapp api and 20 chars in messenger api.
- [x] Turn on Auto Decline for the whatsapp chat bot number on iPhone.
- [x] Verify cron jobs are working and sending notification emails properly.
- [x] Scroll bars needs to be hidden from admin side bar.
- [x] Select field with label outside and on top not filling the same width as the rest of the input fields in desktop view.
- [x] Add address option in the main menu of the intermediate mode in the chat bot.
- [x] Add switch language in the departments menu of the intermediate mode in the chat bot.
- [x] Implement swipe back gestures in iOS and android mobile app and add actions navigation bar for the mobile app.
- [x] Look into @capgo/capacitor-native-biometric and capacitor-secure-storage for quick and easy login on the mobile app.
- [x] Double check all the added icon assets and remove any old placeholders.
- [x] Fix the pull to refresh iOS app problems.
- [x] Handle upgrading to npm 12 where post install for package patching might not run.
- [x] The bot response to the vacancies option in the main menu doesn't use a cta button.
- [x] h1/2/3 of the options page line height is not set.
- [x] The clear and save buttons of the admin large action modal popup could be in the modal footer rather than the form footer.
- [x] Fix the home page video width for both chrome and safari.
- [x] Large Action Modal Popup Needs to height readjustment for desktop view.
- [x] Admin Login Height Container needs to be bigger (use % instead vh or use nothing at all).
- [x] If the early playschool department is selected in the main menu of the intermediate mode, there is no need to prompt the user to select stage group in the chat bot.
- [x] Add an update config button to the info system management page in the admin portal for each tab table.
- [x] Create basic corporate site.
- [x] Fix the home page map.
- [x] Getting dashboard permissions and validating them should all work through the new permissions table in the db.
- [x] The custom multi select form field should support a special set value entries at which custom actions like check all and uncheck all work and at which a higher priority sort order is given.
- [x] Add corporate website to the admin sidebar with the master of none permission level.
- [x] Use encrypt for all admin passwords.
- [x] Use encrypt for all admin sessions.
- [x] Look into MFA  for admin logins.
- [x] Improve the sessions table to include fingerprinting.
- [x] Arabic captcha width and padding looks off.
- [x] Look into proper captcha for forms.
- [x] Look into adding the same security headers from admin domain to the main domain.
- [ ] Update the webhook subscription for the needed types of messages such as reply to ads (Intake) in both messenger and Instagram.
- [ ] Publish both the whatsapp app bot and the messenger app bot on meta for developers.
- [ ] Add iOS app id when published to the index.html of the main domain and the admin domain.
- [ ] Setup the info for the D-U-N-S Number.
- [ ] Date Modal in the form component does not open to the selected field's date.
- [ ] The alumni profile flash may need to be removed.
- [ ] The alumni management tab keeps flickering and reloading.
- [ ] The alumni change password modal needs to use the custom form for password fields.
- [ ] Remove passkey from capacitor app for the alumni pages.
- [ ] Viewing alumni files doesn't work from admin management page tables.
- [ ] Add www. to app links hostnames in iOS and android.
