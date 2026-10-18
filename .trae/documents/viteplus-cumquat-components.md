# Vite+ Monorepo + Cumquat 组件库（视觉层）实施计划

## 1. 背景与目标

- 项目现状：仅有 `docs/components.md`（63 个组件清单，按 P0~P4 分组），无任何代码
- 本次目标：
  - 使用 **Vite+**（vp CLI v1.2.0 已安装，Node 24 + pnpm 可用）创建 monorepo
  - 组件放在 **components 包**，使用 **Tailwind CSS 4** 实现样式
  - 实现**全部 63 个组件的外观**（不做业务功能）
  - **有状态转换的组件实现基本状态切换**（ref/响应式驱动的开/关、选中、展开等）
  - 使用 **Vitest**（`vp test`，与 Vite 共享配置）验证每个组件能正常渲染
  - 附带 playground 调试沙盒，用于目检组件外观

## 2. 设计约定

### 2.1 命名与导出（双层命名）

| 使用方式 | 写法                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| 按需导入 | `import { Button } from '@cumquat/components'`，模板使用 `<Button>`                                              |
| 全量安装 | `app.use(Cumquat)`；组件以 `C` 前缀 PascalCase 注册（`Button` → `CButton`），模板使用 `<c-button>`               |
| 样式层   | class / CSS 变量使用完整 `cumquat-` 前缀：`bg-cumquat-accent`、`--color-cumquat-accent`、锚点类 `cumquat-button` |

- 组件文件名与导出名均无前缀（`Button.vue` → `export { default as Button }`）
- `index.ts` 汇总导出全部组件 + `Cumquat.install` 全量注册
- 仅全量安装入口使用 C 前缀（`Cumquat` / 注册名 `CButton`）

### 2.2 样式体系

- Tailwind v4 `@theme` 定义语义 token：`--color-cumquat-accent / cumquat-surface / cumquat-surface-2 / cumquat-border / cumquat-text / cumquat-text-muted / cumquat-success / cumquat-warning / cumquat-danger / cumquat-info`
- 组件只引用语义 token 类名，深色模式用 `dark:` 变体（宿主决定开关）
- 组件入口不隐式 import CSS；保留 `cumquat-xxx` 稳定 class 作为测试锚点
- 默认渲染直接写 Tailwind 工具类，视觉中立

## 3. 目标结构

```
cumquat/
├── vite.config.ts              # 根配置：defineConfig from 'vite-plus'（lint/fmt + overrides）
├── package.json                # workspace 根（vp create vite:monorepo 生成）
├── docs/components.md          # 既有文档，保留
├── packages/
│   └── components/             # @cumquat/components
│       ├── package.json        # exports: "." / "./theme.css"
│       ├── vite.config.ts      # pack 配置（tsdown，Vue SFC）
│       └── src/
│           ├── index.ts        # 无前缀导出全部组件 + Cumquat.install
│           ├── theme.css       # @theme 定义 cumquat-* 语义 token
│           └── components/     # 63 个 Button.vue / Input.vue …
└── apps/
    └── playground/             # 调试沙盒：Vite + Vue + Tailwind v4
        ├── vite.config.ts      # @vitejs/plugin-vue + @tailwindcss/vite
        ├── index.html
        └── src/
            ├── main.ts / App.vue / main.css
            └── demos/          # 每个组件一个演示块
```

## 4. 实施步骤

### 4.1 脚手架 monorepo

- 项目根运行 `vp create vite:monorepo`（`--package-manager pnpm --no-git --no-interactive` 等参数避免交互挂起）；若目录非空报错，先脚手架到临时目录再合并
- 根 `vite.config.ts` 配置 lint/fmt 基础项，overrides 覆盖 `packages/**`、`apps/**`
- 确认 `docs/` 不受影响

### 4.2 创建 packages/components

- `package.json`：`name: @cumquat/components`，`exports` 暴露 `.` 与 `./theme.css`
- 构建走 `vp pack`（tsdown：ESM + dts）；样式不打包进 JS 入口
- 编写 `theme.css`（见 2.2 样式体系）

### 4.3 实现 63 个组件（按 P0→P4 分批，每批 4~8 个）

**状态切换组件**（内部 ref / props + emit 实现基本切换）：

| 组件                                      | 状态行为                                    |
| ----------------------------------------- | ------------------------------------------- |
| Switch / Checkbox                         | checked 切换（Checkbox 支持 indeterminate） |
| Radio / RadioGroup                        | 单选高亮切换                                |
| Tabs / Segmented                          | 激活项切换                                  |
| Collapse                                  | 面板展开/收起                               |
| Dialog / Drawer                           | open 打开/关闭（v-model:open）              |
| Dropdown / Popover / Tooltip / Popconfirm | 浮层显隐切换                                |
| Select / Cascader / TreeSelect            | 下拉展开 + 选中项高亮                       |
| Tree                                      | 节点展开/收起、勾选高亮                     |
| Pagination                                | 当前页切换                                  |
| Rate                                      | 星级选择切换                                |
| Carousel                                  | 前进/后退切换                               |
| InputNumber                               | 内部数值步进                                |
| Tag / Alert                               | 可关闭（关闭后隐藏）                        |
| Transfer / Upload                         | 列表项选中高亮（Transfer 简单双栏）         |

**纯外观组件**（静态结构 + props 控制形态）：Button、Icon（内联 SVG）、Input、Textarea、Form、Table、Message、Notification、Card、Badge、Avatar、Breadcrumb、Steps、Progress、Skeleton、Empty、Result、Descriptions、Loading、Layout/Grid/Space/Divider、Menu、DatePicker、TimePicker、Calendar（静态月面板）、AutoComplete、Slider、Image、Timeline、Anchor、Affix、BackTop、Statistic、Typography、QRCode（占位图形）、Watermark、Tour、Mention、VirtualList（静态长列表示意）、FloatButton、ColorPicker（面板外观）。

### 4.4 Vitest 渲染测试

- 测试运行：`vp test`（Vitest 与组件包 Vite 配置共享）；依赖 `@vue/test-utils` + `jsdom`（happy-dom 可选）
- 每个组件至少一个**冒烟渲染测试**：挂载后断言根元素渲染、`cumquat-*` 锚点类存在
- **状态切换组件**补充交互断言（示例）：
  - Switch：点击后 `aria-checked` / 激活类翻转
  - Tabs：点击第二个标签后激活项变化
  - Dialog：`open` 传入 true 时浮层出现在 DOM
  - Checkbox：点击在 checked / indeterminate 间切换
- 测试文件就近放置：`packages/components/src/components/__tests__/Button.spec.ts` 模式
- 测试中不做样式断言（Tailwind 类由 playground 目检），只断言结构与状态

### 4.5 playground 调试沙盒

- Tailwind v4 接入：`@tailwindcss/vite` 插件 + `@import "tailwindcss"` + `@import "@cumquat/components/theme.css"` + `@source "../packages/components/src"`
- 定位：开发期调试沙盒（非演示站）。左侧为预置代码片段列表与主题切换，右侧 CodeCard（可编辑）+ LiveDemo 渲染，编辑代码即时预览；调试新组件时把模板贴入编辑区
- 组件的对外演示与文档统一由 docs 站点承担，playground 不再维护组件演示内容

### 4.6 验证

- `vp install` 成功
- `vp test`：63 个组件渲染测试全部通过
- `vp -C playground dev` 启动调试沙盒，逐片段目检外观与状态切换
- `vp check`（lint + fmt + 类型）通过
- `vp -C packages/components pack` 构建产物成功

## 5. 交付物

- 可运行的 Vite+ monorepo（pnpm workspace）
- `@cumquat/components`：63 个组件 + theme.css，双层命名导出/注册
- 全组件 Vitest 渲染测试（冒烟 + 状态切换断言）
- playground 调试沙盒：预置片段 + 实时编辑预览，供开发期验证
