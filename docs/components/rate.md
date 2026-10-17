---
title: Rate 评分
---

# Rate 评分

星级评分，支持半星、悬停预览与键盘调节。

| Prop       | 类型      | 默认值  | 说明                             |
| ---------- | --------- | ------- | -------------------------------- |
| modelValue | `number`  | -       | 绑定值（v-model）                |
| count      | `number`  | `5`     | 星星总数                         |
| disabled   | `boolean` | `false` | 禁用                             |
| readonly   | `boolean` | `false` | 只读（不可交互）                 |
| allowHalf  | `boolean` | `false` | 允许半星                         |
| allowClear | `boolean` | `true`  | 允许清除（再次点击同值取消为 0） |

| 事件              | 参数            | 说明         |
| ----------------- | --------------- | ------------ |
| update:modelValue | `value: number` | 值更新       |
| change            | `value: number` | 值变化       |
| hoverChange       | `value: number` | 悬停预览变化 |

```vue
<Rate v-model="score" allow-half />
<Rate :model-value="4" readonly />
```

## 交互演示

### 评分与禁用

<CodeCard v-model:code="rateCode" editable title="评分与禁用">
  <LiveDemo :code="rateCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const rateValue = ref(3);

const rateCode = ref(`
  <div class="flex flex-wrap items-center gap-6">
    <Rate v-model="rateValue" />
    <Rate :model-value="0" :disabled="true" />
    <span class="text-sm text-cumquat-text-muted">评分：{{ rateValue }}</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { rateValue, rateCode };
</script>

