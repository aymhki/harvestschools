# Proper `tree` command for the project:
```bash
tree --gitignore -I 'assets|.git' -a 
```

# Rules:
1. Any `capacitor` plugin added to the root `package.json` should be added to the `package.json` in the MobileApp workspace.

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
- [x] Date Modal in the form component does not open to the selected field's date.
- [x] The alumni profile flash may need to be removed.
- [x] The alumni management tab keeps flickering and reloading.
- [x] The alumni change password modal needs to use the custom form for password fields.
- [x] Remove passkey from capacitor app for the alumni pages.
- [x] Both alumni students and graduation bookings should be able to reset their passwords via forgot password option followed by a verification code sent to their email(s).
- [x] When resetting the password for admin login the capacitor app biometric login should be updated.
- [x] Viewing alumni files doesn't work from admin management page tables.
- [x] Add www. to app links hostnames in iOS and android.
- [x] Add forget password to admin accounts with MFA.
- [x] Look into adding biometric login for both alumni students and graduation bookings similar to the admin login.
- [x] Look into adding location with iP address to active sessions as well as show Capacitor in the session browser for admin login.
- [x] Admin login mfa risk handler should consider biometric login from capacitor app safe enough as well as consider iP address country/region.
- [x] Alumni students should be able to submit a request to delete their accounts to the administrators.
- [x] Unify the router to elements across domains.
- [x] Table filter modal fields css needs to be adjusted to match form fields.
- [x] Graduation booking login and alumni students login should store, set, extend, get, and delete session using SecureStoragePlugin for capacitor on the app similar to the admin login.
- [x] Passkey should not be shown as a step up option in the admin side if opened from the capacitor app.
- [x] Alumni profile forgot password should also update biometric credentials in the capacitor app similar to the change password of the alumni profile.
- [x] Set the real ceremony date, time and venue from the admin portal: Graduation Booking Management > "Update Venue". Until it is set the wallet pass, the PDF confirmation and the booking page all read "To be announced".
- [x] Run `sql/graduationCeremonyDetails.sql` on the production database (creates graduation_ceremony_details and adds the time_zone column).
- [x] Add a repository secret named `VITE_GOOGLE_MAPS_API_KEY` in GitHub (Settings > Secrets and variables > Actions) holding the Google Maps browser key. The deploy workflow already passes it to the build step.
- [x] Keep the key's Google Cloud application restriction on "Websites" and make sure the referrer list covers every origin that runs the admin portal: `https://admin.harvestschools.com/*`, `capacitor://localhost/*`, `https://localhost/*` and the dev ports.
- [x] Upload the wallet configs to the production configs folder: `walletPassConfig.php`, `pass-certificate.pem`, `pass-key.pem`, `Certificates.p12`, `wwdr.pem` and the Google service account json. Everything under `assets/` is deployed by the workflow, so the wallet badges and pass images go up on their own.
- [ ] Regenerating the Apple signing pair from a new Certificates.p12 (OpenSSL 3 cannot read Apple's legacy .p12 directly, so the PHP reads these PEMs):
  ```bash
  cd configs
  openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -passin pass:'<p12 password>' -out pass-certificate.pem
  openssl pkcs12 -in Certificates.p12 -nocerts -nodes -passin pass:'<p12 password>' | openssl rsa -aes256 -passout pass:'<p12 password>' -out pass-key.pem
  ```
- [x] Download the official "Add to Apple Wallet" badge artwork and save the English and Arabic SVGs in `assets/images/Wallet/` next to the Google Wallet ones.
- [ ] After the D-U-N-S number is issued and the Apple account becomes an organisation account: register a new pass type ID, export a new `Certificates.p12`, regenerate `configs/pass-certificate.pem` and `configs/pass-key.pem` from it, and update `apple_pass_type_id`, `apple_team_id` and `apple_p12_password` in `configs/walletPassConfig.php` on both the machine and the production server.
- [ ] Update the webhook subscription for the needed types of messages such as reply to ads (Intake) in both messenger and Instagram.
- [ ] Publish both the whatsapp app bot and the messenger app bot on meta for developers.
- [ ] Add iOS app id when published to the index.html of the main domain and the admin domain.
- [ ] Setup the info for the D-U-N-S Number.
