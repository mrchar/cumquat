---
title: NotificationCenter 消息盒子
---

# NotificationCenter 消息盒子

铃铛入口 + 未读徽标 + 历史列表，用于接收服务端异步通知（WebSocket / SSE / 轮询）。数据由 `useNotificationCenter` 管理，组件只负责渲染与交互；与瞬时弹出的 `Notification` 不同，消息会保留在盒子中可回看、可标记已读。

面板通过 Teleport 挂载到 `body` 并使用 fixed 定位（基于 `useFloating`，空间不足时自动翻转与平移），因此不会被父级 `overflow: hidden` 或卡片边框裁切，可直接放在顶栏、卡片等任意容器内。

| Prop      | 类型                                                         | 默认值        | 说明                         |
| --------- | ------------------------------------------------------------ | ------------- | ---------------------------- |
| api       | `UseNotificationCenterReturn`                                | -             | 消息盒子数据源（必填）       |
| open      | `boolean`                                                    | -             | 面板开合（`v-model:open`），不绑定时内部自持 |
| title     | `string`                                                     | `'通知'`      | 面板标题                     |
| emptyText | `string`                                                     | `'暂无通知'`  | 空态文案                     |
| width     | `string`                                                     | `'22rem'`     | 面板宽度                     |
| maxHeight | `string`                                                     | `'24rem'`     | 列表最大高度，超出滚动       |
| placement | `'bottom-end' \| 'bottom-start'`                             | `'bottom-end'` | 面板相对铃铛的对齐方向       |
| disabled  | `boolean`                                                    | `false`       | 禁用入口                     |

| 事件         | 参数                    | 说明                       |
| ------------ | ----------------------- | -------------------------- |
| select       | `NotificationCenterItem` | 点击消息，已自动标记已读   |
| update:open  | `boolean`               | 面板开合                   |

## 基础用法

```vue
<script setup lang="ts">
import { NotificationCenter, useNotificationCenter } from '@mrchar/cumquat';

const center = useNotificationCenter({ max: 100, storageKey: 'app-notifications' });
</script>

<template>
  <NotificationCenter :api="center" @select="(item) => router.push(item.data.path)" />
</template>
```

## 接收服务端推送

组合函数与传输方式解耦，任意长连接回调里调用 `push` 即可：

```ts
const center = useNotificationCenter();

const socket = new WebSocket('wss://example.com/notifications');
socket.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  center.push({
    type: payload.level,
    title: payload.title,
    description: payload.summary,
    data: payload,
  });
};
```

```ts
// SSE
const source = new EventSource('/api/notifications/stream');
source.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  center.push({ title: payload.title, description: payload.summary, data: payload });
};
```

## useNotificationCenter

| 选项         | 类型                            | 默认值 | 说明                             |
| ------------ | ------------------------------- | ------ | -------------------------------- |
| initialItems | `NotificationCenterItem[]`      | `[]`   | 初始消息（如自行从持久化恢复）   |
| max          | `number`                        | `100`  | 最多保留条数，超出丢弃最早的     |
| onPush       | `(item) => void`                | -      | 新消息入列回调（提示音、桌面通知） |
| storageKey   | `string`                        | -      | 传入后自动读写 localStorage      |

| 返回         | 类型                                 | 说明               |
| ------------ | ------------------------------------ | ------------------ |
| items        | `Ref<NotificationCenterItem[]>`      | 消息列表，最新在前 |
| unreadCount  | `ComputedRef<number>`                | 未读条数           |
| hasUnread    | `ComputedRef<boolean>`               | 是否存在未读       |
| push         | `(input) => NotificationCenterItem`  | 接收一条通知       |
| markRead     | `(id: number) => void`               | 单条标记已读       |
| markAllRead  | `() => void`                         | 全部标记已读       |
| remove       | `(id: number) => void`               | 删除单条           |
| clear        | `() => void`                         | 清空全部           |

`NotificationCenterItem` 结构：`{ id, type, title, description?, data?, time, read }`，`type` 为 `'info' | 'success' | 'warning' | 'danger'`。

## 交互演示

<CodeCard v-model:code="centerCode" editable title="消息盒子">
  <LiveDemo :code="centerCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">
import { ref } from 'vue';
import { useNotificationCenter } from '@cumquat/composables';

const center = useNotificationCenter();

let seq = 0;
const notify = () => {
  seq += 1;
  center.push({
    type: seq % 2 ? 'success' : 'warning',
    title: `推送消息 ${seq}`,
    description: '来自 WebSocket / SSE 的异步通知',
  });
};

const centerCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <NotificationCenter :api="center" />
    <Button size="sm" @click="notify">模拟服务端推送</Button>
    <span class="text-sm text-cumquat-text-muted">点击铃铛查看消息，点开即已读</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { center, notify };
</script>
