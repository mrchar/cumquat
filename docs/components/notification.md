---
title: Notification 通知
---

# Notification 通知

角落弹出的主动通知。声明式单条渲染，也可配合 NotificationContainer 命令式调用。

| Prop     | 类型                                           | 默认值   | 说明                    |
| -------- | ---------------------------------------------- | -------- | ----------------------- |
| title    | `string`                                       | `''`     | 标题                    |
| type     | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | 语义类型                |
| closable | `boolean`                                      | `true`   | 显示关闭按钮            |
| visible  | `boolean`                                      | -        | 显隐（v-model:visible） |

| 事件           | 参数             | 说明     |
| -------------- | ---------------- | -------- |
| update:visible | `value: boolean` | 显隐更新 |
| close          | -                | 关闭     |

| 插槽    | 说明       |
| ------- | ---------- |
| default | 通知正文   |
| action  | 动作区内容 |

```vue
<Notification v-model:visible="show" title="新版本" type="info">
  2.0 已发布，建议升级。
  <template #action><Button size="sm">查看</Button></template>
</Notification>
```

## 交互演示

### 通知提醒

<CodeCard v-model:code="notificationCode" editable title="通知提醒">
  <LiveDemo :code="notificationCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const notifyVisible = ref(true);

const notificationCode = ref(`
  <Notification v-model:visible="notifyVisible" title="系统通知" type="success">
    您的任务已完成。
  </Notification>
  <Button size="sm" :disabled="notifyVisible" @click="notifyVisible = true"
    >重新显示通知</Button
  >
`);

/** LiveDemo 渲染作用域 */
const demoScope = { notifyVisible, notificationCode };
</script>
