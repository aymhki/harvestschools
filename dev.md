
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
- [ ] Spinner is not taking the entire screen in mobile view.