---
title: Input 输入框
---

# Input 输入框

单行 / 多行文本输入，支持前后缀、清空、字数统计、trim 与表单校验联动。

| Prop          | 类型                   | 默认值   | 说明                                                       |
| ------------- | ---------------------- | -------- | ---------------------------------------------------------- |
| modelValue    | `string`               | -        | 绑定值（v-model）                                          |
| type          | `string`               | `'text'` | 原生输入类型                                               |
| size          | `'sm' \| 'md' \| 'lg'` | `'md'`   | 尺寸                                                       |
| placeholder   | `string`               | `''`     | 占位文本                                                   |
| disabled      | `boolean`              | `false`  | 禁用                                                       |
| readonly      | `boolean`              | `false`  | 只读                                                       |
| invalid       | `boolean`              | `false`  | 外部强制校验失败态（红框）；表单上下文中也会取字段校验错误 |
| textarea      | `boolean`              | `false`  | 多行文本域                                                 |
| rows          | `number`               | `3`      | 多行行数                                                   |
| clearable     | `boolean`              | `false`  | 可清空（聚焦且有值时显示清除按钮）                         |
| showWordLimit | `boolean`              | `false`  | 显示字数统计                                               |
| maxlength     | `number`               | -        | 最大输入长度                                               |
| trim          | `boolean`              | `false`  | 失焦时去除首尾空白并回发                                   |
| name          | `string`               | -        | 表单字段名（Form 上下文中参与校验）                        |

| 事件              | 参数                | 说明         |
| ----------------- | ------------------- | ------------ |
| update:modelValue | `value: string`     | 输入值更新   |
| clear             | -                   | 点击清空按钮 |
| blur              | `event: FocusEvent` | 失焦         |
| focus             | `event: FocusEvent` | 聚焦         |

| 插槽   | 说明       |
| ------ | ---------- |
| prefix | 输入框前缀 |
| suffix | 输入框后缀 |

Expose：`validate()` 触发校验、`clearValidate()` 清除校验态、`focus()` 聚焦。

```vue
<Input v-model="name" placeholder="请输入名称" clearable />
<Input v-model="bio" textarea :rows="4" show-word-limit :maxlength="120" />
<Input v-model="keyword">
  <template #prefix>🔍</template>
</Input>
```

## 交互演示

### 基础、禁用与校验态

<CodeCard v-model:code="inputCode" editable title="基础、禁用与校验态">
  <LiveDemo :code="inputCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const text = ref('');

const inputCode = ref(`
  <div class="flex flex-col gap-3">
    <Input v-model="text" placeholder="请输入内容" class="w-64" />
    <Input placeholder="禁用态" disabled class="w-64" />
    <Input placeholder="校验失败态" invalid class="w-64" />
    <p class="text-sm text-cumquat-text-muted">当前值：{{ text || '（空）' }}</p>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { text, inputCode };
</script>
