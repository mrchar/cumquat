---
title: RadioGroup 单选组
---

# RadioGroup 单选组

互斥选择容器，通过上下文接管子 Radio 的值与互斥。

| Prop       | 类型                         | 默认值         | 说明              |
| ---------- | ---------------------------- | -------------- | ----------------- |
| modelValue | `string \| number \| null`   | -              | 绑定值（v-model） |
| direction  | `'horizontal' \| 'vertical'` | `'horizontal'` | 排列方向          |
| disabled   | `boolean`                    | `false`        | 整组禁用          |

| 事件              | 参数               | 说明   |
| ----------------- | ------------------ | ------ |
| update:modelValue | `value: V \| null` | 值更新 |

| 插槽    | 说明          |
| ------- | ------------- |
| default | 放置 Radio 项 |

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
