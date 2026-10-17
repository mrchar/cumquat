---
title: Alert 警告提示
---

# Alert 警告提示

页面内的静态反馈条。

| Prop       | 类型                                           | 默认值   | 说明            |
| ---------- | ---------------------------------------------- | -------- | --------------- |
| type       | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | 语义类型        |
| title      | `string`                                       | `''`     | 标题            |
| closable   | `boolean`                                      | `false`  | 可关闭          |
| showIcon   | `boolean`                                      | `true`   | 显示类型图标    |
| modelValue | `boolean`                                      | -        | 显隐（v-model） |

| 事件              | 参数             | 说明     |
| ----------------- | ---------------- | -------- |
| update:modelValue | `value: boolean` | 显隐更新 |
| close             | -                | 关闭     |

| 插槽    | 说明       |
| ------- | ---------- |
| title   | 自定义标题 |
| default | 正文内容   |

```vue
<Alert type="warning" title="注意" closable>当前配置将在 24 小时后生效。</Alert>
```

## 交互演示

### 警告类型

<CodeCard v-model:code="alertCode" editable title="警告类型">
  <LiveDemo :code="alertCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const alertVisible = ref(true);

const alertCode = ref(`
  <Alert type="info" title="信息提示">这是一条信息提示的内容。</Alert>
  <Alert type="success" title="操作成功">数据已保存。</Alert>
  <Alert v-model="alertVisible" type="warning" title="警告" closable
    >这是一条可关闭的警告。</Alert
  >
  <Alert type="danger" title="错误">操作失败，请重试。</Alert>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { alertVisible, alertCode };
</script>
