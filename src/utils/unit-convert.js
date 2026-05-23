export const CM_TO_POINTS = 28.35;

export function cmToPoints(cm) {
  return cm * CM_TO_POINTS;
}

export function pointsToCm(points) {
  return points / CM_TO_POINTS;
}

export function ptToBorderWidth(pt) {
  return Math.round(pt * 8);
}

export const WdAlign = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
  JUSTIFY: 3,
};

export const WdLineSpacing = {
  SINGLE: 0,
  ONE_POINT_FIVE: 1,
  DOUBLE: 2,
  AT_LEAST: 3,
  EXACTLY: 4,
  MULTIPLE: 5,
};

export const WdOutlineLevel = {
  LEVEL1: 0,
  LEVEL2: 1,
  LEVEL3: 2,
  LEVEL4: 3,
  LEVEL5: 4,
  LEVEL6: 5,
  LEVEL7: 6,
  LEVEL8: 7,
  LEVEL9: 8,
  BODY_TEXT: 10,
};

export const WdBorder = {
  TOP: -1,
  LEFT: -2,
  BOTTOM: -3,
  RIGHT: -4,
};

export const WdPaperSize = {
  A4: 7,
};

// 中文字号对照表，从大到小排列
export const FONT_SIZES = [
  { label: '初号', pt: 42 },
  { label: '小初', pt: 36 },
  { label: '一号', pt: 26 },
  { label: '小一', pt: 24 },
  { label: '二号', pt: 22 },
  { label: '小二', pt: 18 },
  { label: '三号', pt: 16 },
  { label: '小三', pt: 15 },
  { label: '四号', pt: 14 },
  { label: '小四', pt: 12 },
  { label: '五号', pt: 10.5 },
  { label: '小五', pt: 9 },
  { label: '六号', pt: 7.5 },
  { label: '小六', pt: 6.5 },
  { label: '七号', pt: 5.5 },
  { label: '八号', pt: 5 },
];

export function fontSizeLabel(pt) {
  const found = FONT_SIZES.find(s => s.pt === pt);
  return found ? found.label : pt + 'pt';
}
