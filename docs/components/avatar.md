---
title: Avatar 头像
---

# Avatar 头像

用户头像，支持图片、懒加载、失败兜底与文字回退。

| Prop        | 类型                   | 默认值     | 说明                         |
| ----------- | ---------------------- | ---------- | ---------------------------- |
| src         | `string`               | `''`       | 图片地址                     |
| alt         | `string`               | `''`       | 图片替代文本                 |
| size        | `'sm' \| 'md' \| 'lg'` | `'md'`     | 尺寸                         |
| shape       | `'circle' \| 'square'` | `'circle'` | 形状                         |
| text        | `string`               | `''`       | 无图片时显示的文字（取首字） |
| lazy        | `boolean`              | `false`    | 进入视口再加载               |
| fallbackSrc | `string`               | `''`       | 加载失败时的兜底地址         |

| 插槽    | 说明                         |
| ------- | ---------------------------- |
| default | 无图片且无兜底时的自定义内容 |

```vue
<Avatar src="/u/1.png" alt="张三" />
<Avatar text="张三" shape="square" />
```

## 补充：订阅数据源

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| subscribe | [`SubscribeHandler`](/types/basics/core#subscribehandler)`<{ src?: string; text?: string }>` | `undefined` | 订阅头像数据；挂载时调用，`src` / `text` 优先于同名 props |
| errorText | `string` | `undefined` | 订阅失败时的错误文案；未提供时使用组件内建兜底 |

`subscribe` 与本地 `src` / `text` 同时存在时优先使用订阅结果；成功结果中缺失的字段回退到同名 props，订阅失败时正文回退到本地 props，并在提供 `errorText` 时额外展示错误条。

## 交互演示

### 尺寸与形状

<CodeCard v-model:code="avatarCode" editable title="尺寸与形状">
  <LiveDemo :code="avatarCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const text = ref('');

const avatarCode = ref(`
  <div class="flex flex-wrap items-center gap-4">
    <Avatar text="柠" />
    <Avatar text="檬" size="lg" />
    <Avatar text="Q" shape="square" />
    <Avatar text="F" size="sm" />
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { text, avatarCode };
</script>
