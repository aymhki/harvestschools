# Proper `tree` command for the project:
```bash
tree --gitignore -I 'assets|.git' -a 
```

# Rules:
1. Any `capacitor` plugin added to the root `package.json` should be added to the `package.json` in the MobileApp workspace.

## TODOs:
- [ ] Update the webhook subscription for the needed types of messages such as reply to ads (Intake) in both messenger and Instagram.
- [ ] Publish both the whatsapp app bot and the messenger app bot on meta for developers.
- [x] Add Turnstile keys to env values.
- [x] Look into making the schooleverywhere web app available work fully through this app by setting any of its route patterns in router/routes as a component that just works with those apps right away.
- [ ] turnstile on cloud flare needs site verify, explore seo impact first.
- [x] Quick links in app home page should open their apps directly.
- [x] schooleverywhere needs its own widget quick action.
- [ ] New gallery videos need to be added.
- [ ] /vacancies does not correctly redirect in the main domain and somehow shows an outdated version of /vacancies.
- [ ] Alumni students should have public profile pages.
- [ ] Admin side bar should stick the selected page once it exists the height of the portal scroll.
- [ ] Sign in with biometrics doesn't work on android.
- [ ] Scrolling to the top inside a modal popup interferes with pull to refresh mechanism.

