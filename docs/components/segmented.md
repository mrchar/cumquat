---
title: Segmented 分段控制器
---

# Segmented 分段控制器

紧凑的选项切换。

`SegmentedOption` 结构：`{ label: string; value: string | number; disabled?: boolean }`。

| Prop       | 类型                | 默认值  | 说明              |
| ---------- | ------------------- | ------- | ----------------- |
| options    | `SegmentedOption[]` | `[]`    | 选项列表          |
| modelValue | `string \| number`  | -       | 绑定值（v-model） |
| disabled   | `boolean`           | `false` | 整体禁用          |
| size       | `'sm' \| 'md'`      | `'md'`  | 尺寸              |

| 事件              | 参数                      | 说明   |
| ----------------- | ------------------------- | ------ |
| update:modelValue | `value: string \| number` | 值更新 |
| change            | `value: string \| number` | 值变化 |

```vue
<Segmented
  v-model="view"
  :options="[
    { label: '日', value: 'day' },
    { label: '周', value: 'week' },
    { label: '月', value: 'month' },
  ]"
/>
```

## 交互演示

### 分段切换

<CodeCard v-model:code="segmentedCode" editable title="分段切换">
  <LiveDemo :code="segmentedCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const segmentedValue = ref<string | number>('day');

const segmentedOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
];

const segmentedCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Segmented v-model="segmentedValue" :options="segmentedOptions" />
    <span class="text-sm text-cumquat-text-muted">选中：{{ segmentedValue }}</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { segmentedValue, segmentedOptions, segmentedCode };
</script>
