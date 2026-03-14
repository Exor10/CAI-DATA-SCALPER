function cleanText(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function pushRow(rows, baseRow, section, itemTitle, itemValue, link = '') {
  const normalizedRow = {
    source_file: baseRow.source_file,
    page_title: baseRow.page_title,
    section: cleanText(section) || 'general',
    item_title: cleanText(itemTitle) || 'untitled',
    item_value: cleanText(itemValue),
    link: cleanText(link),
    meta_description: baseRow.meta_description,
    extracted_text: baseRow.extracted_text,
    extracted_at: baseRow.extracted_at,
  };

  if (normalizedRow.item_value || normalizedRow.link) {
    rows.push(normalizedRow);
  }
}

function extractHeadings(doc, rows, baseRow) {
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading) => {
    pushRow(rows, baseRow, 'heading', heading.tagName, heading.textContent);
  });
}

function extractLinks(doc, rows, baseRow) {
  doc.querySelectorAll('a[href]').forEach((link) => {
    pushRow(rows, baseRow, 'link', link.textContent || 'link', link.getAttribute('href'), link.href);
  });
}

function extractTables(doc, rows, baseRow) {
  doc.querySelectorAll('table').forEach((table, tableIndex) => {
    const headers = Array.from(table.querySelectorAll('thead th')).map((th) => cleanText(th.textContent));
    const bodyRows = table.querySelectorAll('tbody tr');

    if (!bodyRows.length) {
      table.querySelectorAll('tr').forEach((tr, rowIndex) => {
        const cells = Array.from(tr.querySelectorAll('td, th')).map((cell) => cleanText(cell.textContent));
        pushRow(rows, baseRow, `table_${tableIndex + 1}`, `row_${rowIndex + 1}`, cells.join(' | '));
      });
      return;
    }

    bodyRows.forEach((tr, rowIndex) => {
      const cells = Array.from(tr.querySelectorAll('td')).map((cell) => cleanText(cell.textContent));
      const value = cells
        .map((cellValue, index) => `${headers[index] || `col_${index + 1}`}: ${cellValue}`)
        .join(' | ');
      pushRow(rows, baseRow, `table_${tableIndex + 1}`, `row_${rowIndex + 1}`, value);
    });
  });
}

function extractTextBlocks(doc, rows, baseRow) {
  doc.querySelectorAll('p, li, blockquote').forEach((node, index) => {
    const text = cleanText(node.textContent);
    if (text.length > 35) {
      pushRow(rows, baseRow, 'text_block', `${node.tagName.toLowerCase()}_${index + 1}`, text);
    }
  });
}

export function extractRowsFromHtml(htmlText, sourceFileName) {
  if (!htmlText || !htmlText.trim()) {
    throw new Error('Uploaded file is empty.');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Malformed HTML file. Unable to parse content.');
  }

  const extractedAt = new Date().toISOString();
  const pageTitle = cleanText(doc.title) || 'Untitled Page';
  const metaDescription = cleanText(doc.querySelector('meta[name="description"]')?.getAttribute('content'));
  const textSnapshot = cleanText(doc.body?.textContent || '').slice(0, 250);

  const baseRow = {
    source_file: sourceFileName,
    page_title: pageTitle,
    meta_description: metaDescription,
    extracted_text: textSnapshot,
    extracted_at: extractedAt,
  };

  const rows = [];

  if (metaDescription) {
    pushRow(rows, baseRow, 'meta', 'description', metaDescription);
  }

  extractHeadings(doc, rows, baseRow);
  extractLinks(doc, rows, baseRow);
  extractTables(doc, rows, baseRow);
  extractTextBlocks(doc, rows, baseRow);

  if (!rows.length) {
    pushRow(rows, baseRow, 'page', 'body_text', textSnapshot || 'No extractable nodes found');
  }

  return rows;
}
