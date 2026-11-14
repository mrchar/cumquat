---
title: Card 卡片
---

# Card 卡片

内容分块容器。

| Prop      | 类型      | 默认值  | 说明         |
| --------- | --------- | ------- | ------------ |
| title     | `string`  | `''`    | 卡片标题     |
| bordered  | `boolean` | `true`  | 是否带描边   |
| hoverable | `boolean` | `false` | 悬浮时带阴影 |

| 插槽    | 说明           |
| ------- | -------------- |
| header  | 自定义头部内容 |
| default | 卡片主体       |
| footer  | 自定义底部内容 |

```vue
<Card title="账户信息" hoverable>
  <p>主体内容</p>
  <template #footer><Button size="sm">编辑</Button></template>
</Card>
```

## 补充：订阅数据源

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| subscribe | [`SubscribeHandler`](/types/basics/core#subscribehandler)`<{ title?: string; content?: string }>` | `undefined` | 订阅卡片数据；挂载时调用，`title` / `content` 用于渲染 |
| errorText | `string` | `undefined` | 订阅失败时的错误文案；未提供时使用组件内建兜底 |

`subscribe` 与本地 `title` 同时存在时优先使用订阅结果；`content` 只来自订阅数据。订阅失败时标题回退到 `title`，并在提供 `errorText` 时额外展示错误条。

## 交互演示

### 悬浮与无边框

<CodeCard v-model:code="cardCode" editable title="悬浮与无边框">
  <LiveDemo :code="cardCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const text = ref('');

const cardCode = ref(`
  <div class="grid grid-cols-2 gap-4">
    <Card title="基础卡片" hoverable>
      <p class="text-sm text-cumquat-text-muted">卡片内容区域，支持任意内容。</p>
    </Card>
    <Card title="无边框卡片" :bordered="false">
      <p class="text-sm text-cumquat-text-muted">bordered 为 false 时不渲染描边。</p>
    </Card>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { text, cardCode };
</script>
