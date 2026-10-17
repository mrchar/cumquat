---
title: Checkbox 复选框
---

# Checkbox 复选框

| Prop          | 类型                          | 默认值  | 说明                                     |
| ------------- | ----------------------------- | ------- | ---------------------------------------- |
| modelValue    | `boolean`                     | -       | 勾选态（v-model）                        |
| value         | `string \| number \| boolean` | -       | 成组使用时该选项的取值（配合成组上下文） |
| label         | `string`                      | `''`    | 文本                                     |
| disabled      | `boolean`                     | `false` | 禁用                                     |
| indeterminate | `boolean`                     | `false` | 半选态（纯视觉）                         |
| name          | `string`                      | -       | 表单字段名                               |

| 事件              | 参数             | 说明     |
| ----------------- | ---------------- | -------- |
| update:modelValue | `value: boolean` | 勾选更新 |

| 插槽    | 说明                         |
| ------- | ---------------------------- |
| default | 自定义文本（缺省显示 label） |

```vue
<Checkbox v-model="agree" label="我已阅读协议" />
<Checkbox indeterminate :model-value="false" label="全选" />
```

## 交互演示

### 勾选、半选与禁用

<CodeCard v-model:code="checkboxCode" editable title="勾选、半选与禁用">
  <LiveDemo :code="checkboxCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const checked = ref(false);

const checkboxCode = ref(`
  <div class="flex flex-wrap items-center gap-6">
    <Checkbox v-model="checked" label="同意服务协议" />
    <Checkbox label="半选态" :indeterminate="true" />
    <Checkbox label="禁用态" :disabled="true" />
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { checked, checkboxCode };
</script>

