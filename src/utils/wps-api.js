function getApp() {
  if (typeof window.Application !== 'undefined') return window.Application;
  if (typeof window.wps !== 'undefined' && window.wps.WpsApplication) return window.wps.WpsApplication();
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
  let styleName = '';
  try { styleName = para.Style?.NameLocal || para.Style || ''; } catch { /* ignore */ }
  return {
    text: (range.Text || '').trim(),
    outlineLevel: range.OutlineLevel,
    styleName,
    hasImage: range.InlineShapes && range.InlineShapes.Count > 0,
    rangeStart: range.Start,
    rangeEnd: range.End,
    pageNumber: range.Information ? range.Information(3) : 0,
  };
}

export function getTableRanges(doc) {
  const count = doc.Tables.Count;
  const ranges = [];
  for (let i = 1; i <= count; i++) {
    const tbl = doc.Tables.Item(i);
    ranges.push({ start: tbl.Range.Start, end: tbl.Range.End });
  }
  return ranges;
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
  if (fmt.outlineLevel !== undefined) {
    try { para.OutlineLevel = fmt.outlineLevel; } catch { /* fallback */ }
    try { pf.OutlineLevel = fmt.outlineLevel; } catch { /* ignore */ }
  }
}

export function getTableCount(doc) {
  return doc.Tables.Count;
}

export function setTableOuterBorder(doc, tableIndex, lineWidth) {
  const table = doc.Tables.Item(tableIndex + 1);
  for (const borderType of [-1, -2, -3, -4]) {
    const border = table.Borders.Item(borderType);
    border.LineStyle = 1;       // wdLineStyleSingle = 1
    border.LineWidth = lineWidth;
    border.Visible = true;
  }
}

export function fitTableToWindow(doc, tableIndex) {
  try {
    const table = doc.Tables.Item(tableIndex + 1);
    table.AutoFitBehavior(2); // wdAutoFitWindow = 2
  } catch {
    // 部分版本不支持
  }
}

export function setScreenUpdating(enabled) {
  try {
    getApp().ScreenUpdating = enabled;
  } catch {
    // 部分版本不支持
  }
}
