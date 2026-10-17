---
title: Grid 栅格
---

# Grid 栅格

响应式行列布局，按断点覆盖列数。

| Prop     | 类型                             | 默认值  | 说明                         |
| -------- | -------------------------------- | ------- | ---------------------------- |
| cols     | `1 \| 2 \| 3 \| 4`               | `2`     | 默认列数（可被断点列数覆盖） |
| sm       | `1 \| 2 \| 3 \| 4`               | -       | ≥640px 列数                  |
| md       | `1 \| 2 \| 3 \| 4`               | -       | ≥768px 列数                  |
| lg       | `1 \| 2 \| 3 \| 4`               | -       | ≥1024px 列数                 |
| xl       | `1 \| 2 \| 3 \| 4`               | -       | ≥1280px 列数                 |
| gap      | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'`  | 间距                         |
| centered | `boolean`                        | `false` | 内容居中（最大宽度约束）     |

| 插槽    | 说明     |
| ------- | -------- |
| default | 栅格子项 |

```vue
<Grid :cols="1" :md="2" :lg="4" gap="lg">
  <Card v-for="item in list" :key="item.id" :title="item.name" />
</Grid>
```

## 交互演示

### 栅格排列

<CodeCard v-model:code="gridCode" editable title="栅格排列">
  <LiveDemo :code="gridCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const gridCode = ref(`
  <Grid :cols="3">
    <div
      class="flex h-16 items-center justify-center rounded bg-cumquat-accent-soft text-sm text-cumquat-accent"
    >
      1
    </div>
    <div
      class="flex h-16 items-center justify-center rounded bg-cumquat-accent-soft text-sm text-cumquat-accent"
    >
      2
    </div>
    <div
      class="flex h-16 items-center justify-center rounded bg-cumquat-accent-soft text-sm text-cumquat-accent"
    >
      3
    </div>
  </Grid>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { gridCode };
</script>
