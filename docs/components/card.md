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
