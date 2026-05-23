<template>
  <div class="task-pane">
    <h2 class="title">文档排版助手</h2>

    <div class="rule-select">
      <label>当前规则</label>
      <select :value="state.activeRuleIndex" @change="setActiveRule($event.target.value * 1)" :disabled="state.formatting">
        <option v-for="(rule, i) in state.rules" :key="i" :value="i">{{ rule.name }}</option>
      </select>
    </div>

    <button class="format-btn" @click="doFormat" :disabled="state.formatting">
      {{ state.formatting ? '排版中...' : '一键排版' }}
    </button>

    <FormatProgress />

    <div class="sections">
      <details v-for="(style, key) in activeStyles" :key="key">
        <summary>{{ style.label || key }}</summary>
        <RuleEditor :style-key="key" />
      </details>
      <details>
        <summary>页面设置</summary>
        <div class="page-fields">
          <label>纸张 <select v-model="activeRule.pageSetup.paperSize" @change="save" :disabled="state.formatting">
            <option value="A4">A4</option>
          </select></label>
          <label>上边距 <input type="number" v-model.number="activeRule.pageSetup.marginTop" @change="save" step="0.1" min="0" :disabled="state.formatting" /> cm</label>
          <label>下边距 <input type="number" v-model.number="activeRule.pageSetup.marginBottom" @change="save" step="0.1" min="0" :disabled="state.formatting" /> cm</label>
          <label>左边距 <input type="number" v-model.number="activeRule.pageSetup.marginLeft" @change="save" step="0.1" min="0" :disabled="state.formatting" /> cm</label>
          <label>右边距 <input type="number" v-model.number="activeRule.pageSetup.marginRight" @change="save" step="0.1" min="0" :disabled="state.formatting" /> cm</label>
        </div>
      </details>
      <details>
        <summary>表格</summary>
        <div class="table-fields">
          <label>外边框线宽 <input type="number" v-model.number="activeRule.table.outerBorderWidth" @change="save" step="0.5" min="0" max="3" :disabled="state.formatting" /> pt（0 = 不设置）</label>
          <label><input type="checkbox" v-model="activeRule.table.autoFitWindow" @change="save" :disabled="state.formatting" :true-value="true" :false-value="false" /> 根据窗口调整表格</label>
        </div>
      </details>
      <details>
        <summary>跳过页面</summary>
        <div class="skip-fields">
          <label>跳过前 <input type="number" v-model.number="activeRule.skipPages" @change="save" min="0" step="1" :disabled="state.formatting" /> 页（0 = 不跳过）</label>
          <p class="hint">封面、目录等不需要排版的页面</p>
        </div>
      </details>
    </div>

    <ConfigManager />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFormatter } from '../composables/useFormatter.js';
import FormatProgress from './FormatProgress.vue';
import RuleEditor from './RuleEditor.vue';
import ConfigManager from './ConfigManager.vue';

const { state, getActiveRule, setActiveRule, updateRule, doFormat } = useFormatter();

const activeRule = computed(() => getActiveRule());

const activeStyles = computed(() => activeRule.value.styles || {});

function save() {
  updateRule(JSON.parse(JSON.stringify(activeRule.value)));
}
</script>

<style scoped>
.task-pane {
  padding: 12px;
  font-family: -apple-system, "Microsoft YaHei", sans-serif;
  font-size: 13px;
  color: #1f2937;
}
.title {
  font-size: 16px;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}
.rule-select {
  margin-bottom: 12px;
}
.rule-select label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #6b7280;
}
.rule-select select {
  width: 100%;
  padding: 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}
.format-btn {
  width: 100%;
  padding: 10px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 12px;
}
.format-btn:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}
.sections details {
  border-bottom: 1px solid #f3f4f6;
}
.sections summary {
  padding: 8px 0;
  cursor: pointer;
  font-weight: 500;
}
.page-fields label,
.table-fields label,
.skip-fields label {
  display: block;
  margin: 4px 0;
  font-size: 12px;
  color: #4b5563;
}
.page-fields input,
.page-fields select,
.table-fields input,
.skip-fields input {
  width: 60px;
  padding: 3px 6px;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  margin: 0 4px;
}
.skip-fields .hint {
  font-size: 11px;
  color: #9ca3af;
  margin: 2px 0 0;
}
</style>
