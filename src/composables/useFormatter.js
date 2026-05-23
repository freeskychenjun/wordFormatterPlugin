import { reactive } from 'vue';
import { defaultRules } from '../config/default-rules.js';
import { formatDocument } from '../engine/formatter.js';
import { exportRuleToFile, importRuleFromFile } from '../utils/file-io.js';

const STORAGE_KEY = 'word-formatter-rules';

function loadRules() {
  let rules;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) rules = JSON.parse(saved);
  } catch { /* ignore */ }
  if (!rules) return [{ ...JSON.parse(JSON.stringify(defaultRules)) }];

  // Migrate: ensure figCaption/tblCaption exist, remove old caption, fix heading lineRule
  for (const rule of rules) {
    if (rule.styles) {
      if (!rule.styles.figCaption) {
        rule.styles.figCaption = { ...JSON.parse(JSON.stringify(defaultRules.styles.figCaption)) };
      }
      if (!rule.styles.tblCaption) {
        rule.styles.tblCaption = { ...JSON.parse(JSON.stringify(defaultRules.styles.tblCaption)) };
      }
      delete rule.styles.caption;
      for (const h of ['heading1', 'heading2', 'heading3', 'heading4']) {
        if (rule.styles[h] && rule.styles[h].lineRule === 'exact') {
          rule.styles[h].lineSpacing = 1.5;
          rule.styles[h].lineRule = 'auto';
        }
      }
    }
  }
  return rules;
}

const state = reactive({
  rules: loadRules(),
  activeRuleIndex: 0,
  formatting: false,
  progress: '就绪',
  progressPct: 0,
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
      const result = await formatDocument(rule, (info) => {
        if (typeof info === 'string') {
          state.progress = info;
          state.progressPct = 0;
          return;
        }
        switch (info.phase) {
          case 'page':
            state.progress = '正在设置页面...';
            state.progressPct = 0;
            break;
          case 'scan':
            state.progress = '正在扫描文档结构...';
            state.progressPct = Math.round((info.current / info.total) * 30);
            break;
          case 'format':
            state.progress = '正在排版...';
            state.progressPct = 30 + Math.round((info.current / info.total) * 65);
            break;
          case 'table':
            state.progress = '正在处理表格...';
            state.progressPct = 95;
            break;
          case 'done':
            state.progress = '排版完成';
            state.progressPct = 100;
            break;
        }
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
