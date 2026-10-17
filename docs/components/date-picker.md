---
title: DatePicker 日期选择器
---

# DatePicker 日期选择器

单日期选择面板与快捷选项。

| Prop        | 类型             | 默认值                 | 说明                               |
| ----------- | ---------------- | ---------------------- | ---------------------------------- |
| modelValue  | `number \| null` | -                      | 选中日期（当月日序 1-31，v-model） |
| placeholder | `string`         | `'选择日期'`           | 占位文本                           |
| disabled    | `boolean`        | `false`                | 禁用                               |
| viewMonth   | `Date`           | `new Date(2026, 9, 1)` | 面板初始视角月份                   |
| shortcuts   | `DateShortcut[]` | `[]`                   | 快捷选项                           |

| 事件              | 参数            | 说明   |
| ----------------- | --------------- | ------ |
| update:modelValue | `value: number` | 值更新 |
| change            | `value: number` | 值变化 |

```vue
<DatePicker v-model="day" :shortcuts="todayShortcuts" />
```

## 交互演示

### 日期选择

<CodeCard v-model:code="datePickerCode" editable title="日期选择">
  <LiveDemo :code="datePickerCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const dateValue = ref<number | null>(null);

const datePickerCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <DatePicker v-model="dateValue" />
    <span class="text-sm text-cumquat-text-muted">
      选中：{{ dateValue != null ? '2026-10-' + String(dateValue).padStart(2, '0') : '（未选）' }}
    </span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { dateValue, datePickerCode };
</script>
