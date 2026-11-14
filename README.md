# सूक्तिशब्दकोश | Suktisabdakosh

A clean English–Nepali phrase dictionary using plain HTML, CSS and JavaScript.
No external website libraries, fonts, CDNs or build dependencies.

## Upload to GitHub

1. Create a public repository named `suktisabdakosh` with a `main` branch.
2. Upload `index.html`, `style.css`, `script.js`, `phrases.json` and `README.md` to its root with **Add file → Upload files**.
3. Preserve the additional paths `scripts/import-phrases.mjs` and `.github/workflows/deploy.yml`. You can create these with **Add file → Create new file**, typing the full path.
4. Commit the files to `main`.

## Hosting on GitHub Pages

For this automatic-import version, open **Settings → Pages → Build and deployment → Source → GitHub Actions**. The included workflow imports text, commits the updated JSON and deploys the site on each push to `main`. You can also run it from **Actions → Import phrases and deploy Pages → Run workflow**. No personal access token is needed. Repository rules must permit the workflow's JSON commit.

For basic hosting without the importer workflow, select **Settings → Pages → Deploy from a branch → main → /(root) → Save**. Disable/remove the included deployment workflow if using this alternative. Use Actions for reliable automatic-import deployment: bot-generated commits alone do not trigger a branch-based Pages build.

Wait for the Actions run to finish. GitHub Pages displays your site link in Settings → Pages.

## Edit JSON phrases

Use the visible **Edit phrases.json** link on the website. GitHub sign-in and repository write access are required to save. Each entry contains exactly two strings, with no language field:

```json
{
  "phrase": "Where there is a will,<br>there is a way.",
  "meaning": "Determination helps us find a way forward."
}
```

Place entries inside the existing JSON array, separated by commas. Use double quotes and no trailing comma. Escape embedded double quotes as `\"`. `<br>` inserts a line break in either field. Other HTML, including `<b>` and `<script>`, appears as literal text and is never executed. `<br/>` and `<br />` are also accepted. Breaks behave as whitespace during search and sorting.

## Automatically import Unicode .txt files

Click **Add .txt** on the main page, upload a UTF-8 text file, and commit it to `main`. Text files are recognized automatically anywhere outside hidden folders, `node_modules` and `_site`; `.TXT` also works. Use this format:

```text
phrase- समय अमूल्य छ।
meaning- समयको सदुपयोग गर्नुपर्छ।

phrase- Practice makes progress.
meaning- Consistent effort improves your ability.
This continuation appears on a new line.
```

Start each entry with `phrase-`, followed by `meaning-`. Markers are case-insensitive; a colon or en/em dash is also accepted. Continuation lines belong to the preceding field and become `<br>`. Blank separator lines are ignored. A content line beginning with a marker is treated as a new field, so avoid that form inside prose. Save as UTF-8 (BOM is accepted).

The Action validates every file, adds new phrases, and updates the meaning of an existing phrase with the same case-insensitive, whitespace-normalized spelling. Repeated runs do not duplicate entries. Spelling variants used by the search normalizer are NOT merged as duplicates. Conflicting meanings for one phrase across text files stop the build with an explanatory Actions error; fix the files and commit again. Invalid UTF-8, malformed entries or invalid JSON also stop publication, preserving the previous deployed site.

Uploaded text files remain authoritative and are re-imported on every run. Edit an imported entry in its `.txt` source; editing only JSON will be overwritten next time. Imports are additive: removing a text file does not delete its existing JSON entries. To remove or rename an imported phrase, remove/change its text source AND delete the old entry from JSON. Manual JSON entries without text sources remain editable normally.

## Repository links

At the top of `script.js`, change:

```js
const REPO_URL = 'https://github.com/YOUR-USERNAME/suktisabdakosh';
const EDIT_URL = `${REPO_URL}/edit/main/phrases.json`;
```

The supplied files already point to `ShivaPrasadAcharya/suktisabdakosh`. Change `main` in the edit/upload URLs and workflow if using a different branch.

## Search and display

- Nepali-normalized, case-insensitive, space-agnostic search is on by default. The supplied vowel, sibilant, nasal, व/ब and digit equivalences are applied; zero-width joiners are ignored.
- Contains whole entry means the complete query occurs within either the phrase or its meaning. It can occur anywhere in that field.
- Any/all modes split the query on spaces; all mode allows words to be distributed across both fields.
- Begins, ends and exact match apply to either individual field. Does not contain excludes entries if either field contains the query.
- Starts with letter uses the first query character and tests the phrase. Has a word starting with tests words in either field.
- The letter buttons use literal starting letters, independent of spelling normalization, and combine with search/language filters. All resets only the letter filter.
- Ascending order places English first, then Nepali, using `localeCompare`; descending reverses that order. `<br>` never sorts as HTML.
- Two columns means phrase beside meaning. One column places meaning below phrase; narrow screens always stack them.
- Theme, column count, size, sort and language are saved in this browser. If storage is unavailable, settings still work for the current visit.
- A− / A / A+ control the whole page (12–24 px base size; reset 16 px).

For local use, serve the folder (for example `python3 -m http.server 8000`) and open `http://localhost:8000`. Opening `index.html` directly with `file://` may block `fetch()`.
