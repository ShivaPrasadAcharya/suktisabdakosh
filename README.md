# सूक्तिशब्दकोश | Suktisabdakosh

A clean English–Nepali phrase dictionary using plain HTML, CSS and JavaScript, without external website libraries.

## Edit or add phrases

Use **Edit .txt** on the website. When multiple text files exist, choose one from the **Text file** dropdown first. GitHub sign-in and repository write access are required to save. **Add .txt** opens GitHub's upload page.

Save dictionary files as UTF-8 anywhere in the repository outside hidden folders, `node_modules` and `_site`. `.TXT` is also accepted. Each entry uses:

```text
phrase- समय अमूल्य छ।
meaning- समयको सदुपयोग गर्नुपर्छ।
explanation- बितेको समय फर्केर आउँदैन, त्यसैले समयको उचित उपयोग गर्नुपर्छ।

phrase- Practice makes progress.
meaning- Consistent effort improves your ability.
explanation- Small, regular steps help you improve over time.
Additional lines continue the same field.
```

`phrase-` and `meaning-` require nonempty values. `explanation-` can be blank; older two-field entries still work. Markers are case-insensitive and accept a colon or en/em dash. Continuation lines belong to the preceding field. Blank lines are ignored. A line beginning with a field marker starts that field, so avoid such beginnings in prose. `<br>`, `<br/>` and `<br />` insert line breaks; all other HTML displays literally and is never executed.

Existing meanings were preserved in the upgrade. Empty explanation fields are ready to fill in. `phrases.txt` preserves older entries that previously existed only in JSON.

## Automatic import and GitHub Pages

Under **Settings → Pages → Build and deployment**, choose **GitHub Actions**. The included workflow runs on pushes to `main`, validates every text file, generates `phrases.json` and `text-files.json`, saves changes, and deploys the website. You can also run **Actions → Import phrases and deploy Pages → Run workflow**. Repository rules must permit the workflow's generated-file commit.

Text files are the source of truth; do not manually edit the generated JSON files. Removing or renaming an entry in text updates the next build. Identical entries across files are combined, retaining all source filenames. Conflicting meanings or explanations for the same phrase stop publication with an error identifying the files. Invalid UTF-8 or malformed entries also stop publication and leave the previous deployment intact. Phrase identity ignores case, whitespace differences and `<br>` formatting, but does not merge Nepali spelling variants.

When multiple text files exist, each phrase shows its source filename(s) in faint text below it. Nested source paths are retained so identically named files in different folders remain distinguishable. The dropdown includes all discovered text files, even empty ones.

## Search and display

- **Nepali normalized search** is checked by default in Menu. It applies vowel, sibilant, nasal, व/ब and Nepali-digit equivalences. Uncheck it for literal spelling. Both modes remain case-insensitive and ignore whitespace and zero-width joiners. Highlighting uses the selected mode.
- Search covers phrases, meanings and explanations. Contains, begins, ends and exact match test each field separately. Any/all split the query into words; all permits words across different fields. Does not contain excludes entries matching any field.
- Starts with letter tests the first query character against the phrase. Has a word starting with searches words in all three fields.
- Letter buttons use literal starting letters, independently of normalization. Language detection remains automatic.
- Ascending order places English before Nepali; descending reverses it. Breaks are whitespace for sorting.
- Two columns puts phrase beside meaning/explanation; one column stacks them. Narrow screens always stack.
- Theme, columns, size, sort, language and normalized-search preference are saved in the browser. A− / A / A+ set page text size (12–24 px, default 16).
- Sticky search, matching counts, highlighting and top/bottom navigation remain available.

## Local use and copying

Run `node scripts/import-phrases.mjs`, then serve the folder, for example with `python3 -m http.server 8000`. Open `http://localhost:8000`; direct `file://` access may block fetch.

When copying this repository, change `REPO_URL` in `script.js`. Update `main` in edit/upload URLs and the workflow if using a different branch. Preserve `scripts/import-phrases.mjs` and `.github/workflows/deploy.yml`.
