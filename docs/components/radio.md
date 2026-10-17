---
title: Radio 单选框
---

# Radio 单选框

| Prop       | 类型               | 默认值  | 说明                      |
| ---------- | ------------------ | ------- | ------------------------- |
| value      | `string \| number` | -       | 该选项的取值（必填）      |
| modelValue | `V \| null`        | -       | 单用时的绑定值（v-model） |
| label      | `string`           | `''`    | 文本                      |
| disabled   | `boolean`          | `false` | 禁用                      |
| name       | `string`           | -       | 表单字段名                |

| 事件              | 参数       | 说明     |
| ----------------- | ---------- | -------- |
| update:modelValue | `value: V` | 选中更新 |

| 插槽    | 说明                         |
| ------- | ---------------------------- |
| default | 自定义文本（缺省显示 label） |

```vue
<Radio v-model="size" value="sm" label="小" />
<RadioGroup v-model="size">
  <Radio value="sm" label="小" />
  <Radio value="md" label="中" />
  <Radio value="lg" label="大" disabled />
</RadioGroup>
```

## 交互演示

### 单选组

<CodeCard v-model:code="radioCode" editable title="单选组">
  <LiveDemo :code="radioCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const radioValue = ref<string | number | null>('a');

const radioCode = ref(`
  <div class="flex flex-wrap items-center gap-6">
    <RadioGroup v-model="radioValue">
      <Radio value="a" label="选项A" />
      <Radio value="b" label="选项B" />
      <Radio value="c" label="选项C" />
    </RadioGroup>
    <span class="text-sm text-cumquat-text-muted">选中值：{{ radioValue ?? '（未选）' }}</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { radioValue, radioCode };
</script>

