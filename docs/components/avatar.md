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

