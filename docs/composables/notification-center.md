---
title: 消息盒子 useNotificationCenter
---

# 消息盒子 useNotificationCenter

接收服务端异步通知（WebSocket / SSE / 轮询）并维护未读计数、已读与删除。纯数据层，不渲染 DOM；渲染交给 [NotificationCenter 组件](/components/notification-center)。

```ts
import { useNotificationCenter } from '@mrchar/cumquat';

const center = useNotificationCenter({ max: 100, storageKey: 'app-notifications' });

center.push({ title: '同步完成', description: '共 12 条记录', type: 'success' });
console.log(center.unreadCount.value); // 1
center.markAllRead();
```

## 选项

| 选项         | 类型                       | 默认值 | 说明                               |
| ------------ | -------------------------- | ------ | ---------------------------------- |
| initialItems | `NotificationCenterItem[]` | `[]`   | 初始消息（如自行从持久化恢复）     |
| max          | `number`                   | `100`  | 最多保留条数，超出丢弃最早的       |
| onPush       | `(item) => void`           | -      | 新消息入列回调（提示音、桌面通知） |
| storageKey   | `string`                   | -      | 传入后自动读写 localStorage        |

## 返回值

| 成员        | 类型                                | 说明               |
| ----------- | ----------------------------------- | ------------------ |
| items       | `Ref<NotificationCenterItem[]>`     | 消息列表，最新在前 |
| unreadCount | `ComputedRef<number>`               | 未读条数           |
| hasUnread   | `ComputedRef<boolean>`              | 是否存在未读       |
| push        | `(input) => NotificationCenterItem` | 接收一条通知       |
| markRead    | `(id: number) => void`              | 单条标记已读       |
| markAllRead | `() => void`                        | 全部标记已读       |
| remove      | `(id: number) => void`              | 删除单条           |
| clear       | `() => void`                        | 清空全部           |

## 数据结构

```ts
export interface NotificationCenterItem {
  id: number;
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  description?: string;
  /** 业务附带数据（跳转参数、原始推送体等） */
  data?: unknown;
  /** 创建时间戳（ms） */
  time: number;
  read: boolean;
}
```

## 与 createNotification 的区别

- `createNotification` 是瞬时提醒：角落弹出、到时自动消失，适合「操作结果」。
- `useNotificationCenter` 是消息盒子：持久保留、有未读状态，适合「服务端异步事件」，需配合 NotificationCenter 组件呈现。
