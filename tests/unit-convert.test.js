import { describe, it, expect } from 'vitest';
import {
  cmToPoints, pointsToCm, ptToBorderWidth,
  WdAlign, WdLineSpacing, WdOutlineLevel, WdPaperSize, WdBorder,
} from '../src/utils/unit-convert.js';

describe('cmToPoints', () => {
  it('converts 1 cm to points', () => {
    expect(cmToPoints(1)).toBeCloseTo(28.35, 1);
  });
  it('converts 0 cm to 0 points', () => {
    expect(cmToPoints(0)).toBe(0);
  });
  it('converts 3.7 cm to points', () => {
    expect(cmToPoints(3.7)).toBeCloseTo(104.895, 2);
  });
});

describe('pointsToCm', () => {
  it('converts points back to cm', () => {
    expect(pointsToCm(28.35)).toBeCloseTo(1, 1);
  });
});

describe('ptToBorderWidth', () => {
  it('converts 1.5pt to border width (eighths of a point)', () => {
    expect(ptToBorderWidth(1.5)).toBe(12);
  });
  it('converts 0.5pt to border width', () => {
    expect(ptToBorderWidth(0.5)).toBe(4);
  });
});

describe('WPS constants', () => {
  it('has correct alignment values', () => {
    expect(WdAlign.LEFT).toBe(0);
    expect(WdAlign.CENTER).toBe(1);
    expect(WdAlign.RIGHT).toBe(2);
    expect(WdAlign.JUSTIFY).toBe(3);
  });
  it('has correct line spacing values', () => {
    expect(WdLineSpacing.EXACTLY).toBe(4);
    expect(WdLineSpacing.MULTIPLE).toBe(5);
  });
  it('has correct outline level values', () => {
    expect(WdOutlineLevel.LEVEL1).toBe(0);
    expect(WdOutlineLevel.BODY_TEXT).toBe(10);
  });
  it('has correct paper size values', () => {
    expect(WdPaperSize.A4).toBe(7);
  });
});
