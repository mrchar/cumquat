---
title: LiveDemo 实时演示
---

# LiveDemo 实时演示

运行时编译渲染容器：把完整 SFC 代码或模板片段编译为组件并在页面中实时渲染，自动注册组件库全部组件。传入完整 SFC（含 `<script setup>`）时，组件内部自行解析脚本与模板，无需额外注入 `scope`；传入纯模板片段时，可通过 `scope` 提供模板所需的变量与函数。通常与 CodeCard 组合实现「编辑代码即时预览」，也是 playground 调试沙盒的渲染核心。

| Prop  | 类型                      | 默认值 | 说明                                                     |
| ----- | ------------------------- | ------ | -------------------------------------------------------- |
| code  | `string`                  | -      | 完整 SFC 或模板片段（必填），变化后自动重渲染            |
| scope | `Record<string, unknown>` | `{}`   | 纯模板模式下的渲染作用域（SFC 模式下忽略）               |

> 模板在浏览器端运行时编译，宿主需使用含编译器的完整版 Vue 构建（如 `vue/dist/vue.esm-bundler.js`）。模板语法错误与渲染错误分别以提示条展示，不会导致整页崩溃。
>
> 当 `code` 包含 `<script>` 块时，LiveDemo 会按完整 SFC 处理：使用 `@vue/compiler-sfc` 解析 `<script setup>` 与 `<template>`，自动将 `import { ref } from 'vue'` 等导入映射到运行时模块；组件库组件可直接使用（全局注册），或与组合函数、类型统一从主包 `@mrchar/cumquat` 导入。

## 交互演示

### 完整 SFC

直接传入包含 `<script setup>` 与 `<template>` 的完整 SFC，代码所见即运行。

<CodeCard v-model:code="sfcDemoCode" :default-expand="true" editable title="完整 SFC">
  <LiveDemo :code="sfcDemoCode" />
</CodeCard>

### 模板片段 + scope

仅传模板片段时，通过 `scope` 注入状态与逻辑。

<CodeCard v-model:code="basicDemoCode" editable title="基础用法">
  <LiveDemo :code="basicDemoCode" />
</CodeCard>

### 注入作用域

通过 `scope` 传入状态与逻辑，模板中直接绑定。

<CodeCard v-model:code="scopeDemoCode" editable title="scope 注入状态">
  <LiveDemo :code="scopeDemoCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">
import { ref } from 'vue';

const sfcDemoCode = ref(`
<script setup lang="ts">
import { ref } from 'vue';
const count = ref(0);
<\/script>

<template>
  <div class="flex items-center gap-3">
    <Button type="primary" @click="count++">点击 {{ count }} 次</Button>
  </div>
</template>
`);

const basicDemoCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Button type="primary">主要按钮</Button>
    <Input placeholder="输入点什么" clearable class="w-56" />
  </div>
`);

const scopeDemoCode = ref(`
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <Button size="sm" @click="count++">加一</Button>
      <span class="text-sm text-cumquat-text-muted">当前值：{{ count }}</span>
    </div>
    <Message v-model="visible" type="success" closable>作用域注入的提示</Message>
  </div>
`);

const count = ref(0);
const visible = ref(true);

const demoScope = { count, visible };
</script>
