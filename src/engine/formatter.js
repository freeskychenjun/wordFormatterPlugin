import { getActiveDocument, setScreenUpdating } from '../utils/wps-api.js';
import { scanDocument } from './style-detector.js';
import { applyPageSetup } from './page-setup.js';
import { applyParagraphStyle } from './paragraph.js';
import { applyTableBorders } from './table.js';

export async function formatDocument(rule, onProgress) {
  const doc = getActiveDocument();

  setScreenUpdating(false);
  try {
    onProgress?.('正在设置页面...');
    applyPageSetup(doc, rule.pageSetup);

    onProgress?.('正在扫描文档结构...');
    const paragraphs = scanDocument(doc);

    const total = paragraphs.length;
    const stats = { heading: 0, body: 0, image: 0, caption: 0, skipped: 0 };
    const styleTypes = ['heading1', 'heading2', 'heading3', 'heading4', 'body', 'caption'];

    for (let i = 0; i < total; i++) {
      const para = paragraphs[i];
      const styleName = para.type;

      if (styleName === 'tableContent') {
        stats.skipped++;
        continue;
      }

      if (styleName === 'image') {
        applyParagraphStyle(doc, para.index, rule.image || {}, true);
        stats.image++;
      } else if (styleTypes.includes(styleName) && rule.styles[styleName]) {
        applyParagraphStyle(doc, para.index, rule.styles[styleName]);
        if (styleName.startsWith('heading')) stats.heading++;
        else if (styleName === 'body') stats.body++;
        else if (styleName === 'caption') stats.caption++;
      } else {
        stats.skipped++;
      }

      if (i % 50 === 0) {
        onProgress?.(`正在排版... ${Math.round((i / total) * 100)}%`);
      }
    }

    onProgress?.('正在处理表格...');
    applyTableBorders(doc, rule.table);

    onProgress?.('排版完成');
    return { total, stats };
  } finally {
    setScreenUpdating(true);
  }
}
