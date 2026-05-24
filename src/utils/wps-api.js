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
  const orient = Number(ps.Orientation);
  if (settings.topMargin !== undefined) ps.TopMargin = settings.topMargin;
  if (settings.bottomMargin !== undefined) ps.BottomMargin = settings.bottomMargin;
  if (settings.leftMargin !== undefined) ps.LeftMargin = settings.leftMargin;
  if (settings.rightMargin !== undefined) ps.RightMargin = settings.rightMargin;
  ps.Orientation = orient;
}

function applyFont(font, fmt) {
  if (fmt.fontCN !== undefined) {
    try { font.NameFarEast = fmt.fontCN; } catch { /* WPS may not expose NameFarEast */ }
    font.Name = fmt.fontCN;
  }
  if (fmt.fontEN !== undefined) font.NameAscii = fmt.fontEN;
  if (fmt.fontSize !== undefined) font.Size = fmt.fontSize;
  if (fmt.bold !== undefined) font.Bold = fmt.bold ? -1 : 0;
}

export function setParagraphFormat(doc, index, fmt) {
  const para = doc.Paragraphs.Item(index + 1);
  const range = para.Range;
  const pf = para.Format || range.ParagraphFormat;

  applyFont(range.Font, fmt);

  if (fmt.alignment !== undefined) pf.Alignment = fmt.alignment;
  if (fmt.spaceBefore !== undefined || fmt.spaceAfter !== undefined) {
    try { pf.ContextualSpacing = 0; } catch { /* ignore */ }
  }
  if (fmt.spaceBefore !== undefined) {
    try { pf.LineUnitBefore = 0; } catch { /* ignore */ }
    try { pf.SpaceBeforeAuto = 0; } catch { /* ignore */ }
    pf.SpaceBefore = fmt.spaceBefore;
  }
  if (fmt.spaceAfter !== undefined) {
    try { pf.LineUnitAfter = 0; } catch { /* ignore */ }
    try { pf.SpaceAfterAuto = 0; } catch { /* ignore */ }
    pf.SpaceAfter = fmt.spaceAfter;
  }
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
    border.LineStyle = 1;
    border.LineWidth = lineWidth;
    border.Visible = true;
  }
}

export function setTableFont(doc, tableIndex, fontCN, fontEN) {
  const table = doc.Tables.Item(tableIndex + 1);
  const rows = table.Rows;
  const rowCount = rows.Count;
  for (let r = 1; r <= rowCount; r++) {
    let cells;
    try { cells = rows.Item(r).Cells; } catch { continue; }
    const cellCount = cells.Count;
    for (let c = 1; c <= cellCount; c++) {
      try {
        const f = cells.Item(c).Range.Font;
        if (fontCN !== undefined) f.Name = fontCN;
        if (fontEN !== undefined) f.NameAscii = fontEN;
      } catch {
        // merged cells may throw
      }
    }
  }
}

export function fitTableToWindow(doc, tableIndex) {
  try {
    const table = doc.Tables.Item(tableIndex + 1);
    table.AutoFitBehavior(2);
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

// 自动编号（如 "第一章"）由 numbering 渲染，不在文本流中，光标和 Selection 都摸不到，
// 任何对段落字体的设置都覆盖不到它。把编号转成普通文本后，"第一章" 才能跟随段落字体。
// 副作用：转换后失去自动重编号能力（新增/删除章节不会重排序）。
// 这里同时在编号和正文之间补一个空格，因为 ConvertNumbersToText 不保留 OOXML 的 <w:suff>。
export function convertNumberingToText(doc, paragraphIndex) {
  let para;
  try { para = doc.Paragraphs.Item(paragraphIndex + 1); } catch { return false; }

  const lf = para.Range.ListFormat;
  if (!lf) return false;
  let ilvl;
  try { ilvl = Number(lf.ListLevelNumber); } catch { return false; }
  if (!Number.isFinite(ilvl) || ilvl < 1) return false;

  const before = (() => { try { return para.Range.Text || ''; } catch { return ''; } })();

  try { lf.ConvertNumbersToText(); } catch { return false; }

  // 在编号末尾插一个空格分隔编号和正文
  try {
    const after = para.Range.Text || '';
    if (after.length > before.length) {
      const inserted = after.slice(0, after.length - before.length);
      const insertEnd = para.Range.Start + inserted.length;
      const probe = doc.Range(insertEnd - 1, insertEnd);
      const ch = (probe.Text || '');
      if (ch && ch !== ' ' && ch !== '\t') {
        const insertPoint = doc.Range(insertEnd, insertEnd);
        insertPoint.InsertAfter(' ');
      }
    }
  } catch { /* 缺 doc.Range / InsertAfter 时跳过分隔符补偿 */ }

  return true;
}
