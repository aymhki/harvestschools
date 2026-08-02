# Proper `tree` command for the project:
```bash
tree --gitignore -I 'assets|.git' -a 
```

# Rules:
1. Any `capacitor` plugin added to the root `package.json` should be added to the `package.json` in the MobileApp workspace.

## TODOs:
- [ ] Update the webhook subscription for the needed types of messages such as reply to ads (Intake) in both messenger and Instagram.
- [ ] Publish both the whatsapp app bot and the messenger app bot on meta for developers.
- [ ] Add Turnstile keys to env values.
- [ ] Look into making the schooleverywhere web app available work fully through this app by setting any of its route patterns in router/routes as a component that just works with those apps right away.
- [ ] turnstile on cloud flare needs site verify, explore seo impact first.
- [ ] Quick links in app home page should open their apps directly.
- [ ] schooleverywhere needs its own widget quick action.
- [ ] New gallery videos need to be added.
