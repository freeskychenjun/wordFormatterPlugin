function OnAddinLoad(ribbonUI) {
  if (typeof window.Application.ribbonUI !== 'object') {
    window.Application.ribbonUI = ribbonUI;
  }
  return true;
}

function OnAction(control) {
  switch (control.Id) {
    case 'openTaskPane':
      openTaskPane();
      break;
  }
  return true;
}

function openTaskPane() {
  if (typeof window.Application === 'undefined') return;

  const tsId = window.Application.PluginStorage.getItem('formatTaskPaneId');
  if (tsId) {
    const tp = window.Application.GetTaskPane(tsId);
    if (tp) {
      tp.Visible = !tp.Visible;
      return;
    }
  }

  const url = getBaseUrl();
  const tp = window.Application.CreateTaskPane(url);
  if (tp) {
    window.Application.PluginStorage.setItem('formatTaskPaneId', tp.ID);
    tp.Visible = true;
  }
}

function getBaseUrl() {
  const href = window.location.href;
  const hashIdx = href.indexOf('#');
  return hashIdx >= 0 ? href.substring(0, hashIdx) : href;
}

function LoadImage(imageName) {
  if (imageName === 'assistant') {
    return 'icon.png';
  }
  return '';
}

function GetImage(control) {
  if (control && control.Id === 'openTaskPane') {
    return 'icon.png';
  }
  return '';
}

function OnGetEnabled() {
  return true;
}

function OnGetVisible() {
  return true;
}

export default {
  OnAddinLoad,
  OnAction,
  LoadImage,
  GetImage,
  OnGetEnabled,
  OnGetVisible,
};
