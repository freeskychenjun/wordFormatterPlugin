const CAPTION_RE = /^[图表]\s*[\d一二三四五六七八九十]/;
const HEADING_RE = /^(\d+(?:\.\d+)*)\s/;
const MAX_HEADING_LENGTH = 60;

// Match both English "heading 1" and Chinese "标题 1" style names
const HEADING_STYLE_RE = /(?:heading|标题)\s+(\d+)/i;

function headingFromStyle(styleName) {
  if (!styleName) return null;
  const m = styleName.match(HEADING_STYLE_RE);
  if (m) {
    const level = parseInt(m[1]);
    if (level >= 1 && level <= 4) return level;
  }
  return null;
}

export function classifyParagraph({ text, outlineLevel, hasImage, inTable, styleName }) {
  if (hasImage) return { type: 'image' };

  // Detect heading by style name (most reliable in WPS JSAPI)
  const styleLevel = headingFromStyle(styleName);
  if (styleLevel && text.length <= MAX_HEADING_LENGTH) {
    return { type: `heading${styleLevel}` };
  }

  // Also check outlineLevel as fallback
  if (typeof outlineLevel === 'number' && outlineLevel >= 0 && outlineLevel <= 3) {
    if (text.length <= MAX_HEADING_LENGTH) {
      return { type: `heading${outlineLevel + 1}` };
    }
    return { type: 'body' };
  }

  if (CAPTION_RE.test(text)) {
    return { type: text.startsWith('图') ? 'figCaption' : 'tblCaption' };
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
