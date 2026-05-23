import { classifyParagraph } from './style-classifier.js';
import { getParagraphCount, getParagraphInfo } from '../utils/wps-api.js';

export function scanDocument(doc) {
  const count = getParagraphCount(doc);
  const results = [];

  for (let i = 0; i < count; i++) {
    const info = getParagraphInfo(doc, i);
    const classification = classifyParagraph(info);
    results.push({ index: i, ...classification, text: info.text });
  }

  return results;
}
