const HEADING_RE = /^(\d+(?:\.\d+)*)\s/;
const MAX_HEADING_LENGTH = 60;

export function classifyParagraph({ text, outlineLevel, hasImage, inTable }) {
  if (hasImage) return { type: 'image' };

  if (text.startsWith('图') || text.startsWith('表')) {
    return { type: text.startsWith('图') ? 'figCaption' : 'tblCaption' };
  }

  if (outlineLevel >= 1 && outlineLevel <= 4) {
    if (text.length <= MAX_HEADING_LENGTH) {
      return { type: `heading${outlineLevel}` };
    }
    return { type: 'body' };
  }

  if (text.length <= MAX_HEADING_LENGTH) {
    // "第X章 xxx" → heading1, "第X节 xxx" → heading2
    const chapterMatch = text.match(/^(第[一二三四五六七八九十百千\d]+)([章节篇部])/);
    if (chapterMatch) {
      if ('章篇部'.includes(chapterMatch[2])) return { type: 'heading1' };
      if (chapterMatch[2] === '节') return { type: 'heading2' };
    }

    // "1 xxx" → heading1, "1.1 xxx" → heading2, "1.1.1 xxx" → heading3
    const match = text.match(HEADING_RE);
    if (match) {
      const segments = match[1].split('.').length;
      if (segments <= 4) return { type: `heading${segments}` };
    }
  }

  if (inTable) return { type: 'tableContent' };

  return { type: 'body' };
}
