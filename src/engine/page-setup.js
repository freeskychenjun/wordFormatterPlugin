import { cmToPoints } from '../utils/unit-convert.js';
import { setPageSetup } from '../utils/wps-api.js';

export function applyPageSetup(doc, pageSetupConfig) {
  if (!pageSetupConfig) return;

  const settings = {};

  if (pageSetupConfig.marginTop !== undefined) {
    settings.topMargin = cmToPoints(pageSetupConfig.marginTop);
  }
  if (pageSetupConfig.marginBottom !== undefined) {
    settings.bottomMargin = cmToPoints(pageSetupConfig.marginBottom);
  }
  if (pageSetupConfig.marginLeft !== undefined) {
    settings.leftMargin = cmToPoints(pageSetupConfig.marginLeft);
  }
  if (pageSetupConfig.marginRight !== undefined) {
    settings.rightMargin = cmToPoints(pageSetupConfig.marginRight);
  }

  setPageSetup(doc, settings);
}
