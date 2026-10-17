---
title: TimePicker 时间选择器
---

# TimePicker 时间选择器

时间点选择，滚动列交互。

| Prop        | 类型             | 默认值       | 说明              |
| ----------- | ---------------- | ------------ | ----------------- |
| modelValue  | `string \| null` | -            | 时间值（v-model） |
| placeholder | `string`         | `'选择时间'` | 占位文本          |
| disabled    | `boolean`        | `false`      | 禁用              |
| hourStep    | `number`         | `1`          | 小时列步进        |
| minuteStep  | `number`         | `5`          | 分钟列步进        |
| useSeconds  | `boolean`        | `false`      | 展示秒列          |
| minTime     | `string`         | -            | 最早可选时间      |
| maxTime     | `string`         | -            | 最晚可选时间      |

| 事件              | 参数                    | 说明   |
| ----------------- | ----------------------- | ------ |
| update:modelValue | `value: string \| null` | 值更新 |
| change            | `value: string \| null` | 值变化 |

```vue
<TimePicker v-model="time" :minute-step="15" min-time="09:00" max-time="18:00" />
```

## 交互演示

### 时间选择

<CodeCard v-model:code="timePickerCode" editable title="时间选择">
  <LiveDemo :code="timePickerCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const timePickerCode = ref(`
  <TimePicker />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { timePickerCode };
</script>

