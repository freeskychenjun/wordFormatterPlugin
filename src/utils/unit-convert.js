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
  LEVEL1: 1,
  LEVEL2: 2,
  LEVEL3: 3,
  LEVEL4: 4,
  LEVEL5: 5,
  LEVEL6: 6,
  LEVEL7: 7,
  LEVEL8: 8,
  LEVEL9: 9,
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
