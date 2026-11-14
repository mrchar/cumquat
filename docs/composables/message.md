---
title: 消息服务
---

# 消息服务

命令式反馈服务，宿主不引入组件也可直接函数调用。

## createMessage

全局轻提示。基于 toast 队列：堆叠定位、去重、自动关闭、悬停暂停。

```ts
const message = createMessage({ duration: 3000, max: 5 });

message.success('保存成功');
message.error('保存失败', { duration: 0 }); // 不自动关闭
const close = message.loading('提交中…');
close();
```

方法：`success / error / warning / info / loading`，均返回手动关闭函数。

逐条指定消息挂载目标时使用 `push`，`target` 支持 CSS 选择器或 `HTMLElement`；该目标优先于 MessageContainer、`ConfigProvider` 和应用配置：

```ts
message.push('保存成功', { type: 'success', target: '#form-toasts' });
message.push('上传失败', { type: 'error', target: uploadRoot });
```

## createNotification

角落通知：标题 / 描述 / 动作、四个角落方向堆叠。

```ts
const notification = createNotification({ duration: 4500, max: 7 });

// 语义方法为位置参数：(title, description?)
notification.info('新版本发布', 'v2.0 已上线，点击查看更新日志。');
// open 可指定类型与单条时长：(type, title, description?, duration?)
notification.open('success', '保存成功', undefined, 3000);
```

方法：`open / success / error / warning / info`，均返回消息 id；`error` 默认时长 5000ms。

## useLoadingService / createLoadingService

计数式加载服务：多个并发请求合并为一个 loading 态，全部结束才关闭。

```ts
const loading = useLoadingService(); // 全局单例
loading.start();
// …请求结束
loading.finish();

loading.loading; // Ref<boolean>，count > 0 时为 true
```

`createLoadingService()` 创建独立实例（非全局）。

## useToastQueue

上述服务的底座：命令式浮层队列。自建同类反馈组件时使用。

```ts
const { items, push, remove, clear } = useToastQueue({
  duration: 3000,
  max: 5,
});
```

## 全局单例 message / notification

主包同时导出开箱即用的全局单例，无需手动创建即可在任意模块调用：

```ts
import { message, notification } from '@mrchar/cumquat';

message.success('已保存');
notification.info('新版本发布', 'v2.0 已上线');
```

- `message` 即 `createMessage()` 的默认实例（`duration: 3000`、`max: 5`），全局 Message 组件与宿主调用共享同一条 toast 队列
- `notification` 即 `createNotification()` 的默认实例（`duration: 4500`、`max: 7`）
- 需要隔离队列（微前端、多应用并存）或自定义默认时长 / 堆叠上限时，用 `createMessage` / `createNotification` 创建独立实例
