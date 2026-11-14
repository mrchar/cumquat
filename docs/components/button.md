---
title: Button 按钮
---

# Button 按钮

触发操作，支持语义类型、尺寸、加载态；传入 `action` 后点击自动执行并派生 loading / disabled。

| Prop        | 类型                                              | 默认值        | 说明                                                                                                                       |
| ----------- | ------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| type        | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'secondary'` | 按钮语义类型                                                                                                               |
| size        | `'sm' \| 'md' \| 'lg'`                            | `'md'`        | 按钮尺寸                                                                                                                   |
| disabled    | `boolean`                                         | `false`       | 是否禁用                                                                                                                   |
| loading     | `boolean`                                         | `false`       | 外部直接指定加载态                                                                                                         |
| block       | `boolean`                                         | `false`       | 是否撑满一行                                                                                                               |
| action      | [`ActionHandler`](/types/basics/core#actionhandler)                                   | -             | 传入动作后，点击自动执行并派生 loading/disabled                                                                            |
| toast       | `boolean`                                         | `false`       | 动作成功 / 失败后是否弹 toast；失败文案按 `message → error 字符串 / Error.message →「操作失败」` 归一；Button 不渲染错误条，也不 emit `actionError` |
| successText | `string`                                          | `undefined`   | toast 成功文案；优先使用动作结果中的 `message`，其次使用此属性，最后回退到「操作成功」                                      |
| toastTarget | [`MountTarget`](/types/basics/overlay#mounttarget)                                     | `undefined`   | 该按钮成功 / 失败 toast 的挂载目标，优先于 `ConfigProvider` 和应用配置                       |
| id          | `string`                                          | -             | 按钮元素 id                                                                                                                |

| 事件  | 参数                | 说明     |
| ----- | ------------------- | -------- |
| click | `event: MouseEvent` | 点击事件 |

| 插槽    | 说明     |
| ------- | -------- |
| default | 按钮内容 |

```vue
<Button type="primary" @click="save">保存</Button>
<Button danger :action="deleteAction">删除</Button>
<Button loading block size="lg">提交中…</Button>
```

`toastTarget` 支持 CSS 选择器和 DOM 元素；未指定时继承最近的 `ConfigProvider` 或应用配置。传入选择器时目标需在消息产生前存在；挂载到组件时传其根 DOM 元素（例如 `componentRef.value?.$el`），不是组件实例。

```vue
<div id="button-toasts" />
<Button :action="save" toast toast-target="#button-toasts">保存</Button>
<Button :action="save" toast :toast-target="toastElement">保存到指定 DOM</Button>
```

## 交互演示

### 按钮类型

<CodeCard v-model:code="buttonTypeCode" editable title="按钮类型">
  <LiveDemo :code="buttonTypeCode" :scope="demoScope" />
</CodeCard>

### 按钮尺寸

<CodeCard v-model:code="buttonSizeCode" editable title="按钮尺寸">
  <LiveDemo :code="buttonSizeCode" :scope="demoScope" />
</CodeCard>

### 禁用与加载

<CodeCard v-model:code="buttonStateCode" editable title="禁用与加载">
  <LiveDemo :code="buttonStateCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const buttonTypeCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Button type="primary">主要按钮</Button>
    <Button>次要按钮</Button>
    <Button type="danger">危险按钮</Button>
    <Button type="ghost">幽灵按钮</Button>
  </div>
`);

const buttonSizeCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Button type="primary" size="sm">小号</Button>
    <Button type="primary">中号</Button>
    <Button type="primary" size="lg">大号</Button>
  </div>
`);

const buttonStateCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Button disabled>禁用</Button>
    <Button type="primary" loading>加载中</Button>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { buttonTypeCode, buttonSizeCode, buttonStateCode };
</script>
