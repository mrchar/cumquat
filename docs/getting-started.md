---
title: 快速上手
---

# 快速上手

## 引入方式

```ts
// 全量注册：模板中以 <c-button> 等 C 前缀标签使用
import { Cumquat } from '@cumquat/vue/components';
app.use(Cumquat);

// 按需导入：无注册前缀，直接使用
import { Button, Select, Table } from '@cumquat/vue/components';
```

## 通用约定

- **v-model 纯同步**：所有 `modelValue` / `open` / `visible` 等绑定值只做同步回写，异步副作用一律由外层驱动。
- **异步状态 `:state` / `:data`**：数据型组件（Table、Select 等）可接收 `AsyncStateLike<T>`（`status / data / error / isStale? / retry?`），传入后组件内置加载 / 错误重试 / 空态 / stale 提示四态渲染，组件自身不发请求。
- **远程资源 `:fetch`**：17 个资源型组件可绑定统一的 `Fetch<T>` 方法，挂载即请求，翻页 / 排序 / 筛选 / 搜索 / 展开自动重取，防抖、竞态、四态渲染全部内置，详见[远程数据](/fetch)。
- **动作 `:action`**：动作型组件（Button、Popconfirm 等）接收一个同步或异步函数，执行期间自动派生 loading / disabled。
- **受控 / 非受控统一**：所有异步 props 均可选，不传即为普通非受控组件。
- **语义 class**：每个组件保留 `cumquat-xxx` 语义类名，作为主题化与测试锚点。

## 样式接入

```ts
// 宿主已有 Tailwind v4：扫描组件类名并引入主题
@import 'tailwindcss';
@source '../node_modules/@cumquat/components/dist';
@import '@cumquat/themes/basic.css';

// 无 Tailwind：直接引入预编译样式
import '@cumquat/components/dist/style.css';
```

## 下一步

- 浏览[组件总览](/components/button)，每个组件页都带有可编辑的实时演示。
- 了解[远程数据 Fetch](/fetch) 的统一请求机制。
- 在组件外使用 [组合函数](/composables) 导出异步状态、数据与刷新方法。
