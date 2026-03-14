# Data Scalping Dashboard (Prototype)

A lightweight, dark-themed dashboard prototype for quickly collecting and reviewing small sets of data.

## Project Structure

```text
CAI-DATA-SCALPER/
├── index.html          # Dashboard layout and semantic structure
├── styles.css          # Dark theme, responsive UI styles
├── src/
│   ├── app.js          # UI behavior, state, filtering, summary, status handling
│   └── mockData.js     # Mock data generation for simulated collection
└── README.md           # Setup and usage notes
```

## Features

- Clean landing/dashboard interface
- Query/source/category input field
- Simulated "Collect Data" action
- Polished results card grid
- Summary widgets:
  - total results
  - latest timestamp
  - active tags
- Filters:
  - search text filter
  - tag dropdown filter
- State handling:
  - loading state
  - empty state
  - error state
  - no-filter-match state
- Responsive layout for desktop/tablet/mobile

## Setup (Simple)

No build step is required.

### Option A: Open directly
Open `index.html` in a browser.

### Option B: Run a tiny local server (recommended)

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## How to Use

1. Enter a query/source/category (e.g. `AI tools`).
2. Click **Collect Data**.
3. Review results in cards.
4. Use search + tag filter to narrow down results.

Tip: entering a query containing `error` triggers a simulated error state.

## Replacing Mock Data with Real Data Later

The code is intentionally prepared for API/scraping integration:

- Replace logic in `runCollection()` in `src/app.js`.
- Keep existing state/render flow as-is.

### Current mock section

```js
await sleep(850);
state.allResults = createMockResults(query);
```

### Future real fetch section (example)

```js
const response = await fetch(`/api/collect?q=${encodeURIComponent(query)}`);
if (!response.ok) throw new Error('Collection failed');
state.allResults = await response.json();
```

Expected result item shape:

```js
{
  title: 'string',
  source: 'string',
  summary: 'string',
  timestamp: 'ISO string',
  tag: 'string'
}
```
