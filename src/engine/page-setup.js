import { cmToPoints, WdPaperSize } from '../utils/unit-convert.js';
import { setPageSetup } from '../utils/wps-api.js';

const PAPER_SIZE_MAP = {
  A4: WdPaperSize.A4,
};

export function applyPageSetup(doc, pageSetupConfig) {
  if (!pageSetupConfig) return;

  const settings = {};

  if (pageSetupConfig.paperSize) {
    settings.paperSize = PAPER_SIZE_MAP[pageSetupConfig.paperSize] || WdPaperSize.A4;
  }
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
