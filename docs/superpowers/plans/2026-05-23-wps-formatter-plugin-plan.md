# WPS 文档排版插件 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个嵌入 WPS Office 的文档排版加载项，支持可配置排版规则，一键格式化文档。

**Architecture:** Vue 3 + Vite 前端运行在 WPS 任务窗格中，通过 WPS JSAPI 操作文档对象。排版引擎按模块拆分（页面、段落、表格、图片），规则系统支持可视化编辑和 JSON 文件导入/导出。

**Tech Stack:** WPS JSAPI, Vue 3 (Composition API + `<script setup>`), Vite, Vitest

---

## File Structure

```
wordFormatterPlugin/
├── src/
│   ├── main.js                        # Vue 入口
│   ├── App.vue                        # 根组件
│   ├── composables/
│   │   └── useFormatter.js            # 排版状态管理
│   ├── components/
│   │   ├── TaskPane.vue               # 主面板
│   │   ├── RuleEditor.vue             # 规则编辑器
│   │   ├── ConfigManager.vue          # 配置导入/导出
│   │   └── FormatProgress.vue         # 排版进度
│   ├── engine/
│   │   ├── formatter.js               # 排版主流程
│   │   ├── page-setup.js              # 页面设置
│   │   ├── paragraph.js               # 段落与字体
│   │   ├── table.js                   # 表格排版
│   │   ├── style-classifier.js        # 纯函数：段落分类逻辑
│   │   └── style-detector.js          # 文档扫描（调 WPS API）
│   ├── config/
│   │   ├── default-rules.js           # 内置默认规则
│   │   └── rule-schema.js             # 规则数据结构 + 校验
│   └── utils/
│       ├── unit-convert.js            # 单位转换 + WPS 常量
│       ├── wps-api.js                 # WPS JSAPI 封装
│       └── file-io.js                 # 配置文件读写
├── tests/
│   ├── unit-convert.test.js
│   ├── rule-schema.test.js
│   └── style-classifier.test.js
├── wps-addon/
│   ├── addon.xml                      # 加载项清单
│   └── ribbon.xml                     # Ribbon 按钮定义
├── index.html                         # Vite 入口 HTML
├── package.json
├── vite.config.js
└── vitest.config.js
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `vitest.config.js`
- Create: `index.html`
- Create: `wps-addon/addon.xml`
- Create: `wps-addon/ribbon.xml`

- [ ] **Step 1: Initialize Vue 3 + Vite project**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
npm create vite@latest . -- --template vue
npm install
npm install -D vitest
```

If prompted about non-empty directory, choose to proceed.

- [ ] **Step 2: Configure Vite**

Replace `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
});
```

Create `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'node',
  },
});
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Create WPS addon manifest**

Create `wps-addon/addon.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<addin>
  <name>文档排版助手</name>
  <type>console</type>
  <url>http://localhost:3000</url>
  <taskpane>
    <title>文档排版助手</title>
    <url>http://localhost:3000</url>
    <width>320</width>
  </taskpane>
</addin>
```

Create `wps-addon/ribbon.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<customUI xmlns="http://schemas.microsoft.com/office/2006/01/customui">
  <ribbon>
    <tabs>
      <tab id="formatTab" label="文档排版">
        <group id="formatGroup" label="排版工具">
          <button id="openFormatter"
                  label="排版助手"
                  size="large"
                  onAction="OnAction"/>
        </group>
      </tab>
    </tabs>
  </ribbon>
</customUI>
```

- [ ] **Step 4: Create directory structure**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
mkdir -p src/composables src/components src/engine src/config src/utils tests
```

- [ ] **Step 5: Verify dev server starts**

```bash
cd "D:/Claude Code/wordFormatterPlugin" && npm run dev
```

Expected: Vite dev server starts on `http://localhost:3000`. Stop with Ctrl+C.

- [ ] **Step 6: Clean up scaffold files**

Delete default scaffold files we don't need:

```bash
cd "D:/Claude Code/wordFormatterPlugin"
rm -f src/style.css src/assets/vue.svg public/vite.svg src/components/HelloWorld.vue
```

- [ ] **Step 7: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git init
git add package.json vite.config.js vitest.config.js index.html wps-addon/ src/main.js src/App.vue
git commit -m "feat: scaffold Vue 3 + Vite project with WPS addon config"
```

---

### Task 2: Unit Conversion Utilities

**Files:**
- Create: `src/utils/unit-convert.js`
- Create: `tests/unit-convert.test.js`

- [ ] **Step 1: Write tests for unit conversion**

Create `tests/unit-convert.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import {
  cmToPoints, pointsToCm, ptToBorderWidth,
  WdAlign, WdLineSpacing, WdOutlineLevel, WdPaperSize, WdBorder,
} from '../src/utils/unit-convert.js';

describe('cmToPoints', () => {
  it('converts 1 cm to points', () => {
    expect(cmToPoints(1)).toBeCloseTo(28.35, 1);
  });
  it('converts 0 cm to 0 points', () => {
    expect(cmToPoints(0)).toBe(0);
  });
  it('converts 3.7 cm to points', () => {
    expect(cmToPoints(3.7)).toBeCloseTo(104.895, 2);
  });
});

describe('pointsToCm', () => {
  it('converts points back to cm', () => {
    expect(pointsToCm(28.35)).toBeCloseTo(1, 1);
  });
});

describe('ptToBorderWidth', () => {
  it('converts 1.5pt to border width (eighths of a point)', () => {
    expect(ptToBorderWidth(1.5)).toBe(12);
  });
  it('converts 0.5pt to border width', () => {
    expect(ptToBorderWidth(0.5)).toBe(4);
  });
});

describe('WPS constants', () => {
  it('has correct alignment values', () => {
    expect(WdAlign.LEFT).toBe(0);
    expect(WdAlign.CENTER).toBe(1);
    expect(WdAlign.RIGHT).toBe(2);
    expect(WdAlign.JUSTIFY).toBe(3);
  });
  it('has correct line spacing values', () => {
    expect(WdLineSpacing.EXACTLY).toBe(4);
    expect(WdLineSpacing.MULTIPLE).toBe(5);
  });
  it('has correct outline level values', () => {
    expect(WdOutlineLevel.LEVEL1).toBe(1);
    expect(WdOutlineLevel.BODY_TEXT).toBe(10);
  });
  it('has correct paper size values', () => {
    expect(WdPaperSize.A4).toBe(7);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "D:/Claude Code/wordFormatterPlugin" && npm test -- tests/unit-convert.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement unit-convert.js**

Create `src/utils/unit-convert.js`:

```javascript
export const CM_TO_POINTS = 28.35;

export function cmToPoints(cm) {
  return cm * CM_TO_POINTS;
}

export function pointsToCm(points) {
  return points / CM_TO_POINTS;
}

export function ptToBorderWidth(pt) {
  return Math.round(pt * 8);
}

export const WdAlign = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
  JUSTIFY: 3,
};

export const WdLineSpacing = {
  SINGLE: 0,
  ONE_POINT_FIVE: 1,
  DOUBLE: 2,
  AT_LEAST: 3,
  EXACTLY: 4,
  MULTIPLE: 5,
};

export const WdOutlineLevel = {
  LEVEL1: 1,
  LEVEL2: 2,
  LEVEL3: 3,
  LEVEL4: 4,
  LEVEL5: 5,
  LEVEL6: 6,
  LEVEL7: 7,
  LEVEL8: 8,
  LEVEL9: 9,
  BODY_TEXT: 10,
};

export const WdBorder = {
  TOP: -1,
  LEFT: -2,
  BOTTOM: -3,
  RIGHT: -4,
};

export const WdPaperSize = {
  A4: 7,
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "D:/Claude Code/wordFormatterPlugin" && npm test -- tests/unit-convert.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/utils/unit-convert.js tests/unit-convert.test.js
git commit -m "feat: add unit conversion utilities with tests"
```

---

### Task 3: WPS API Wrapper

**Files:**
- Create: `src/utils/wps-api.js`

- [ ] **Step 1: Implement WPS API wrapper**

Create `src/utils/wps-api.js`:

```javascript
function getApp() {
  if (typeof Application !== 'undefined') return Application;
  if (typeof wps !== 'undefined' && wps.WpsApplication) return wps.WpsApplication();
  throw new Error('WPS Application 不可用，请确认在 WPS 内运行');
}

export function getActiveDocument() {
  const doc = getApp().ActiveDocument;
  if (!doc) throw new Error('请先打开一个文档');
  return doc;
}

export function getParagraphCount(doc) {
  return doc.Paragraphs.Count;
}

export function getParagraphInfo(doc, index) {
  const para = doc.Paragraphs.Item(index + 1);
  const range = para.Range;
  return {
    text: (range.Text || '').trim(),
    outlineLevel: range.OutlineLevel,
    hasImage: range.InlineShapes && range.InlineShapes.Count > 0,
    inTable: range.Tables && range.Tables.Count > 0,
  };
}

export function setPageSetup(doc, settings) {
  const ps = doc.PageSetup;
  if (settings.paperSize !== undefined) ps.PaperSize = settings.paperSize;
  if (settings.topMargin !== undefined) ps.TopMargin = settings.topMargin;
  if (settings.bottomMargin !== undefined) ps.BottomMargin = settings.bottomMargin;
  if (settings.leftMargin !== undefined) ps.LeftMargin = settings.leftMargin;
  if (settings.rightMargin !== undefined) ps.RightMargin = settings.rightMargin;
}

export function setParagraphFormat(doc, index, fmt) {
  const para = doc.Paragraphs.Item(index + 1);
  const range = para.Range;
  const pf = para.Format || range.ParagraphFormat;
  const font = range.Font;

  if (fmt.fontCN !== undefined) font.Name = fmt.fontCN;
  if (fmt.fontEN !== undefined) font.NameAscii = fmt.fontEN;
  if (fmt.fontSize !== undefined) font.Size = fmt.fontSize;
  if (fmt.bold !== undefined) font.Bold = fmt.bold ? -1 : 0;
  if (fmt.alignment !== undefined) pf.Alignment = fmt.alignment;
  if (fmt.spaceBefore !== undefined) pf.SpaceBefore = fmt.spaceBefore;
  if (fmt.spaceAfter !== undefined) pf.SpaceAfter = fmt.spaceAfter;
  if (fmt.lineSpacing !== undefined) pf.LineSpacing = fmt.lineSpacing;
  if (fmt.lineSpacingRule !== undefined) pf.LineSpacingRule = fmt.lineSpacingRule;
  if (fmt.firstLineIndent !== undefined) pf.FirstLineIndent = fmt.firstLineIndent;
  if (fmt.charIndent !== undefined) pf.CharacterUnitFirstLineIndent = fmt.charIndent;
}

export function getTableCount(doc) {
  return doc.Tables.Count;
}

export function setTableOuterBorder(doc, tableIndex, lineWidth) {
  const table = doc.Tables.Item(tableIndex + 1);
  for (const borderType of [-1, -2, -3, -4]) {
    table.Borders(borderType).LineWidth = lineWidth;
  }
}

export function setScreenUpdating(enabled) {
  try {
    getApp().ScreenUpdating = enabled;
  } catch {
    // 部分版本不支持
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/utils/wps-api.js
git commit -m "feat: add WPS JSAPI wrapper"
```

---

### Task 4: Rule Schema & Default Rules

**Files:**
- Create: `src/config/rule-schema.js`
- Create: `src/config/default-rules.js`
- Create: `tests/rule-schema.test.js`

- [ ] **Step 1: Write tests for rule validation**

Create `tests/rule-schema.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { validateRule } from '../src/config/rule-schema.js';

describe('validateRule', () => {
  it('rejects rule without name', () => {
    const result = validateRule({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('规则必须有名称(name)');
  });

  it('rejects invalid fontSize', () => {
    const result = validateRule({
      name: 'test',
      styles: { body: { fontSize: 100 } },
    });
    expect(result.valid).toBe(false);
  });

  it('accepts valid fontSize range', () => {
    const result = validateRule({
      name: 'test',
      styles: { body: { fontSize: 13 } },
    });
    expect(result.errors.filter(e => e.includes('fontSize'))).toHaveLength(0);
  });

  it('rejects invalid alignment', () => {
    const result = validateRule({
      name: 'test',
      styles: { body: { alignment: 'diagonal' } },
    });
    expect(result.valid).toBe(false);
  });

  it('accepts valid alignment', () => {
    const result = validateRule({
      name: 'test',
      styles: { body: { alignment: 'both' } },
    });
    expect(result.errors.filter(e => e.includes('alignment'))).toHaveLength(0);
  });

  it('accepts a complete valid rule', () => {
    const result = validateRule({
      name: 'test',
      pageSetup: { paperSize: 'A4', marginTop: 3.7 },
      styles: {
        heading1: { fontSize: 16, alignment: 'center', lineRule: 'exact', lineSpacing: 20 },
        body: { fontSize: 13, alignment: 'both', lineRule: 'exact', lineSpacing: 25 },
      },
    });
    expect(result.valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "D:/Claude Code/wordFormatterPlugin" && npm test -- tests/rule-schema.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement rule-schema.js**

Create `src/config/rule-schema.js`:

```javascript
const ALIGNMENT_OPTIONS = ['left', 'center', 'right', 'both'];
const LINE_RULE_OPTIONS = ['exact', 'auto', 'atLeast'];

export function validateRule(rule) {
  const errors = [];

  if (!rule.name || typeof rule.name !== 'string') {
    errors.push('规则必须有名称(name)');
  }

  if (rule.pageSetup) {
    for (const key of ['marginTop', 'marginBottom', 'marginLeft', 'marginRight']) {
      if (rule.pageSetup[key] !== undefined && (rule.pageSetup[key] < 0 || rule.pageSetup[key] > 50)) {
        errors.push(`pageSetup.${key} 必须在 0~50 cm 之间`);
      }
    }
  }

  if (rule.styles) {
    for (const [key, style] of Object.entries(rule.styles)) {
      if (style.fontSize !== undefined && (style.fontSize < 5 || style.fontSize > 72)) {
        errors.push(`styles.${key}.fontSize 必须在 5~72 pt 之间`);
      }
      if (style.alignment && !ALIGNMENT_OPTIONS.includes(style.alignment)) {
        errors.push(`styles.${key}.alignment 必须是: ${ALIGNMENT_OPTIONS.join(', ')}`);
      }
      if (style.lineRule && !LINE_RULE_OPTIONS.includes(style.lineRule)) {
        errors.push(`styles.${key}.lineRule 必须是: ${LINE_RULE_OPTIONS.join(', ')}`);
      }
      if (style.spaceBefore !== undefined && style.spaceBefore < 0) {
        errors.push(`styles.${key}.spaceBefore 不能为负数`);
      }
      if (style.spaceAfter !== undefined && style.spaceAfter < 0) {
        errors.push(`styles.${key}.spaceAfter 不能为负数`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export { ALIGNMENT_OPTIONS, LINE_RULE_OPTIONS };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "D:/Claude Code/wordFormatterPlugin" && npm test -- tests/rule-schema.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Implement default-rules.js**

Create `src/config/default-rules.js`:

```javascript
export const defaultRules = {
  name: '水利工程报告',
  version: '1.0',
  pageSetup: {
    paperSize: 'A4',
    marginTop: 3.7,
    marginBottom: 3.5,
    marginLeft: 2.8,
    marginRight: 2.6,
  },
  styles: {
    heading1: {
      label: '一级标题',
      detect: { outlineLevel: 0 },
      fontCN: '黑体',
      fontEN: 'Times New Roman',
      fontSize: 16,
      bold: false,
      alignment: 'center',
      spaceBefore: 24,
      spaceAfter: 24,
      lineSpacing: 20,
      lineRule: 'exact',
      firstLineIndent: 0,
    },
    heading2: {
      label: '二级标题',
      detect: { outlineLevel: 1 },
      fontCN: '楷体',
      fontEN: 'Times New Roman',
      fontSize: 14,
      bold: true,
      alignment: 'left',
      spaceBefore: 12,
      spaceAfter: 12,
      lineSpacing: 18,
      lineRule: 'exact',
      firstLineIndent: 0,
    },
    heading3: {
      label: '三级标题',
      detect: { outlineLevel: 2 },
      fontCN: '宋体',
      fontEN: 'Times New Roman',
      fontSize: 13,
      bold: false,
      alignment: 'left',
      spaceBefore: 12,
      spaceAfter: 12,
      lineSpacing: 16,
      lineRule: 'exact',
      firstLineIndent: 0,
    },
    heading4: {
      label: '四级标题',
      detect: { outlineLevel: 3 },
      fontCN: '宋体',
      fontEN: 'Times New Roman',
      fontSize: 12,
      bold: false,
      alignment: 'left',
      spaceBefore: 12,
      spaceAfter: 12,
      lineSpacing: 15,
      lineRule: 'exact',
      firstLineIndent: 0,
    },
    body: {
      label: '正文',
      detect: { outlineLevel: -1 },
      fontCN: '宋体',
      fontEN: 'Times New Roman',
      fontSize: 13,
      bold: false,
      alignment: 'both',
      spaceBefore: 0,
      spaceAfter: 0,
      lineSpacing: 25,
      lineRule: 'exact',
      charIndent: 2,
    },
    caption: {
      label: '图表标题',
      detect: { outlineLevel: -1, pattern: '^(图|表)\\s*\\d' },
      fontCN: '黑体',
      fontEN: 'Times New Roman',
      fontSize: 10.5,
      bold: false,
      alignment: 'center',
      spaceBefore: 0,
      spaceAfter: 0,
      lineSpacing: 15,
      lineRule: 'exact',
      firstLineIndent: 0,
    },
  },
  table: {
    outerBorderWidth: 1.5,
  },
  image: {
    alignment: 'center',
    lineSpacing: 1.5,
    lineRule: 'auto',
  },
};
```

- [ ] **Step 6: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/config/rule-schema.js src/config/default-rules.js tests/rule-schema.test.js
git commit -m "feat: add rule schema validation and default rules"
```

---

### Task 5: Style Classifier & Detector

**Files:**
- Create: `src/engine/style-classifier.js`
- Create: `src/engine/style-detector.js`
- Create: `tests/style-classifier.test.js`

- [ ] **Step 1: Write tests for style classifier**

Create `tests/style-classifier.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { classifyParagraph } from '../src/engine/style-classifier.js';

describe('classifyParagraph', () => {
  it('classifies image paragraphs', () => {
    expect(classifyParagraph({ text: '任意文本', outlineLevel: 10, hasImage: true, inTable: false }))
      .toEqual({ type: 'image' });
  });

  it('classifies caption by pattern', () => {
    expect(classifyParagraph({ text: '图 1-1 总平面布置图', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'caption' });
    expect(classifyParagraph({ text: '表2-3 工程量清单', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'caption' });
  });

  it('classifies heading by outline level', () => {
    expect(classifyParagraph({ text: '第一章 概述', outlineLevel: 1, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading1' });
    expect(classifyParagraph({ text: '1.1 项目背景', outlineLevel: 2, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading2' });
    expect(classifyParagraph({ text: '1.1.1 自然地理', outlineLevel: 3, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading3' });
    expect(classifyParagraph({ text: '1.1.1.1 地形地貌', outlineLevel: 4, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading4' });
  });

  it('classifies heading by text pattern when outlineLevel is body text', () => {
    expect(classifyParagraph({ text: '3 工程概况', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading1' });
    expect(classifyParagraph({ text: '3.2 设计标准', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading2' });
    expect(classifyParagraph({ text: '3.2.1 防洪标准', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading3' });
  });

  it('classifies table content', () => {
    expect(classifyParagraph({ text: '数据内容', outlineLevel: 10, hasImage: false, inTable: true }))
      .toEqual({ type: 'tableContent' });
  });

  it('classifies body text as default', () => {
    expect(classifyParagraph({ text: '这是一段普通正文内容。', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'body' });
  });

  it('does not classify long heading-like text as heading', () => {
    const longText = '1.1 这是一个非常非常长的标题文本超过了六十个字符的限制所以应该被降级为正文而不是标题来处理';
    const result = classifyParagraph({ text: longText, outlineLevel: 2, hasImage: false, inTable: false });
    expect(result.type).not.toBe('heading2');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "D:/Claude Code/wordFormatterPlugin" && npm test -- tests/style-classifier.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement style-classifier.js**

Create `src/engine/style-classifier.js`:

```javascript
const CAPTION_RE = /^(图|表)\s*\d/;
const HEADING_RE = /^(\d+(?:\.\d+)*)\s/;
const MAX_HEADING_LENGTH = 60;

export function classifyParagraph({ text, outlineLevel, hasImage, inTable }) {
  if (hasImage) return { type: 'image' };

  if (CAPTION_RE.test(text)) return { type: 'caption' };

  // Outline level 1-4 → heading1-4
  if (outlineLevel >= 1 && outlineLevel <= 4) {
    if (text.length <= MAX_HEADING_LENGTH) {
      return { type: `heading${outlineLevel}` };
    }
    // 长文本降级为正文
    return { type: 'body' };
  }

  // 文本编号模式识别无大纲级别的标题
  const match = text.match(HEADING_RE);
  if (match) {
    if (text.length <= MAX_HEADING_LENGTH) {
      const segments = match[1].split('.').length;
      if (segments <= 4) return { type: `heading${segments}` };
    }
  }

  if (inTable) return { type: 'tableContent' };

  return { type: 'body' };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "D:/Claude Code/wordFormatterPlugin" && npm test -- tests/style-classifier.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Implement style-detector.js (calls WPS API)**

Create `src/engine/style-detector.js`:

```javascript
import { classifyParagraph } from './style-classifier.js';
import { getParagraphCount, getParagraphInfo } from '../utils/wps-api.js';

export function scanDocument(doc) {
  const count = getParagraphCount(doc);
  const results = [];

  for (let i = 0; i < count; i++) {
    const info = getParagraphInfo(doc, i);
    const classification = classifyParagraph(info);
    results.push({ index: i, ...classification, text: info.text });
  }

  return results;
}
```

- [ ] **Step 6: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/engine/style-classifier.js src/engine/style-detector.js tests/style-classifier.test.js
git commit -m "feat: add paragraph classification and document scanning"
```

---

### Task 6: Page Setup Module

**Files:**
- Create: `src/engine/page-setup.js`

- [ ] **Step 1: Implement page-setup.js**

Create `src/engine/page-setup.js`:

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/engine/page-setup.js
git commit -m "feat: add page setup module"
```

---

### Task 7: Paragraph Formatting Module

**Files:**
- Create: `src/engine/paragraph.js`

- [ ] **Step 1: Implement paragraph.js**

Create `src/engine/paragraph.js`:

```javascript
import { WdAlign, WdLineSpacing } from '../utils/unit-convert.js';
import { setParagraphFormat } from '../utils/wps-api.js';

const ALIGN_MAP = {
  left: WdAlign.LEFT,
  center: WdAlign.CENTER,
  right: WdAlign.RIGHT,
  both: WdAlign.JUSTIFY,
};

const LINE_RULE_MAP = {
  exact: WdLineSpacing.EXACTLY,
  auto: WdLineSpacing.MULTIPLE,
  atLeast: WdLineSpacing.AT_LEAST,
};

function buildFormatArgs(styleRule, isImage) {
  const fmt = {};

  if (isImage) {
    // 图片段落：居中、多倍行距、无缩进
    fmt.alignment = WdAlign.CENTER;
    fmt.lineSpacingRule = WdLineSpacing.MULTIPLE;
    fmt.lineSpacing = (styleRule.lineSpacing || 1.5) * 12;
    fmt.firstLineIndent = 0;
    fmt.charIndent = 0;
    return fmt;
  }

  if (styleRule.fontCN !== undefined) fmt.fontCN = styleRule.fontCN;
  if (styleRule.fontEN !== undefined) fmt.fontEN = styleRule.fontEN;
  if (styleRule.fontSize !== undefined) fmt.fontSize = styleRule.fontSize;
  if (styleRule.bold !== undefined) fmt.bold = styleRule.bold;

  if (styleRule.alignment !== undefined) {
    fmt.alignment = ALIGN_MAP[styleRule.alignment] ?? WdAlign.JUSTIFY;
  }

  if (styleRule.spaceBefore !== undefined) fmt.spaceBefore = styleRule.spaceBefore;
  if (styleRule.spaceAfter !== undefined) fmt.spaceAfter = styleRule.spaceAfter;

  if (styleRule.lineSpacing !== undefined && styleRule.lineRule) {
    fmt.lineSpacingRule = LINE_RULE_MAP[styleRule.lineRule] ?? WdLineSpacing.EXACTLY;
    if (styleRule.lineRule === 'auto') {
      fmt.lineSpacing = styleRule.lineSpacing * 12;
    } else {
      fmt.lineSpacing = styleRule.lineSpacing;
    }
  }

  // 缩进处理
  if (styleRule.charIndent !== undefined) {
    fmt.charIndent = styleRule.charIndent;
    fmt.firstLineIndent = 0;
  } else if (styleRule.firstLineIndent !== undefined) {
    fmt.firstLineIndent = styleRule.firstLineIndent;
    fmt.charIndent = 0;
  }

  return fmt;
}

export function applyParagraphStyle(doc, index, styleRule, isImage = false) {
  const fmt = buildFormatArgs(styleRule, isImage);
  setParagraphFormat(doc, index, fmt);
}
```

- [ ] **Step 2: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/engine/paragraph.js
git commit -m "feat: add paragraph formatting module"
```

---

### Task 8: Table Module

**Files:**
- Create: `src/engine/table.js`

- [ ] **Step 1: Implement table.js**

Create `src/engine/table.js`:

```javascript
import { ptToBorderWidth } from '../utils/unit-convert.js';
import { getTableCount, setTableOuterBorder } from '../utils/wps-api.js';

export function applyTableBorders(doc, tableConfig) {
  if (!tableConfig || tableConfig.outerBorderWidth === undefined) return;

  const lineWidth = ptToBorderWidth(tableConfig.outerBorderWidth);
  const tableCount = getTableCount(doc);

  for (let i = 0; i < tableCount; i++) {
    setTableOuterBorder(doc, i, lineWidth);
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/engine/table.js
git commit -m "feat: add table formatting module"
```

---

### Task 9: Formatter Orchestrator & File I/O

**Files:**
- Create: `src/engine/formatter.js`
- Create: `src/utils/file-io.js`

- [ ] **Step 1: Implement file-io.js**

Create `src/utils/file-io.js`:

```javascript
import { validateRule } from '../config/rule-schema.js';

export function exportRuleToFile(rule) {
  const json = JSON.stringify(rule, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${rule.name || '排版规则'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importRuleFromFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return reject(new Error('未选择文件'));
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const rule = JSON.parse(ev.target.result);
          const validation = validateRule(rule);
          if (!validation.valid) {
            reject(new Error(`规则格式错误: ${validation.errors.join('; ')}`));
            return;
          }
          resolve(rule);
        } catch (err) {
          reject(new Error('JSON 解析失败'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
```

- [ ] **Step 2: Implement formatter.js**

Create `src/engine/formatter.js`:

```javascript
import { getActiveDocument, setScreenUpdating } from '../utils/wps-api.js';
import { scanDocument } from './style-detector.js';
import { applyPageSetup } from './page-setup.js';
import { applyParagraphStyle } from './paragraph.js';
import { applyTableBorders } from './table.js';

export async function formatDocument(rule, onProgress) {
  const doc = getActiveDocument();

  setScreenUpdating(false);
  try {
    // 1. 页面设置
    onProgress?.('正在设置页面...');
    applyPageSetup(doc, rule.pageSetup);

    // 2. 扫描文档
    onProgress?.('正在扫描文档结构...');
    const paragraphs = scanDocument(doc);

    // 3. 逐段排版
    const total = paragraphs.length;
    const stats = { heading: 0, body: 0, image: 0, caption: 0, skipped: 0 };
    const styleTypes = ['heading1', 'heading2', 'heading3', 'heading4', 'body', 'caption'];

    for (let i = 0; i < total; i++) {
      const para = paragraphs[i];
      const styleName = para.type;

      if (styleName === 'tableContent') {
        stats.skipped++;
        continue;
      }

      if (styleName === 'image') {
        applyParagraphStyle(doc, para.index, rule.image || {}, true);
        stats.image++;
      } else if (styleTypes.includes(styleName) && rule.styles[styleName]) {
        applyParagraphStyle(doc, para.index, rule.styles[styleName]);
        if (styleName.startsWith('heading')) stats.heading++;
        else if (styleName === 'body') stats.body++;
        else if (styleName === 'caption') stats.caption++;
      } else {
        stats.skipped++;
      }

      if (i % 50 === 0) {
        onProgress?.(`正在排版... ${Math.round((i / total) * 100)}%`);
      }
    }

    // 4. 表格边框
    onProgress?.('正在处理表格...');
    applyTableBorders(doc, rule.table);

    onProgress?.('排版完成');
    return { total, stats };
  } finally {
    setScreenUpdating(true);
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/engine/formatter.js src/utils/file-io.js
git commit -m "feat: add formatter orchestrator and file I/O"
```

---

### Task 10: Formatter State Composable

**Files:**
- Create: `src/composables/useFormatter.js`

- [ ] **Step 1: Implement useFormatter.js**

Create `src/composables/useFormatter.js`:

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/composables/useFormatter.js
git commit -m "feat: add formatter state composable"
```

---

### Task 11: TaskPane & FormatProgress UI

**Files:**
- Create: `src/components/TaskPane.vue`
- Create: `src/components/FormatProgress.vue`

- [ ] **Step 1: Implement FormatProgress.vue**

Create `src/components/FormatProgress.vue`:

```vue
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
        图表标题 {{ state.result.stats.caption }} 段
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
  const match = state.progress.match(/(\d+)%/);
  return match ? match[1] + '%' : '0%';
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
```

- [ ] **Step 2: Implement TaskPane.vue**

Create `src/components/TaskPane.vue`:

```vue
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
          <label>外边框 <input type="number" v-model.number="activeRule.table.outerBorderWidth" @change="save" step="0.5" min="0" :disabled="state.formatting" /> pt</label>
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
.table-fields label {
  display: block;
  margin: 4px 0;
  font-size: 12px;
  color: #4b5563;
}
.page-fields input,
.page-fields select,
.table-fields input {
  width: 60px;
  padding: 3px 6px;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  margin: 0 4px;
}
</style>
```

- [ ] **Step 3: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/components/TaskPane.vue src/components/FormatProgress.vue
git commit -m "feat: add TaskPane and FormatProgress components"
```

---

### Task 12: RuleEditor & ConfigManager UI

**Files:**
- Create: `src/components/RuleEditor.vue`
- Create: `src/components/ConfigManager.vue`

- [ ] **Step 1: Implement RuleEditor.vue**

Create `src/components/RuleEditor.vue`:

```vue
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
      <input type="number" v-model.number="style.fontSize" @change="save" min="5" max="72" step="0.5" :disabled="disabled" /> pt
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
      <input type="number" v-model.number="style.lineSpacing" @change="save" min="1" step="1" :disabled="disabled" />
      <select v-model="style.lineRule" @change="save" :disabled="disabled">
        <option value="exact">固定值</option>
        <option value="auto">多倍行距</option>
        <option value="atLeast">最小值</option>
      </select>
    </label>
    <label v-if="styleKey === 'body'">首行缩进
      <input type="number" v-model.number="style.charIndent" @change="save" min="0" step="1" :disabled="disabled" /> 字符
    </label>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
import { useFormatter } from '../composables/useFormatter.js';

const props = defineProps({
  styleKey: { type: String, required: true },
});

const { state, getActiveRule, updateRule } = useFormatter();

const fonts = ['宋体', '黑体', '楷体', '仿宋', '微软雅黑', 'Times New Roman', 'Arial', 'Calibri'];

const disabled = $computed(() => state.formatting);

const style = reactive({ ...getActiveRule().styles[props.styleKey] });

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
```

Note: `$computed` is a Vue 3.3+ compiler macro. If using an older version, replace with `import { computed } from 'vue'` and `const disabled = computed(...)`.

- [ ] **Step 2: Implement ConfigManager.vue**

Create `src/components/ConfigManager.vue`:

```vue
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
```

- [ ] **Step 3: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/components/RuleEditor.vue src/components/ConfigManager.vue
git commit -m "feat: add RuleEditor and ConfigManager components"
```

---

### Task 13: App Entry & Root Component

**Files:**
- Modify: `src/App.vue`
- Modify: `src/main.js`

- [ ] **Step 1: Write App.vue**

Replace `src/App.vue`:

```vue
<template>
  <TaskPane />
</template>

<script setup>
import TaskPane from './components/TaskPane.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, "Microsoft YaHei", sans-serif;
  font-size: 13px;
  background: #ffffff;
}
</style>
```

- [ ] **Step 2: Write main.js**

Replace `src/main.js`:

```javascript
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

- [ ] **Step 3: Verify build succeeds**

```bash
cd "D:/Claude Code/wordFormatterPlugin" && npm run build
```

Expected: Build completes without errors, output in `dist/`.

- [ ] **Step 4: Run all tests**

```bash
cd "D:/Claude Code/wordFormatterPlugin" && npm test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add src/App.vue src/main.js
git commit -m "feat: wire up App entry and root component"
```

---

### Task 14: Build & Package for WPS

**Files:**
- Modify: `vite.config.js` (build config for WPS addon)

- [ ] **Step 1: Update vite.config.js for production build**

Replace `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    base: './',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
```

- [ ] **Step 2: Create production addon.xml that references local files**

Create `scripts/build-addon.js`:

```javascript
import { copyFileSync, mkdirSync, cpSync, writeFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const addon = join(root, 'wps-addon');
const output = join(root, 'release', 'word-formatter');

if (!existsSync(output)) mkdirSync(output, { recursive: true });

// Copy dist files
cpSync(dist, join(output, 'web'), { recursive: true });

// Create production addon.xml
const addonXml = `<?xml version="1.0" encoding="UTF-8"?>
<addin>
  <name>文档排版助手</name>
  <type>console</type>
  <url>./web/index.html</url>
  <taskpane>
    <title>文档排版助手</title>
    <url>./web/index.html</url>
    <width>320</width>
  </taskpane>
</addin>`;

writeFileSync(join(output, 'addon.xml'), addonXml);

// Copy ribbon.xml
copyFileSync(join(addon, 'ribbon.xml'), join(output, 'ribbon.xml'));

console.log(`Addon packaged to: ${output}`);
```

- [ ] **Step 3: Add build scripts to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "build:addon": "vite build && node scripts/build-addon.js"
  }
}
```

- [ ] **Step 4: Test production build**

```bash
cd "D:/Claude Code/wordFormatterPlugin" && npm run build:addon
```

Expected: `release/word-formatter/` directory created with `web/`, `addon.xml`, `ribbon.xml`.

- [ ] **Step 5: Commit**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
mkdir -p scripts
git add vite.config.js scripts/build-addon.js package.json
git commit -m "feat: add production build and WPS addon packaging"
```

---

### Task 15: Manual Verification in WPS

- [ ] **Step 1: Start dev server**

```bash
cd "D:/Claude Code/wordFormatterPlugin" && npm run dev
```

- [ ] **Step 2: Load addon in WPS**

在 WPS 文字中，打开"开发工具" → "加载项管理"，添加本地加载项，URL 设为 `http://localhost:3000`。右侧应出现"文档排版助手"任务窗格。

- [ ] **Step 3: Test with a sample document**

打开一个包含标题、正文、表格、图片的 .docx 文档，点击"一键排版"，验证：
- 各级标题字体/字号/行距正确
- 正文首行缩进 2 字符
- 图片段落居中且行距为 1.5 倍
- 表格外边框加粗
- 页面边距正确

- [ ] **Step 4: Test rule editing**

在面板中展开各分区，修改字体/字号/间距，重新排版，确认修改生效。

- [ ] **Step 5: Test config import/export**

点击"导出规则"确认下载 JSON 文件，点击"导入规则"选择文件确认加载成功。

- [ ] **Step 6: Commit final state**

```bash
cd "D:/Claude Code/wordFormatterPlugin"
git add -A
git commit -m "feat: complete WPS document formatter plugin v1.0"
```
