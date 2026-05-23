# WPS 文档排版插件设计文档

## 概述

开发一个嵌入 WPS Office 的文档排版加载项，基于 WPS JSAPI，提供可视化任务窗格，支持可配置的排版规则，一键完成文档格式化。

- 目标用户：个人/小团队
- 平台：仅 WPS Office
- 技术栈：WPS JSAPI + Vue 3 + Vite

## 整体架构

**WPS 加载项类型**：任务窗格（TaskPane），在 WPS 文档右侧常驻面板。

**技术栈**：
- WPS 加载项 SDK：`wps-jsapi-sdk`
- 前端框架：Vue 3 + Vite
- 排版引擎：JavaScript，通过 WPS JSAPI 操作文档对象
- 配置存储：`localStorage` + JSON 文件导入/导出

**项目结构**：
```
wordFormatterPlugin/
├── src/
│   ├── main.js                  # 入口
│   ├── App.vue                  # 根组件
│   ├── components/
│   │   ├── TaskPane.vue         # 主面板（规则选择 + 一键排版）
│   │   ├── RuleEditor.vue       # 排版规则编辑器
│   │   ├── FormatProgress.vue   # 排版进度显示
│   │   └── ConfigManager.vue    # 配置导入/导出
│   ├── engine/
│   │   ├── formatter.js         # 排版主流程
│   │   ├── page-setup.js        # 页面设置模块
│   │   ├── paragraph.js         # 段落与字体模块
│   │   ├── table.js             # 表格排版模块
│   │   ├── image.js             # 图片处理模块
│   │   └── style-detector.js    # 文档结构扫描（样式识别）
│   ├── config/
│   │   ├── default-rules.js     # 内置默认规则（水利标准）
│   │   └── rule-schema.js       # 规则数据结构定义
│   └── utils/
│       ├── wps-api.js           # WPS JSAPI 封装
│       └── file-io.js           # 配置文件读写
├── wps-addon/
│   ├── ribbon.xml               # WPS Ribbon 按钮定义
│   └── addon.xml                # 加载项清单
├── package.json
├── vite.config.js
└── README.md
```

**核心流程**：
1. 用户点击 Ribbon 按钮 → WPS 打开右侧任务窗格
2. 用户选择排版规则模板（或自定义编辑）
3. 点击"一键排版" → 引擎扫描文档结构 → 逐段应用格式
4. 完成后显示进度摘要

## 排版规则配置系统

### 规则数据结构

```json
{
  "name": "水利工程报告",
  "version": "1.0",
  "pageSetup": {
    "paperSize": "A4",
    "marginTop": 3.7,
    "marginBottom": 3.5,
    "marginLeft": 2.8,
    "marginRight": 2.6
  },
  "styles": {
    "heading1": {
      "label": "一级标题",
      "detect": { "outlineLevel": 0 },
      "fontCN": "黑体",
      "fontEN": "Times New Roman",
      "fontSize": 16,
      "bold": false,
      "alignment": "center",
      "spaceBefore": 24,
      "spaceAfter": 24,
      "lineSpacing": 20,
      "lineRule": "exact",
      "firstLineIndent": 0
    },
    "heading2": {
      "label": "二级标题",
      "detect": { "outlineLevel": 1 },
      "fontCN": "楷体",
      "fontEN": "Times New Roman",
      "fontSize": 14,
      "bold": true,
      "alignment": "left",
      "spaceBefore": 12,
      "spaceAfter": 12,
      "lineSpacing": 18,
      "lineRule": "exact",
      "firstLineIndent": 0
    },
    "heading3": {
      "label": "三级标题",
      "detect": { "outlineLevel": 2 },
      "fontCN": "宋体",
      "fontEN": "Times New Roman",
      "fontSize": 13,
      "bold": false,
      "alignment": "left",
      "spaceBefore": 12,
      "spaceAfter": 12,
      "lineSpacing": 16,
      "lineRule": "exact",
      "firstLineIndent": 0
    },
    "heading4": {
      "label": "四级标题",
      "detect": { "outlineLevel": 3 },
      "fontCN": "宋体",
      "fontEN": "Times New Roman",
      "fontSize": 12,
      "bold": false,
      "alignment": "left",
      "spaceBefore": 12,
      "spaceAfter": 12,
      "lineSpacing": 15,
      "lineRule": "exact",
      "firstLineIndent": 0
    },
    "body": {
      "label": "正文",
      "detect": { "outlineLevel": -1 },
      "fontCN": "宋体",
      "fontEN": "Times New Roman",
      "fontSize": 13,
      "bold": false,
      "alignment": "both",
      "spaceBefore": 0,
      "spaceAfter": 0,
      "lineSpacing": 25,
      "lineRule": "exact",
      "firstLineIndentChars": 2
    },
    "caption": {
      "label": "图表标题",
      "detect": { "outlineLevel": -1, "pattern": "^(图|表)\\s*\\d" },
      "fontCN": "黑体",
      "fontEN": "Times New Roman",
      "fontSize": 10.5,
      "bold": false,
      "alignment": "center",
      "spaceBefore": 0,
      "spaceAfter": 0,
      "lineSpacing": 15,
      "lineRule": "exact",
      "firstLineIndent": 0
    }
  },
  "table": {
    "outerBorderWidth": 1.5
  },
  "image": {
    "alignment": "center",
    "lineSpacing": 1.5,
    "lineRule": "auto"
  },
  "skipRules": {
    "coverPattern": "",
    "tocPattern": ""
  }
}
```

### 配置面板（RuleEditor.vue）

- 分区编辑：页面设置 / 各级标题 / 正文 / 表格 / 图片
- 每项提供下拉框（字体、对齐方式）和数字输入框（字号、间距、缩进）
- 鼠标悬停显示排版效果文字说明
- 支持多套规则模板：新建、复制、重命名、删除
- 所有修改实时保存到 localStorage

### 配置文件导入/导出（ConfigManager.vue）

- 导出：将当前规则序列化为 JSON 文件，触发下载
- 导入：用户选择本地 JSON 文件，校验格式后加载为规则模板
- 内置一套默认规则（水利标准），不可删除但可恢复默认值

### 文档结构识别（style-detector.js）

排版前扫描文档：
- 遍历段落，读取 `OutlineLevel` 判断标题级别
- 识别封面区域（前 N 段无大纲级别，含特定关键词）
- 识别目录区域（含 TOC 域代码的段落）
- 检测图片段落（含 InlineShape 或 Shape）
- 通过文本模式（`/^\d+\.\d+/`）辅助识别无大纲级别的标题
- 返回分类数组：`[{ index, type: 'heading1'|'body'|'image'|..., meta }]`

## 排版引擎

### 主流程（formatter.js）

```
1. scanDocument()      → 扫描文档，返回段落分类结果
2. applyPageSetup()    → 设置页面参数（纸张、边距）
3. applyStyles()       → 逐段应用字体/段落格式
4. applyTableBorders() → 处理表格外边框
5. reportResult()      → 输出排版摘要
```

### 各模块

**page-setup.js（页面设置）**
- 设置 PaperSize、TopMargin、BottomMargin 等
- 单位转换：用户配置用 cm/pt，WPS API 用磅（1cm = 28.35pt）

**paragraph.js（段落与字体）**
- 核心方法：`applyParagraphRule(paragraph, rule)`
- 设置 Font.Name（中文）、Font.NameAscii（西文）、Font.Size
- 设置 ParagraphFormat.Alignment、LineSpacing、LineRule、FirstLineIndent
- 图片段落特殊处理：行距用 LineRule=auto + LineSpacing=1.5，居中
- 标题缩进清除：同时清除 FirstLineIndent 的绝对值和字符值

**table.js（表格排版）**
- 遍历 ActiveDocument.Tables
- 设置外边框 BorderWidth
- 内边框保持默认或按规则设置

**image.js（图片处理）**
- 已在 paragraph.js 中通过类型判断处理
- 额外功能：图片居中对齐、调整图片段落行距

### 性能目标

- 优化：批量操作，减少中间状态刷新，必要时用 `Application.ScreenUpdating = false`
- 100 页文档（约 500 段）目标耗时 < 30 秒

## UI 交互设计

### 任务窗格布局（宽 320px，右侧常驻）

```
┌─────────────────────────────┐
│  文档排版助手                 │  ← 标题栏
├─────────────────────────────┤
│  当前规则：[水利工程报告 ▾]    │  ← 规则模板下拉选择
│                             │
│  ┌───────────────────────┐  │
│  │    一键排版             │  │  ← 主操作按钮
│  └───────────────────────┘  │
│                             │
├─────────────────────────────┤
│  ▸ 页面设置                  │  ← 可折叠分区
│  ▸ 一级标题                  │
│  ▸ 二级标题                  │
│  ▸ 三级标题                  │
│  ▸ 四级标题                  │
│  ▸ 正文                     │
│  ▸ 图表标题                  │
│  ▸ 表格                     │
│  ▸ 图片                     │
├─────────────────────────────┤
│  导入规则    导出规则          │  ← 配置文件操作
│  ＋ 新建规则模板              │
├─────────────────────────────┤
│  就绪 │ 准备排版              │  ← 底部状态栏
└─────────────────────────────┘
```

### 交互流程

1. 选择规则 → 下拉框切换已保存的规则模板
2. 展开编辑 → 点击分区箭头展开配置项（字体、字号、间距等输入框）
3. 一键排版 → 点击主按钮，按钮变为进度条，底部显示"正在排版..."
4. 完成提示 → 显示摘要：`共处理 523 段，其中标题 45 段，正文 460 段，图片 18 段`

### RuleEditor 展开状态示例（正文分区）

```
▾ 正文
  中文字体：[宋体          ▾]
  西文字体：[Times New Roman ▾]
  字号：    [13     ] pt
  对齐：    [两端对齐 ▾]
  行距：    [25     ] pt  规则：[固定值 ▾]
  首行缩进：[2      ] 字符
```

### 状态管理

- 排版进行中：禁用所有编辑操作，按钮显示进度
- 排版失败：底部状态栏显示错误信息，不弹窗
- 无文档打开：显示提示"请先打开一个文档"

## 开发调试与打包部署

### 开发调试

1. Vite 启动 dev server（如 `localhost:3000`）
2. 在 WPS 加载项管理中添加本地 URL 作为调试加载项
3. 修改前端代码后自动热更新
4. WPS 内置开发者工具（类似 Chrome DevTools），窗格内右键打开

### 打包发布

- `vite build` 输出静态文件到 `dist/`
- 将 `dist/` + `wps-addon/` 打包为 `.wpsx` 加载项包
- 分发：`.wpsx` 文件发给用户，双击安装或拖入 WPS 加载项管理器
- 个人/小团队无需上架应用商店

### 错误处理

| 场景 | 处理方式 |
|------|---------|
| 无文档打开 | 面板显示提示，禁用排版按钮 |
| 文档受保护/只读 | 底部状态栏提示"文档不可编辑" |
| 排版中途异常 | 捕获错误，已完成格式不回滚，状态栏显示失败位置 |
| 规则 JSON 格式错误 | 导入时校验，提示具体字段错误 |
| WPS API 调用超时 | 单段操作超时 5 秒自动跳过，记录跳过段号 |

### 测试策略

- 手动测试：准备不同类型 .docx 样本（有/无封面、有/无目录、含表格、含图片）
- 验证要点：字体正确、行距符合预期、图片不被裁剪、表格外边框加粗
