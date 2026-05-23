<template>
  <div class="format-progress">
    <div v-if="state.formatting" class="progress-active">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent }"></div>
      </div>
      <p class="progress-text">{{ state.progress }}</p>
    </div>
    <div v-else-if="state.result" class="progress-done">
      <p>排版完成</p>
      <p class="stats">
        共处理 {{ state.result.total }} 段：
        标题 {{ state.result.stats.heading }} 段，
        正文 {{ state.result.stats.body }} 段，
        图片 {{ state.result.stats.image }} 段，
        图标题 {{ state.result.stats.figCaption }} 段，
        表标题 {{ state.result.stats.tblCaption }} 段
      </p>
    </div>
    <div v-if="state.error" class="progress-error">
      <p>{{ state.error }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFormatter } from '../composables/useFormatter.js';

const { state } = useFormatter();

const progressPercent = computed(() => {
  return state.progressPct + '%';
});
</script>

<style scoped>
.format-progress {
  padding: 8px 0;
  font-size: 12px;
}
.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s;
}
.progress-text {
  margin: 4px 0 0;
  color: #6b7280;
}
.progress-done {
  color: #059669;
}
.progress-done .stats {
  color: #6b7280;
  margin-top: 4px;
}
.progress-error {
  color: #dc2626;
}
</style>
