# 文档排版助手

WPS 文字加载项，一键完成 Word 文档自动排版。适用于水利工程规划设计报告等中文技术文档。

## 功能

- **一键排版** — 页面设置、标题/正文/图表标题格式、图片段落、表格设置，全部自动处理
- **跳过页面** — 可设置跳过前 N 页（封面、目录等不参与排版）
- **规则可配置** — 字体、字号（中文字号）、对齐、行距、缩进、大纲级别均可自定义
- **规则导入导出** — JSON 文件保存和加载排版规则
- **多规则模板** — 支持新建、删除、切换多套排版规则
- **实时进度** — 扫描、排版、表格处理分阶段显示进度条

## 技术栈

- **WPS JSAPI** — 通过 WPS JavaScript API 操作文档
- **Vue 3** — Composition API + `<script setup>`
- **Vite** — 开发与构建
- **wpsjs CLI** — 加载项调试与打包

## 项目结构

```
├── public/
│   └── ribbon.xml          # WPS 功能区定义
├── src/
│   ├── ribbon.js           # 加载项生命周期（OnAddinLoad/OnAction）
│   ├── main.js             # Vue 入口
│   ├── App.vue             # 根组件，注册 ribbon
│   ├── components/
│   │   ├── TaskPane.vue    # 主面板
│   │   ├── RuleEditor.vue  # 样式编辑器
│   │   ├── ConfigManager.vue # 规则导入导出
│   │   └── FormatProgress.vue # 进度显示
│   ├── composables/
│   │   └── useFormatter.js # 响应式状态管理
│   ├── config/
│   │   ├── default-rules.js # 默认排版规则（水利工程报告）
│   │   └── rule-schema.js  # 规则校验
│   ├── engine/
│   │   ├── style-classifier.js # 段落分类（标题/正文/图表标题/图片/表格）
│   │   ├── style-detector.js   # 文档扫描（含表格范围检测、跳页）
│   │   ├── formatter.js        # 排版主流程
│   │   ├── page-setup.js       # 页面设置
│   │   ├── paragraph.js        # 段落格式化
│   │   └── table.js            # 表格设置（边框 + 自适应窗口）
│   └── utils/
│       ├── wps-api.js      # WPS JSAPI 封装
│       ├── unit-convert.js # 单位转换、字号对照、常量
│       └── file-io.js      # 配置文件读写
├── manifest.xml            # WPS 加载项元数据
├── scripts/
│   └── build-addon.js      # 生产构建脚本
└── tests/                  # 单元测试（24 个）
```

## 排版规则

默认规则适用于水利工程规划设计报告：

| 类型 | 中文字体 | 字号 | 对齐 | 行距 |
|------|---------|------|------|------|
| 一级标题 | 黑体 | 三号 | 居中 | 1.5 倍 |
| 二级标题 | 楷体 | 四号 | 左对齐 | 1.5 倍 |
| 三级标题 | 宋体 | 13pt | 左对齐 | 1.5 倍 |
| 四级标题 | 宋体 | 小四 | 左对齐 | 1.5 倍 |
| 正文 | 宋体 | 13pt | 两端对齐 | 25pt 固定值 |
| 图片标题 | 黑体 | 五号 | 居中 | 15pt 固定值 | 大纲 6 级 |
| 表格标题 | 黑体 | 五号 | 居中 | 15pt 固定值 | 大纲 8 级 |
| 图片段落 | — | — | 居中 | 1.5 倍 |

**页面设置**：A4 纸，上 3.7cm，下 3.5cm，左 2.8cm，右 2.6cm。

**表格设置**：外边框线宽默认 1pt，默认启用"根据窗口调整表格"。

**跳过页面**：默认不跳过，可设置跳过前 N 页（封面、目录）。

## 段落识别

通过多种方式综合识别段落类型：

1. **WPS 大纲级别** — 内置标题样式的大纲级别（1-4 级）
2. **中文标题模式** — "第X章/篇/部" → 一级标题，"第X节" → 二级标题
3. **数字编号模式** — "1" → 一级，"1.1" → 二级，"1.1.1" → 三级，"1.1.1.1" → 四级
4. **图表标题** — 以"图"或"表"开头的段落，也通过图片/表格位置反向查找
5. **图片段落** — 包含内嵌图片的段落
6. **表格内容** — 通过预扫描表格范围精确判断，表格内段落不应用正文样式

## 开发

### 环境要求

- Node.js 18+
- WPS Office 2019+（Windows）
- wpsjs CLI：`npm install -g wpsjs`

### 安装依赖

```bash
npm install
```

### 单元测试

```bash
npm test
```

### 调试

```bash
wpsjs debug
```

启动 Vite 开发服务器并自动打开 WPS，加载项出现在功能区"文档排版"标签页。按 **Alt+F12** 打开开发者工具。

### 生产构建

```bash
npm run build:addon
```

输出到 `release/word-formatter/`，可直接部署。

### 正式安装

```bash
wpsjs publish
```

## License

MIT
