import { ptToBorderWidth } from '../utils/unit-convert.js';
import { getTableCount, setTableOuterBorder, fitTableToWindow } from '../utils/wps-api.js';

export function applyTableSettings(doc, tableConfig) {
  if (!tableConfig) return;

  const tableCount = getTableCount(doc);

  for (let i = 0; i < tableCount; i++) {
    if (tableConfig.outerBorderWidth > 0) {
      setTableOuterBorder(doc, i, ptToBorderWidth(tableConfig.outerBorderWidth));
    }
    if (tableConfig.autoFitWindow) {
      fitTableToWindow(doc, i);
    }
  }
}
