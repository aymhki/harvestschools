
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
- [x] Move i18n translations to the backend and breakdown the huge file into multiple smaller ones.
- [x] Move the image assets of the gallery to the backend server instead of the public folder of the frontend.
- [ ] h2 line height in the covid-19 policy page is not correct