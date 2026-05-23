const CAPTION_RE = /^(图|表)\s*\d/;
const HEADING_RE = /^(\d+(?:\.\d+)*)\s/;
const MAX_HEADING_LENGTH = 60;

export function classifyParagraph({ text, outlineLevel, hasImage, inTable }) {
  if (hasImage) return { type: 'image' };

  if (CAPTION_RE.test(text)) return { type: 'caption' };

  if (outlineLevel >= 1 && outlineLevel <= 4) {
    if (text.length <= MAX_HEADING_LENGTH) {
      return { type: `heading${outlineLevel}` };
    }
    return { type: 'body' };
  }

  const match = text.match(HEADING_RE);
  if (match) {
    if (text.length <= MAX_HEADING_LENGTH) {
      const segments = match[1].split('.').length;
      if (segments <= 4) return { type: `heading${segments}` };
    }
  }

  if (inTable) return { type: 'tableContent' };

  return { type: 'body' };
}
