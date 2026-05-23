<template>
  <div class="rule-editor">
    <label>中文字体
      <select v-model="style.fontCN" @change="save" :disabled="disabled">
        <option v-for="f in fonts" :key="f" :value="f">{{ f }}</option>
      </select>
    </label>
    <label>西文字体
      <select v-model="style.fontEN" @change="save" :disabled="disabled">
        <option v-for="f in fonts" :key="f" :value="f">{{ f }}</option>
      </select>
    </label>
    <label>字号
      <select v-model.number="style.fontSize" @change="save" :disabled="disabled">
        <option v-for="s in fontSizes" :key="s.pt" :value="s.pt">{{ s.label }}</option>
      </select>
    </label>
    <label>加粗
      <input type="checkbox" v-model="style.bold" @change="save" :disabled="disabled" :true-value="true" :false-value="false" />
    </label>
    <label>对齐
      <select v-model="style.alignment" @change="save" :disabled="disabled">
        <option value="left">左对齐</option>
        <option value="center">居中</option>
        <option value="right">右对齐</option>
        <option value="both">两端对齐</option>
      </select>
    </label>
    <label>段前
      <input type="number" v-model.number="style.spaceBefore" @change="save" min="0" step="1" :disabled="disabled" /> pt
    </label>
    <label>段后
      <input type="number" v-model.number="style.spaceAfter" @change="save" min="0" step="1" :disabled="disabled" /> pt
    </label>
    <label>行距
      <select v-model="style.lineRule" @change="onLineRuleChange" :disabled="disabled">
        <option value="exact">固定值</option>
        <option value="auto">多倍行距</option>
        <option value="atLeast">最小值</option>
      </select>
      <input type="number" v-model.number="style.lineSpacing" @change="save"
        :min="style.lineRule === 'auto' ? 1 : 1"
        :step="style.lineRule === 'auto' ? 0.1 : 1"
        :disabled="disabled" />
      <span>{{ style.lineRule === 'auto' ? '倍' : 'pt' }}</span>
    </label>
    <label v-if="styleKey === 'body'">首行缩进
      <input type="number" v-model.number="style.charIndent" @change="save" min="0" step="1" :disabled="disabled" /> 字符
    </label>
    <label v-if="hasOutlineLevel">大纲级别
      <select v-model.number="style.outlineLevel" @change="save" :disabled="disabled">
        <option v-for="l in 9" :key="l" :value="l">{{ l }} 级</option>
        <option :value="10">正文文本</option>
      </select>
    </label>
  </div>
</template>

<script setup>
import { reactive, watch, computed } from 'vue';
import { useFormatter } from '../composables/useFormatter.js';
import { FONT_SIZES } from '../utils/unit-convert.js';

const props = defineProps({
  styleKey: { type: String, required: true },
});

const { state, getActiveRule, updateRule } = useFormatter();

const fonts = ['宋体', '黑体', '楷体', '仿宋', '微软雅黑', 'Times New Roman', 'Arial', 'Calibri'];
const fontSizes = FONT_SIZES;

const disabled = computed(() => state.formatting);

const hasOutlineLevel = computed(() => ['figCaption', 'tblCaption'].includes(props.styleKey));

const style = reactive({ ...getActiveRule().styles[props.styleKey] });

function onLineRuleChange() {
  if (style.lineRule === 'auto') {
    style.lineSpacing = 1.5;
  } else if (style.lineSpacing < 10) {
    style.lineSpacing = 20;
  }
  save();
}

watch(() => state.activeRuleIndex, () => {
  Object.assign(style, getActiveRule().styles[props.styleKey]);
});

function save() {
  const rule = JSON.parse(JSON.stringify(getActiveRule()));
  rule.styles[props.styleKey] = { ...style };
  updateRule(rule);
}
</script>

<style scoped>
.rule-editor {
  padding: 4px 0 8px;
}
.rule-editor label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 3px 0;
  font-size: 12px;
  color: #4b5563;
}
.rule-editor input[type="number"] {
  width: 50px;
  padding: 2px 4px;
  border: 1px solid #d1d5db;
  border-radius: 3px;
}
.rule-editor select {
  padding: 2px 4px;
  border: 1px solid #d1d5db;
  border-radius: 3px;
}
</style>
