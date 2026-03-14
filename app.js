import { extractRowsFromHtml } from './extractor.js';

const state = {
  file: null,
  rows: [],
  filteredRows: [],
  loading: false,
};

const el = {
  dropZone: document.getElementById('dropZone'),
  fileInput: document.getElementById('fileInput'),
  fileName: document.getElementById('fileName'),
  extractBtn: document.getElementById('extractBtn'),
  appsScriptUrl: document.getElementById('appsScriptUrl'),
  totalRows: document.getElementById('totalRows'),
  filteredRows: document.getElementById('filteredRows'),
  latestExtractedAt: document.getElementById('latestExtractedAt'),
  searchInput: document.getElementById('searchInput'),
  sendBtn: document.getElementById('sendBtn'),
  statusBox: document.getElementById('statusBox'),
  rowsBody: document.getElementById('rowsBody'),
};

initializeConfig();
attachEvents();
render();

function initializeConfig() {
  const configUrl = window.APP_CONFIG?.appsScriptUrl;
  const savedUrl = localStorage.getItem('appsScriptUrl') || '';
  el.appsScriptUrl.value = configUrl || savedUrl;
}

function attachEvents() {
  el.fileInput.addEventListener('change', (event) => {
    const [file] = event.target.files || [];
    setSelectedFile(file);
  });

  el.extractBtn.addEventListener('click', handleExtract);
  el.searchInput.addEventListener('input', applyFilter);
  el.sendBtn.addEventListener('click', handleSendToSheets);

  el.appsScriptUrl.addEventListener('change', () => {
    localStorage.setItem('appsScriptUrl', el.appsScriptUrl.value.trim());
  });

  el.dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    el.dropZone.classList.add('dragover');
  });

  el.dropZone.addEventListener('dragleave', () => {
    el.dropZone.classList.remove('dragover');
  });

  el.dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    el.dropZone.classList.remove('dragover');
    const [file] = event.dataTransfer.files || [];
    setSelectedFile(file);
  });

  el.dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      el.fileInput.click();
    }
  });
}

function setSelectedFile(file) {
  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith('.html') && file.type !== 'text/html') {
    showStatus('Please upload a valid .html file.', true);
    return;
  }

  state.file = file;
  el.fileName.textContent = file.name;
  showStatus('File selected. Click “Extract Data” to parse content.', false);
}

async function handleExtract() {
  if (!state.file) {
    showStatus('Select an HTML file before extracting.', true);
    return;
  }

  setLoading(true, 'Extracting rows from HTML...');

  try {
    const htmlText = await readFileText(state.file);
    const rows = extractRowsFromHtml(htmlText, state.file.name);
    state.rows = rows;
    state.filteredRows = [...rows];
    showStatus(`Extraction complete: ${rows.length} rows ready for preview.`, false);
  } catch (error) {
    state.rows = [];
    state.filteredRows = [];
    showStatus(error.message || 'Extraction failed.', true);
  } finally {
    setLoading(false);
    render();
  }
}

function applyFilter() {
  const query = el.searchInput.value.trim().toLowerCase();
  state.filteredRows = state.rows.filter((row) => {
    const haystack = Object.values(row).join(' ').toLowerCase();
    return !query || haystack.includes(query);
  });
  render();
}

function removeRow(indexInFiltered) {
  const rowToRemove = state.filteredRows[indexInFiltered];
  if (!rowToRemove) return;

  state.rows = state.rows.filter((row) => row !== rowToRemove);
  state.filteredRows = state.filteredRows.filter((row) => row !== rowToRemove);
  render();
  showStatus('Row removed from submission set.', false);
}

async function handleSendToSheets() {
  const endpoint = el.appsScriptUrl.value.trim();

  if (!endpoint) {
    showStatus('Paste your Google Apps Script web app URL before submitting.', true);
    return;
  }

  if (!state.rows.length) {
    showStatus('No extracted rows available to send.', true);
    return;
  }

  setLoading(true, 'Sending rows to Google Sheets...');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: state.rows }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error(result.error || `Request failed with status ${response.status}`);
    }

    showStatus(`Success: ${state.rows.length} rows sent to Google Sheets.`, false);
  } catch (error) {
    showStatus(error.message || 'Failed to send rows to Google Sheets.', true);
  } finally {
    setLoading(false);
    render();
  }
}

function render() {
  el.totalRows.textContent = String(state.rows.length);
  el.filteredRows.textContent = String(state.filteredRows.length);
  el.latestExtractedAt.textContent = state.rows[0]?.extracted_at
    ? new Date(state.rows[0].extracted_at).toLocaleString()
    : '—';

  el.rowsBody.innerHTML = '';

  if (!state.filteredRows.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="10"><small>No rows to preview yet.</small></td>';
    el.rowsBody.append(row);
    return;
  }

  state.filteredRows.forEach((rowData, index) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${escapeHtml(rowData.source_file)}</td>
      <td>${escapeHtml(rowData.page_title)}</td>
      <td>${escapeHtml(rowData.section)}</td>
      <td>${escapeHtml(rowData.item_title)}</td>
      <td>${escapeHtml(rowData.item_value)}</td>
      <td>${renderLink(rowData.link)}</td>
      <td>${escapeHtml(rowData.meta_description)}</td>
      <td>${escapeHtml(rowData.extracted_text)}</td>
      <td>${escapeHtml(rowData.extracted_at)}</td>
      <td><button class="row-action" type="button" data-index="${index}">Remove</button></td>
    `;

    el.rowsBody.append(row);
  });

  el.rowsBody.querySelectorAll('.row-action').forEach((button) => {
    button.addEventListener('click', () => {
      removeRow(Number(button.dataset.index));
    });
  });
}

function renderLink(link) {
  if (!link) {
    return '<small>—</small>';
  }

  const safeLink = escapeHtml(link);
  return `<a href="${safeLink}" target="_blank" rel="noopener noreferrer">${safeLink}</a>`;
}

function escapeHtml(value) {
  const text = String(value || '');
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showStatus(message, isError) {
  el.statusBox.hidden = false;
  el.statusBox.textContent = message;
  el.statusBox.classList.toggle('error', isError);
}

function setLoading(isLoading, message = '') {
  state.loading = isLoading;
  el.extractBtn.disabled = isLoading;
  el.sendBtn.disabled = isLoading;

  if (isLoading) {
    showStatus(message, false);
  }
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read uploaded file.'));
    reader.readAsText(file);
  });
}
