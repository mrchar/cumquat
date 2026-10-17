---
title: Switch 开关
---

# Switch 开关

| Prop       | 类型      | 默认值  | 说明              |
| ---------- | --------- | ------- | ----------------- |
| modelValue | `boolean` | -       | 绑定值（v-model） |
| label      | `string`  | `''`    | 右侧文本          |
| disabled   | `boolean` | `false` | 禁用              |
| name       | `string`  | -       | 表单字段名        |

| 事件              | 参数             | 说明   |
| ----------------- | ---------------- | ------ |
| update:modelValue | `value: boolean` | 值更新 |
| change            | `value: boolean` | 值变化 |

```vue
<Switch v-model="enabled" label="开启通知" />
```

## 交互演示

### 开关状态

<CodeCard v-model:code="switchCode" editable title="开关状态">
  <LiveDemo :code="switchCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const switchOn = ref(true);

const switchCode = ref(`
  <div class="flex flex-wrap items-center gap-6">
    <Switch v-model="switchOn" />
    <Switch :model-value="false" />
    <Switch :model-value="true" :disabled="true" />
    <span class="text-sm text-cumquat-text-muted">状态：{{ switchOn ? '开启' : '关闭' }}</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { switchOn, switchCode };
</script>

