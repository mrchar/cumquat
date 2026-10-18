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
message.error('保存失败', { duration: 0 });  // 不自动关闭
const close = message.loading('提交中…');
close();
```

方法：`success / error / warning / info / loading`，均返回手动关闭函数。

## createNotification

角落通知：标题 / 描述 / 动作、四个角落方向堆叠。

```ts
const notification = createNotification({ duration: 4500, max: 7 });

notification.info({
  title: '新版本发布',
  description: 'v2.0 已上线，点击查看更新日志。',
  placement: 'top-right',
});
```

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
