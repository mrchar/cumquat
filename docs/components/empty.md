---
title: Empty 空状态
---

# Empty 空状态

无数据占位。

| Prop        | 类型     | 默认值       | 说明     |
| ----------- | -------- | ------------ | -------- |
| description | `string` | `'暂无数据'` | 描述文本 |

| 插槽    | 说明                           |
| ------- | ------------------------------ |
| default | 额外操作区（默认显示描述文本） |

```vue
<Empty description="还没有订单">
  <Button type="primary" size="sm">去创建</Button>
</Empty>
```

---

## 交互演示

### 自定义描述

<CodeCard v-model:code="emptyCode" editable title="自定义描述">
  <LiveDemo :code="emptyCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const emptyCode = ref(`
  <Empty description="暂无订单数据" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { emptyCode };
</script>
