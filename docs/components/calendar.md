---
title: Calendar 日历
---

# Calendar 日历

日期面板与日程展示，支持范围选择。

`CalendarEvent` 结构：`{ date: string; label?: string }`（`date` 为 `yyyy-MM-dd`）。

| Prop           | 类型                                                       | 默认值  | 说明                             |
| -------------- | ---------------------------------------------------------- | ------- | -------------------------------- |
| modelValue     | `string \| Date \| null`                                   | -       | 选中日期（v-model）              |
| rangeValue     | `[string \| Date \| null, string \| Date \| null] \| null` | -       | 范围选择值（v-model:rangeValue） |
| range          | `boolean`                                                  | `false` | 范围选择模式                     |
| firstDayOfWeek | `0 \| 1`                                                   | `1`     | 每周第一天：0=周日，1=周一       |
| disabledDate   | `(date: Date) => boolean`                                  | -       | 禁用日期谓词                     |
| minDate        | `string \| Date`                                           | -       | 最小可选日期                     |
| maxDate        | `string \| Date`                                           | -       | 最大可选日期                     |
| events         | `CalendarEvent[]`                                          | `[]`    | 日程 / 事项标记                  |
| fetch          | `Fetch<CalendarEvent>`                                     | -       | 远程日程：自动以 `query.filters.range`（当前面板首尾日期）重取，切月自动加载 |

| 事件              | 参数                                                        | 说明         |
| ----------------- | ----------------------------------------------------------- | ------------ |
| update:modelValue | `value: string \| null`                                     | 日期更新     |
| update:rangeValue | `value: [string \| null, string \| null] \| null`           | 范围更新     |
| change            | `value: string \| [string \| null, string \| null] \| null` | 值变化       |
| panel-change      | `label: string`                                             | 面板视角切换 |

```vue
<Calendar v-model="date" :events="schedule" />
<Calendar v-model:range-value="range" range :disabled-date="isWeekend" />
```

## 交互演示

### 日历面板

<CodeCard v-model:code="calendarCode" editable title="日历面板">
  <LiveDemo :code="calendarCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const calendarCode = ref(`
  <Calendar class="max-w-xl" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { calendarCode };
</script>

