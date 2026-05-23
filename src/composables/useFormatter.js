import { reactive } from 'vue';
import { defaultRules } from '../config/default-rules.js';
import { formatDocument } from '../engine/formatter.js';
import { exportRuleToFile, importRuleFromFile } from '../utils/file-io.js';

const STORAGE_KEY = 'word-formatter-rules';

function loadRules() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [{ ...JSON.parse(JSON.stringify(defaultRules)) }];
}

const state = reactive({
  rules: loadRules(),
  activeRuleIndex: 0,
  formatting: false,
  progress: '就绪',
  result: null,
  error: null,
});

export function useFormatter() {
  function getActiveRule() {
    return state.rules[state.activeRuleIndex] || defaultRules;
  }

  function setActiveRule(index) {
    state.activeRuleIndex = index;
  }

  function updateRule(rule) {
    state.rules[state.activeRuleIndex] = rule;
    saveRules();
  }

  function addRule(name) {
    const newRule = { ...JSON.parse(JSON.stringify(defaultRules)), name };
    state.rules.push(newRule);
    state.activeRuleIndex = state.rules.length - 1;
    saveRules();
  }

  function deleteRule(index) {
    if (state.rules.length <= 1) return;
    state.rules.splice(index, 1);
    if (state.activeRuleIndex >= state.rules.length) {
      state.activeRuleIndex = state.rules.length - 1;
    }
    saveRules();
  }

  function resetDefault() {
    state.rules[state.activeRuleIndex] = JSON.parse(JSON.stringify(defaultRules));
    saveRules();
  }

  function saveRules() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.rules));
  }

  async function doFormat() {
    state.formatting = true;
    state.error = null;
    state.result = null;
    state.progress = '准备排版...';

    try {
      const rule = getActiveRule();
      const result = await formatDocument(rule, (msg) => {
        state.progress = msg;
      });
      state.result = result;
    } catch (err) {
      state.error = err.message || '排版失败';
    } finally {
      state.formatting = false;
    }
  }

  async function doImport() {
    try {
      const rule = await importRuleFromFile();
      state.rules.push(rule);
      state.activeRuleIndex = state.rules.length - 1;
      saveRules();
    } catch (err) {
      state.error = err.message;
    }
  }

  function doExport() {
    exportRuleToFile(getActiveRule());
  }

  return {
    state,
    getActiveRule,
    setActiveRule,
    updateRule,
    addRule,
    deleteRule,
    resetDefault,
    doFormat,
    doImport,
    doExport,
  };
}
