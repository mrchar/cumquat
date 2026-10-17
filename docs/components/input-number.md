---
title: InputNumber 数字输入框
---

# InputNumber 数字输入框

步进、范围限制与精度修正的数字输入，支持长按连续步进。

| Prop        | 类型             | 默认值                     | 说明                         |
| ----------- | ---------------- | -------------------------- | ---------------------------- |
| modelValue  | `number \| null` | -                          | 绑定值（v-model，空为 null） |
| min         | `number`         | `-Number.MAX_SAFE_INTEGER` | 最小值                       |
| max         | `number`         | `Number.MAX_SAFE_INTEGER`  | 最大值                       |
| step        | `number`         | `1`                        | 步进                         |
| precision   | `number`         | -                          | 小数位数（缺省按 step 推导） |
| disabled    | `boolean`        | `false`                    | 禁用                         |
| placeholder | `string`         | `''`                       | 占位文本                     |

| 事件              | 参数                    | 说明   |
| ----------------- | ----------------------- | ------ |
| update:modelValue | `value: number \| null` | 值更新 |
| change            | `value: number \| null` | 值变化 |

```vue
<InputNumber v-model="qty" :min="1" :max="99" />
<InputNumber v-model="price" :step="0.01" :precision="2" />
```

## 交互演示

### 范围限制

<CodeCard v-model:code="inputNumberCode" editable title="范围限制">
  <LiveDemo :code="inputNumberCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const numValue = ref(5);

const inputNumberCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <InputNumber v-model="numValue" :min="0" :max="10" />
    <span class="text-sm text-cumquat-text-muted">当前值：{{ numValue }}</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { numValue, inputNumberCode };
</script>
