import { getActiveDocument, setScreenUpdating } from '../utils/wps-api.js';
import { scanDocument } from './style-detector.js';
import { applyPageSetup } from './page-setup.js';
import { applyParagraphStyle } from './paragraph.js';
import { applyTableSettings } from './table.js';

function yieldToUI() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export async function formatDocument(rule, onProgress) {
  const doc = getActiveDocument();

  setScreenUpdating(false);
  try {
    onProgress?.({ phase: 'page' });
    await yieldToUI();
    applyPageSetup(doc, rule.pageSetup);

    onProgress?.({ phase: 'scan', current: 0, total: 1 });
    const paragraphs = await scanDocument(doc, onProgress, rule.skipPages || 0);

    const total = paragraphs.length;
    const stats = { heading: 0, body: 0, image: 0, figCaption: 0, tblCaption: 0, skipped: 0 };
    const styleTypes = ['heading1', 'heading2', 'heading3', 'heading4', 'body', 'figCaption', 'tblCaption'];

    for (let i = 0; i < total; i++) {
      const para = paragraphs[i];
      const styleName = para.type;

      if (styleName === 'tableContent' || styleName === 'skipped') {
        stats.skipped++;
        continue;
      }

      if (styleName === 'image') {
        applyParagraphStyle(doc, para.index, rule.image || {}, true);
        stats.image++;
      } else if (styleName === 'figCaption' || styleName === 'tblCaption') {
        const ruleStyle = rule.styles[styleName];
        if (ruleStyle) {
          applyParagraphStyle(doc, para.index, ruleStyle);
          stats[styleName]++;
        }
      } else if (styleTypes.includes(styleName) && rule.styles[styleName]) {
        applyParagraphStyle(doc, para.index, rule.styles[styleName]);
        if (styleName.startsWith('heading')) stats.heading++;
        else if (styleName === 'body') stats.body++;
      } else {
        stats.skipped++;
      }

      if (i % 20 === 0) {
        onProgress?.({ phase: 'format', current: i, total });
        await yieldToUI();
      }
    }

    onProgress?.({ phase: 'table' });
    applyTableSettings(doc, rule.table);

    onProgress?.({ phase: 'done' });
    return { total, stats };
  } finally {
    setScreenUpdating(true);
  }
}
