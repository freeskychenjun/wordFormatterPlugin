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
- **Vite** — 开发与构建（默认端口 5173，Windows 上 3000 可能被 Hyper-V 占用）
- **wpsjs CLI** — 加载项调试与打包

## 项目结构

```
├── public/
│   ├── ribbon.xml          # WPS 功能区定义（含 loadImage 图标加载）
│   ├── icon.png            # 功能区按钮图标（64x64 PNG）
│   └── images/             # SVG 图片资源
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
│   ├── build-addon.js      # 生产构建脚本
│   ├── package-offline.js  # 离线部署打包脚本
│   └── generate-icon.js    # 按钮图标生成脚本
└── tests/                  # 单元测试（30 个）
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

1. **WPS 样式名**（优先级最高）— 匹配中英文标题样式名（"标题 1" / "Heading 1"）识别标题级别
2. **WPS 大纲级别** — 备用方案，读取段落的大纲级别属性
3. **中文标题模式** — "第X章/篇/部" → 一级标题，"第X节" → 二级标题
4. **数字编号模式** — "1" → 一级，"1.1" → 二级，"1.1.1" → 三级，"1.1.1.1" → 四级
5. **图表标题** — 以"图"或"表"紧跟数字开头的段落，也通过图片/表格位置反向查找
6. **图片段落** — 包含内嵌图片的段落
7. **表格内容** — 通过预扫描表格范围精确判断，表格内段落不应用正文样式

排版时自动将识别为标题的段落大纲级别设为对应级别（heading1→1级，heading2→2级，以此类推）。

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

### Ribbon 图标

WPS JSAPI 的 `getImage` 回调不支持可靠的自定义图标，使用 `loadImage` 回调 + 静态 `image` 属性是有效方案：

- `public/ribbon.xml`：`<customUI>` 添加 `loadImage="ribbon.LoadImage"`，按钮添加 `image="assistant"`
- `src/ribbon.js`：实现 `LoadImage(imageName)` 和 `GetImage(control)`，返回图片相对路径（如 `'icon.png'`）
- 图标必须是 **PNG 格式**（64x64 像素），SVG 不被原生 ribbon 支持
- 使用相对路径即可，不需要完整 URL

如果不显示图标，清除 WPS 缓存：`%AppData%/Roaming/Kingsoft/wps/addons/data/win-i386/cef_high/` 下的 JSAPI 和 CEF 缓存、`office6/cache/`。

### 生产构建

```bash
npm run build
```

输出到 `dist/` 目录。

## 团队部署

### 方式一：离线独立部署（推荐）

每位同事的电脑独立运行插件，**不依赖任何人的电脑**，无需安装 Node.js 或其他依赖。

#### 打包分发

在开发者电脑上执行一次打包：

```bash
npm run package:offline
```

生成 `release/word-formatter-offline/` 目录，包含以下文件：

```
word-formatter-offline/
├── install.bat      # 安装脚本
├── uninstall.bat    # 卸载脚本
├── server.ps1       # 本地 HTTP 服务（PowerShell，系统自带）
└── web/             # 插件网页文件
    ├── index.html
    └── assets/
```

将整个目录压缩为 zip 发给同事，或将文件夹放到共享盘。

#### 同事安装

1. 解压到任意位置
2. 双击 `install.bat`
3. 脚本自动完成：复制文件到 `%LOCALAPPDATA%\WordFormatter`、注册 WPS 加载项、启动本地服务、配置开机自启
4. 重启 WPS，功能区出现"文档排版"标签页

安装后插件在 `http://localhost:3000/` 运行，**完全本地化，无需联网，不依赖他人电脑**。

#### 更新插件

开发者重新执行 `npm run package:offline`，将新的 zip 发给同事覆盖安装即可（先卸载再安装，或直接覆盖 `%LOCALAPPDATA%\WordFormatter\web\` 目录）。

#### 卸载

双击 `uninstall.bat`，自动停止服务、移除文件、取消注册、删除开机自启。

---

### 方式二：部署到独立服务器

将 `dist/` 部署到团队内网任意 Web 服务器（IIS、Nginx、Apache 等），同事通过内网地址访问插件。

### 方式三：用本机作为服务器

无需安装 IIS 等专业 Web 服务器，用 `serve` 轻量静态服务器即可。

#### 1. 安装并启动服务

```bash
# 安装 serve
npm install -g serve

# 构建插件
npm run build

# 启动服务（前台运行）
cd dist
serve -l 3000
```

服务启动后，同事可通过 `http://<你的IP>:3000/` 访问插件。

#### 2. 配置开机自启

使用 `deploy/start-server-silent.vbs` 配合 Windows 任务计划实现开机自动静默启动：

```bat
:: 一次性注册开机自启任务（用户登录时触发）
schtasks /Create /TN "WordFormatterPlugin" /TR "wscript.exe \"D:\Claude Code\wordFormatterPlugin\deploy\start-server-silent.vbs\"" /SC ONLOGON /RU Administrator /RL HIGHEST /F
```

注册后立即启动：

```bat
schtasks /Run /TN "WordFormatterPlugin"
```

#### 3. 防火墙放行

其他电脑需要访问本机 3000 端口，需添加防火墙入站规则：

```bat
netsh advfirewall firewall add rule name="WordFormatterPlugin" dir=in action=allow protocol=TCP localport=3000
```

### 团队成员安装（方式二/三）

将 `deploy/install.bat` 发送给同事，双击运行即可（已内置默认地址）。

安装成功后：

1. 重启 WPS
2. 打开 WPS 加载项弹窗（文件 → 选项 → 加载项），找到插件并点击**启用**
3. 功能区将出现"文档排版"标签页

### 卸载（方式二/三）

双击运行 `deploy/uninstall.bat`，重启 WPS 即可移除插件。

### 更新插件（方式二/三）

在本机重新执行 `npm run build`，同事重启 WPS 后自动加载最新版本，无需重新安装。

## License

MIT
