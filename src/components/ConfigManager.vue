<template>
  <div class="config-manager">
    <div class="actions">
      <button @click="handleImport" :disabled="state.formatting">导入规则</button>
      <button @click="doExport" :disabled="state.formatting">导出规则</button>
    </div>
    <div class="rule-actions">
      <button @click="handleAdd" :disabled="state.formatting">+ 新建规则模板</button>
      <button @click="handleReset" :disabled="state.formatting">恢复默认</button>
      <button v-if="state.rules.length > 1" @click="handleDelete" :disabled="state.formatting" class="btn-danger">删除当前</button>
    </div>
  </div>
</template>

<script setup>
import { useFormatter } from '../composables/useFormatter.js';

const { state, addRule, deleteRule, resetDefault, doImport, doExport } = useFormatter();

function handleAdd() {
  const name = prompt('请输入新规则名称:');
  if (name) addRule(name);
}

function handleDelete() {
  if (confirm('确定删除当前规则模板？')) {
    deleteRule(state.activeRuleIndex);
  }
}

function handleReset() {
  if (confirm('确定恢复为默认规则？当前修改将丢失。')) {
    resetDefault();
  }
}

function handleImport() {
  doImport();
}
</script>

<style scoped>
.config-manager {
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}
.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.rule-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
button {
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-danger {
  color: #dc2626;
  border-color: #fca5a5;
}
</style>
