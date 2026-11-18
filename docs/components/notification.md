---
title: Notification 通知
---

# Notification 通知

角落弹出的主动通知，有两种用法：

- **声明式**：`<Notification>` 渲染单条通知，由 `v-model:visible` 控制显隐。
- **命令式**：在应用根部挂载一次 `<NotificationContainer />`，之后调用 `notification.success()` 等方法按角落堆叠展示、自动消失。

## 声明式单条（Notification）

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

## 命令式调用（NotificationContainer）

| Prop      | 类型                                                           | 默认值                  | 说明                                       |
| --------- | -------------------------------------------------------------- | ----------------------- | ------------------------------------------ |
| api       | `NotificationApi`                                              | 全局单例 `notification` | 可传入 `createNotification()` 自建队列      |
| placement | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'`           | 默认弹出角落，消息自身的 placement 优先     |
| target    | [`MountTarget`](/types/basics/overlay#mounttarget)              | -                       | Teleport 目标；继承配置，最终回退 body      |

```vue
<!-- App.vue -->
<NotificationContainer placement="top-right" />
```

```ts
import { notification } from '@mrchar/cumquat';

notification.success('导入完成', '共导入 128 条记录');
notification.error('同步失败', '请检查网络后重试');
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
