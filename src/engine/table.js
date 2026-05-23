import { ptToBorderWidth } from '../utils/unit-convert.js';
import { getTableCount, setTableOuterBorder } from '../utils/wps-api.js';

export function applyTableBorders(doc, tableConfig) {
  if (!tableConfig || tableConfig.outerBorderWidth === undefined) return;

  const lineWidth = ptToBorderWidth(tableConfig.outerBorderWidth);
  const tableCount = getTableCount(doc);

  for (let i = 0; i < tableCount; i++) {
    setTableOuterBorder(doc, i, lineWidth);
  }
}
