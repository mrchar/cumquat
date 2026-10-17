---
title: Skeleton 骨架屏
---

# Skeleton 骨架屏

加载占位结构。

| Prop   | 类型      | 默认值  | 说明         |
| ------ | --------- | ------- | ------------ |
| avatar | `boolean` | `false` | 显示头像骨架 |
| rows   | `number`  | `3`     | 文本行数     |

```vue
<Skeleton avatar :rows="4" />
```

## 交互演示

### 骨架屏

<CodeCard v-model:code="skeletonCode" editable title="骨架屏">
  <LiveDemo :code="skeletonCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const skeletonCode = ref(`
  <Skeleton :rows="3" :avatar="true" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { skeletonCode };
</script>

