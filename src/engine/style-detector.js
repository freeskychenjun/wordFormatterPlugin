import { classifyParagraph } from './style-classifier.js';
import { getParagraphCount, getParagraphInfo, getTableRanges } from '../utils/wps-api.js';

function isInTable(start, end, tableRanges) {
  for (const tr of tableRanges) {
    if (start >= tr.start && end <= tr.end) return true;
  }
  return false;
}

export async function scanDocument(doc, onProgress, skipPages = 0) {
  const count = getParagraphCount(doc);
  const tableRanges = getTableRanges(doc);
  const raw = [];

  for (let i = 0; i < count; i++) {
    const info = getParagraphInfo(doc, i);
    raw.push({ index: i, ...info });
    if (i % 20 === 0) {
      onProgress?.({ phase: 'scan', current: i, total: count });
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // Pass 1: classify with basic rules
  const results = raw.map(item => ({
    index: item.index,
    text: item.text,
    type: classifyParagraph({
      text: item.text,
      outlineLevel: item.outlineLevel,
      hasImage: item.hasImage,
      inTable: isInTable(item.rangeStart, item.rangeEnd, tableRanges),
      styleName: item.styleName,
    }).type,
  }));

  // Pass 2: override table content
  for (let i = 0; i < raw.length; i++) {
    if (isInTable(raw[i].rangeStart, raw[i].rangeEnd, tableRanges)) {
      results[i].type = 'tableContent';
    }
  }

  // Pass 2.5: skip pages (cover, TOC, etc.)
  if (skipPages > 0) {
    for (let i = 0; i < raw.length; i++) {
      if (raw[i].pageNumber <= skipPages) {
        results[i].type = 'skipped';
      }
    }
  }

  // Pass 3: position-based caption detection
  const captionIndices = new Set();
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item.hasImage && !isInTable(item.rangeStart, item.rangeEnd, tableRanges)) continue;

    for (const dir of [-1, 1]) {
      for (let j = i + dir; j >= 0 && j < raw.length; j += dir) {
        if (isInTable(raw[j].rangeStart, raw[j].rangeEnd, tableRanges)) break;
        const text = raw[j].text;
        if (!text) break;

        if (/^[图表]\s*[\d一二三四五六七八九十]/.test(text)) {
          const captionType = text.startsWith('图') ? 'figCaption' : 'tblCaption';
          results[j].type = captionType;
          captionIndices.add(j);
        }
        break;
      }
    }
  }

  return results;
}
