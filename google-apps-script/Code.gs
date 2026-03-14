/**
 * Google Apps Script Web App endpoint for HTML Data Scalper.
 *
 * Before deployment:
 * 1) Replace SHEET_NAME if needed.
 * 2) Deploy as Web App with access set appropriately.
 */

const SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'Missing POST body.' });
    }

    const payload = JSON.parse(e.postData.contents);
    const rows = Array.isArray(payload.rows) ? payload.rows : [];

    if (!rows.length) {
      return jsonResponse({ success: false, error: 'No rows received.' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse({ success: false, error: `Sheet "${SHEET_NAME}" not found.` });
    }

    const headers = [
      'source_file',
      'page_title',
      'section',
      'item_title',
      'item_value',
      'link',
      'meta_description',
      'extracted_text',
      'extracted_at',
    ];

    ensureHeaderRow(sheet, headers);

    const values = rows.map((row) => headers.map((key) => normalizeValue(row[key])));
    sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);

    return jsonResponse({ success: true, appended: values.length });
  } catch (error) {
    return jsonResponse({ success: false, error: String(error.message || error) });
  }
}

function ensureHeaderRow(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function normalizeValue(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
