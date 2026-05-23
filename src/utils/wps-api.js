function getApp() {
  if (typeof Application !== 'undefined') return Application;
  if (typeof wps !== 'undefined' && wps.WpsApplication) return wps.WpsApplication();
  throw new Error('WPS Application 不可用，请确认在 WPS 内运行');
}

export function getActiveDocument() {
  const doc = getApp().ActiveDocument;
  if (!doc) throw new Error('请先打开一个文档');
  return doc;
}

export function getParagraphCount(doc) {
  return doc.Paragraphs.Count;
}

export function getParagraphInfo(doc, index) {
  const para = doc.Paragraphs.Item(index + 1);
  const range = para.Range;
  return {
    text: (range.Text || '').trim(),
    outlineLevel: range.OutlineLevel,
    hasImage: range.InlineShapes && range.InlineShapes.Count > 0,
    inTable: range.Tables && range.Tables.Count > 0,
  };
}

export function setPageSetup(doc, settings) {
  const ps = doc.PageSetup;
  if (settings.paperSize !== undefined) ps.PaperSize = settings.paperSize;
  if (settings.topMargin !== undefined) ps.TopMargin = settings.topMargin;
  if (settings.bottomMargin !== undefined) ps.BottomMargin = settings.bottomMargin;
  if (settings.leftMargin !== undefined) ps.LeftMargin = settings.leftMargin;
  if (settings.rightMargin !== undefined) ps.RightMargin = settings.rightMargin;
}

export function setParagraphFormat(doc, index, fmt) {
  const para = doc.Paragraphs.Item(index + 1);
  const range = para.Range;
  const pf = para.Format || range.ParagraphFormat;
  const font = range.Font;

  if (fmt.fontCN !== undefined) font.Name = fmt.fontCN;
  if (fmt.fontEN !== undefined) font.NameAscii = fmt.fontEN;
  if (fmt.fontSize !== undefined) font.Size = fmt.fontSize;
  if (fmt.bold !== undefined) font.Bold = fmt.bold ? -1 : 0;
  if (fmt.alignment !== undefined) pf.Alignment = fmt.alignment;
  if (fmt.spaceBefore !== undefined) pf.SpaceBefore = fmt.spaceBefore;
  if (fmt.spaceAfter !== undefined) pf.SpaceAfter = fmt.spaceAfter;
  if (fmt.lineSpacing !== undefined) pf.LineSpacing = fmt.lineSpacing;
  if (fmt.lineSpacingRule !== undefined) pf.LineSpacingRule = fmt.lineSpacingRule;
  if (fmt.firstLineIndent !== undefined) pf.FirstLineIndent = fmt.firstLineIndent;
  if (fmt.charIndent !== undefined) pf.CharacterUnitFirstLineIndent = fmt.charIndent;
}

export function getTableCount(doc) {
  return doc.Tables.Count;
}

export function setTableOuterBorder(doc, tableIndex, lineWidth) {
  const table = doc.Tables.Item(tableIndex + 1);
  for (const borderType of [-1, -2, -3, -4]) {
    table.Borders(borderType).LineWidth = lineWidth;
  }
}

export function setScreenUpdating(enabled) {
  try {
    getApp().ScreenUpdating = enabled;
  } catch {
    // 部分版本不支持
  }
}
