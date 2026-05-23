import { WdAlign, WdLineSpacing } from '../utils/unit-convert.js';
import { setParagraphFormat } from '../utils/wps-api.js';

const ALIGN_MAP = {
  left: WdAlign.LEFT,
  center: WdAlign.CENTER,
  right: WdAlign.RIGHT,
  both: WdAlign.JUSTIFY,
};

const LINE_RULE_MAP = {
  exact: WdLineSpacing.EXACTLY,
  auto: WdLineSpacing.MULTIPLE,
  atLeast: WdLineSpacing.AT_LEAST,
};

function buildFormatArgs(styleRule, isImage) {
  const fmt = {};

  if (isImage) {
    fmt.alignment = WdAlign.CENTER;
    fmt.lineSpacingRule = WdLineSpacing.MULTIPLE;
    fmt.lineSpacing = (styleRule.lineSpacing || 1.5) * 12;
    fmt.firstLineIndent = 0;
    fmt.charIndent = 0;
    return fmt;
  }

  if (styleRule.fontCN !== undefined) fmt.fontCN = styleRule.fontCN;
  if (styleRule.fontEN !== undefined) fmt.fontEN = styleRule.fontEN;
  if (styleRule.fontSize !== undefined) fmt.fontSize = styleRule.fontSize;
  if (styleRule.bold !== undefined) fmt.bold = styleRule.bold;

  if (styleRule.alignment !== undefined) {
    fmt.alignment = ALIGN_MAP[styleRule.alignment] ?? WdAlign.JUSTIFY;
  }

  if (styleRule.spaceBefore !== undefined) fmt.spaceBefore = styleRule.spaceBefore;
  if (styleRule.spaceAfter !== undefined) fmt.spaceAfter = styleRule.spaceAfter;

  if (styleRule.lineSpacing !== undefined && styleRule.lineRule) {
    fmt.lineSpacingRule = LINE_RULE_MAP[styleRule.lineRule] ?? WdLineSpacing.EXACTLY;
    if (styleRule.lineRule === 'auto') {
      fmt.lineSpacing = styleRule.lineSpacing * 12;
    } else {
      fmt.lineSpacing = styleRule.lineSpacing;
    }
  }

  if (styleRule.charIndent !== undefined) {
    fmt.charIndent = styleRule.charIndent;
    fmt.firstLineIndent = 0;
  } else if (styleRule.firstLineIndent !== undefined) {
    fmt.firstLineIndent = styleRule.firstLineIndent;
    fmt.charIndent = 0;
  }

  return fmt;
}

export function applyParagraphStyle(doc, index, styleRule, isImage = false) {
  const fmt = buildFormatArgs(styleRule, isImage);
  setParagraphFormat(doc, index, fmt);
}
