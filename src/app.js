import { createMockResults } from './mockData.js';

const state = {
  allResults: [],
  visibleResults: [],
  loading: false,
  error: null,
};

const elements = {
  queryInput: document.getElementById('queryInput'),
  collectBtn: document.getElementById('collectBtn'),
  searchInput: document.getElementById('searchInput'),
  tagFilter: document.getElementById('tagFilter'),
  totalResults: document.getElementById('totalResults'),
  latestTimestamp: document.getElementById('latestTimestamp'),
  activeTags: document.getElementById('activeTags'),
  statusBanner: document.getElementById('statusBanner'),
  resultsGrid: document.getElementById('resultsGrid'),
  resultCardTemplate: document.getElementById('resultCardTemplate'),
};

elements.collectBtn.addEventListener('click', runCollection);
elements.searchInput.addEventListener('input', applyFilters);
elements.tagFilter.addEventListener('change', applyFilters);

render();

async function runCollection() {
  const query = elements.queryInput.value.trim();

  if (!query) {
    state.error = 'Please enter a query, source, or category before collecting.';
    state.loading = false;
    render();
    return;
  }

  state.loading = true;
  state.error = null;
  render();

  try {
    await sleep(850);

    if (query.toLowerCase().includes('error')) {
      throw new Error('Simulated collection issue. Please try another query.');
    }

    state.allResults = createMockResults(query);
    state.visibleResults = [...state.allResults];
    syncTagOptions();
    applyFilters();
  } catch (error) {
    state.allResults = [];
    state.visibleResults = [];
    state.error = error.message || 'Unexpected error while collecting data.';
  } finally {
    state.loading = false;
    render();
  }
}

function applyFilters() {
  const text = elements.searchInput.value.trim().toLowerCase();
  const tag = elements.tagFilter.value;

  state.visibleResults = state.allResults.filter((item) => {
    const inTag = tag === 'all' || item.tag === tag;
    const haystack = `${item.title} ${item.source} ${item.summary} ${item.tag}`.toLowerCase();
    const inText = !text || haystack.includes(text);

    return inTag && inText;
  });

  render();
}

function syncTagOptions() {
  const uniqueTags = [...new Set(state.allResults.map((item) => item.tag))];
  const current = elements.tagFilter.value;

  elements.tagFilter.innerHTML = '<option value="all">All Tags</option>';
  uniqueTags.forEach((tag) => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    elements.tagFilter.append(option);
  });

  elements.tagFilter.value = uniqueTags.includes(current) ? current : 'all';
}

function render() {
  renderSummary();
  renderStatus();
  renderCards();
  elements.collectBtn.disabled = state.loading;
  elements.collectBtn.textContent = state.loading ? 'Collecting…' : 'Collect Data';
}

function renderSummary() {
  const total = state.visibleResults.length;
  const latest = state.visibleResults[0]?.timestamp;
  const tags = new Set(state.visibleResults.map((item) => item.tag));

  elements.totalResults.textContent = String(total);
  elements.latestTimestamp.textContent = latest ? formatTimestamp(latest) : '—';
  elements.activeTags.textContent = String(tags.size);
}

function renderStatus() {
  const banner = elements.statusBanner;

  if (state.loading) {
    showBanner('Collecting data... please wait.', false);
    return;
  }

  if (state.error) {
    showBanner(state.error, true);
    return;
  }

  if (!state.allResults.length) {
    showBanner('No data collected yet. Add a query and press “Collect Data”.', false);
    return;
  }

  if (!state.visibleResults.length) {
    showBanner('No results match the current filters.', false);
    return;
  }

  banner.hidden = true;
  banner.textContent = '';
  banner.classList.remove('error');
}

function showBanner(message, isError) {
  const banner = elements.statusBanner;
  banner.hidden = false;
  banner.textContent = message;
  banner.classList.toggle('error', isError);
}

function renderCards() {
  elements.resultsGrid.innerHTML = '';

  state.visibleResults.forEach((item) => {
    const fragment = elements.resultCardTemplate.content.cloneNode(true);
    fragment.querySelector('.result-title').textContent = item.title;
    fragment.querySelector('.result-source').textContent = `Source: ${item.source}`;
    fragment.querySelector('.result-summary').textContent = item.summary;
    fragment.querySelector('.result-timestamp').textContent = `Captured: ${formatTimestamp(item.timestamp)}`;
    fragment.querySelector('.result-tag').textContent = item.tag;
    elements.resultsGrid.append(fragment);
  });
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
