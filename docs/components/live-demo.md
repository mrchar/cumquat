---
title: LiveDemo 实时演示
---

# LiveDemo 实时演示

运行时编译渲染容器：把模板片段编译为组件并在页面中实时渲染，自动注册组件库全部组件；传入 `scope` 后模板可直接访问响应式变量与函数。通常与 CodeCard 组合实现「编辑代码即时预览」，也是 playground 调试沙盒的渲染核心。

| Prop  | 类型                      | 默认值 | 说明                                   |
| ----- | ------------------------- | ------ | -------------------------------------- |
| code  | `string`                  | -      | 组件模板片段（必填），变化后自动重渲染 |
| scope | `Record<string, unknown>` | `{}`   | 渲染作用域：模板中可访问的变量与函数   |

> 模板在浏览器端运行时编译，宿主需使用含编译器的完整版 Vue 构建（如 `vue/dist/vue.esm-bundler.js`）。模板语法错误与渲染错误分别以提示条展示，不会导致整页崩溃。

## 交互演示

### 基础用法

组件标签零注册直接使用，修改代码后演示区即时更新。

<CodeCard v-model:code="basicDemoCode" editable title="基础用法">
  <LiveDemo :code="basicDemoCode" />
</CodeCard>

### 注入作用域

通过 `scope` 传入状态与逻辑，模板中直接绑定。

<CodeCard v-model:code="scopeDemoCode" editable title="scope 注入状态">
  <LiveDemo :code="scopeDemoCode" :scope="demoScope" />
</CodeCard>

<script setup>
import { ref } from 'vue';

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
