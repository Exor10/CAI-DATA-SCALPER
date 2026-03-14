# HTML Data Scalper

A simple, polished, **binary-free** web app for extracting structured data from local `.html` files directly in the browser, previewing/editing rows, and sending those rows to Google Sheets through a Google Apps Script web app endpoint.

## Project Structure

```text
CAI-DATA-SCALPER/
├── index.html
├── styles.css
├── app.js
├── extractor.js
├── config.sample.js
├── google-apps-script/
│   └── Code.gs
└── README.md
```

## Purpose

- Quickly inspect and convert HTML content into row-based data.
- Keep workflow beginner-friendly and demo-ready.
- Avoid backend complexity and heavy dependencies.
- Stay static-host friendly (GitHub Pages compatible).

## How HTML Upload Works

1. User uploads (or drags/drops) a `.html` file.
2. Browser reads file locally using `FileReader`.
3. HTML text is parsed in-browser using `DOMParser`.
4. Extracted rows are normalized and shown in preview table.
5. User can search/filter and remove rows.
6. User sends final row set to Google Sheets endpoint.

## How Extraction Works

Extraction is designed for general HTML and tries to capture common useful structures:

- page title (`<title>`)
- headings (`h1`-`h6`)
- links (`a[href]`)
- tables (`table` rows + inferred headers)
- meta description (`meta[name="description"]`)
- text blocks (`p`, `li`, `blockquote`)

Rows are normalized to this shape:

- `source_file`
- `page_title`
- `section`
- `item_title`
- `item_value`
- `link`
- `meta_description`
- `extracted_text`
- `extracted_at`

## Google Sheets Integration (Apps Script)

This project intentionally avoids frontend OAuth complexity.

Instead, the frontend sends JSON via `fetch()` to a deployed Google Apps Script web app URL:

```json
{
  "rows": [
    {
      "source_file": "example.html",
      "page_title": "...",
      "section": "heading",
      "item_title": "h1",
      "item_value": "...",
      "link": "",
      "meta_description": "...",
      "extracted_text": "...",
      "extracted_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

## Setup

No build tooling required.

### Local run

Open `index.html` directly, or serve locally:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deploy Frontend on GitHub Pages

1. Push repository to GitHub.
2. Open repository **Settings → Pages**.
3. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: `main` (or your branch), folder `/ (root)`
4. Save and wait for deployment URL.

Because this app is static HTML/CSS/JS, no backend is needed.

## Create a Google Sheet + Apps Script Web App

1. Create a new Google Sheet.
2. In the Sheet, open **Extensions → Apps Script**.
3. Paste contents from `google-apps-script/Code.gs`.
4. Adjust `SHEET_NAME` if needed.
5. Click **Deploy → New deployment**.
6. Select **Web app**.
7. Set:
   - Execute as: **Me**
   - Who has access: **Anyone** (or appropriate option)
8. Deploy and copy the web app URL.

## Where to Paste the Apps Script URL

In the app UI, paste your URL in the **Apps Script Web App URL** field.

Optional:
- Copy `config.sample.js` to `config.js`
- set `window.APP_CONFIG.appsScriptUrl = 'YOUR_URL'`
- include `config.js` in `index.html` before `app.js` if you want a preset URL.

## Notes on Validation & States

The app includes:

- loading state (during extraction/send)
- success state (after extraction/send)
- empty state (no rows yet)
- error state (bad file, malformed HTML, network errors)
- row deletion before submission

## Binary-Free Guarantee

This repository contains **text files only**.
No PNG, JPG, ICO, PDF, ZIP, or any other binary asset is included.
