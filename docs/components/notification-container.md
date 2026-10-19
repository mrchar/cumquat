---
title: NotificationContainer 通知容器
---

# NotificationContainer 通知容器

命令式通知服务的全局渲染层，按角落方向分组堆叠。

| Prop      | 类型                                                           | 默认值                  | 说明           |
| --------- | -------------------------------------------------------------- | ----------------------- | -------------- |
| api       | `NotificationApi`                                              | 全局单例 `notification` | 可传入自建服务 |
| placement | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'`           | 默认弹出角落   |

```vue
<!-- App.vue -->
<NotificationContainer placement="top-right" />
```

```ts
import { notification } from '@mrchar/cumquat/composables';
notification.success('导入完成', '共导入 128 条记录');
notification.error('同步失败', '请检查网络后重试');
```
