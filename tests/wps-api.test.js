import { describe, expect, it } from 'vitest';
import { setParagraphFormat, convertNumberingToText } from '../src/utils/wps-api.js';

function makeDoc({ initialPf = {} } = {}) {
  const pf = {
    SpaceBefore: 0,
    SpaceAfter: 0,
    LineUnitBefore: 50,
    LineUnitAfter: 50,
    SpaceBeforeAuto: -1,
    SpaceAfterAuto: -1,
    ContextualSpacing: -1,
    LineSpacing: 0,
    LineSpacingRule: 0,
    Alignment: 0,
    FirstLineIndent: 0,
    CharacterUnitFirstLineIndent: 0,
    OutlineLevel: 10,
    ...initialPf,
  };
  const font = { Name: '', NameAscii: '', NameFarEast: '', Size: 0, Bold: 0 };
  const range = { Font: font, ParagraphFormat: pf, Start: 0, End: 10 };
  const para = { Format: pf, Range: range, OutlineLevel: 10 };
  const doc = { Paragraphs: { Item: () => para } };
  return { doc, pf, font, para, range };
}

describe('setParagraphFormat — spacing not overridden by style', () => {
  it('clears LineUnitBefore/SpaceBeforeAuto so SpaceBefore takes effect', () => {
    const { doc, pf } = makeDoc({ initialPf: { LineUnitBefore: 50, SpaceBeforeAuto: -1, SpaceBefore: 0 } });

    setParagraphFormat(doc, 0, { spaceBefore: 24 });

    expect(pf.LineUnitBefore).toBe(0);
    expect(pf.SpaceBeforeAuto).toBe(0);
    expect(pf.SpaceBefore).toBe(24);
  });

  it('clears LineUnitAfter/SpaceAfterAuto so SpaceAfter takes effect', () => {
    const { doc, pf } = makeDoc({ initialPf: { LineUnitAfter: 50, SpaceAfterAuto: -1, SpaceAfter: 0 } });

    setParagraphFormat(doc, 0, { spaceAfter: 18 });

    expect(pf.LineUnitAfter).toBe(0);
    expect(pf.SpaceAfterAuto).toBe(0);
    expect(pf.SpaceAfter).toBe(18);
  });

  it('clears ContextualSpacing whenever spacing is being set', () => {
    const { doc, pf } = makeDoc({ initialPf: { ContextualSpacing: -1 } });

    setParagraphFormat(doc, 0, { spaceBefore: 12 });

    expect(pf.ContextualSpacing).toBe(0);
  });

  it('does not touch spacing-related fields when spacing is not in the payload', () => {
    const { doc, pf } = makeDoc({ initialPf: { LineUnitBefore: 50, LineUnitAfter: 50, ContextualSpacing: -1 } });

    setParagraphFormat(doc, 0, { fontSize: 16, alignment: 1 });

    expect(pf.LineUnitBefore).toBe(50);
    expect(pf.LineUnitAfter).toBe(50);
    expect(pf.ContextualSpacing).toBe(-1);
  });

  it('writes the supplied point values verbatim', () => {
    const { doc, pf } = makeDoc();

    setParagraphFormat(doc, 0, { spaceBefore: 24, spaceAfter: 18, lineSpacing: 25, lineSpacingRule: 4 });

    expect(pf.SpaceBefore).toBe(24);
    expect(pf.SpaceAfter).toBe(18);
    expect(pf.LineSpacing).toBe(25);
    expect(pf.LineSpacingRule).toBe(4);
  });
});

describe('convertNumberingToText — auto numbering becomes plain text', () => {
  function makeListPara({ ilvl = 1, before = '概述\r', afterConvert = '第一章概述\r' } = {}) {
    let text = before;
    let converted = false;
    const lf = {
      ListLevelNumber: ilvl,
      ConvertNumbersToText: () => { converted = true; text = afterConvert; },
    };
    const range = {
      get Text() { return text; },
      ListFormat: lf,
      Start: 100,
    };
    const para = { Range: range };
    const inserts = [];
    const doc = {
      Paragraphs: { Item: () => para },
      Range: (start, end) => ({
        Text: (start === end) ? '' : text.slice(start - 100, end - 100),
        InsertAfter: (s) => { inserts.push({ start, end, s }); text = text.slice(0, end - 100) + s + text.slice(end - 100); },
      }),
    };
    return { doc, lf, para, inserts, getText: () => text, wasConverted: () => converted };
  }

  it('returns true and converts numbering, inserting a space separator', () => {
    const { doc, getText, wasConverted } = makeListPara();

    const ok = convertNumberingToText(doc, 0);

    expect(ok).toBe(true);
    expect(wasConverted()).toBe(true);
    expect(getText()).toBe('第一章 概述\r');
  });

  it('does not insert space when separator already exists', () => {
    const { doc, getText } = makeListPara({ before: '概述\r', afterConvert: '第一章 概述\r' });

    convertNumberingToText(doc, 0);

    expect(getText()).toBe('第一章 概述\r');
  });

  it('returns false when paragraph has no list level', () => {
    const para = { Range: { ListFormat: { ListLevelNumber: 0, ConvertNumbersToText: () => {} }, Text: '正文', Start: 0 } };
    const doc = { Paragraphs: { Item: () => para }, Range: () => ({ Text: '', InsertAfter: () => {} }) };

    expect(convertNumberingToText(doc, 0)).toBe(false);
  });

  it('returns false when ListFormat is missing', () => {
    const para = { Range: { Text: '', Start: 0 } };
    const doc = { Paragraphs: { Item: () => para } };

    expect(convertNumberingToText(doc, 0)).toBe(false);
  });

  it('returns false when ConvertNumbersToText throws', () => {
    const lf = { ListLevelNumber: 1, ConvertNumbersToText: () => { throw new Error('not supported'); } };
    const para = { Range: { ListFormat: lf, Text: '概述', Start: 0 } };
    const doc = { Paragraphs: { Item: () => para }, Range: () => ({ Text: '', InsertAfter: () => {} }) };

    expect(convertNumberingToText(doc, 0)).toBe(false);
  });
});
