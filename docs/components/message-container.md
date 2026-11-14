---
title: MessageContainer 消息容器
---

# MessageContainer 消息容器

命令式消息服务的全局渲染层，在应用根部挂载一次即可。

| Prop | 类型         | 默认值             | 说明                                |
| ---- | ------------ | ------------------ | ----------------------------------- |
| api    | [`MessageApi`](/types/basics/common#messageapi)  | 全局单例 `message` | 可传入自建服务（`createMessage()`） |
| target | [`MountTarget`](/types/basics/overlay#mounttarget) | -                  | 默认 Teleport 目标；继承配置，最终回退 body |

```vue
<!-- App.vue -->
<MessageContainer />
```

```ts
import { message } from '@mrchar/cumquat';
message.success('保存成功');
message.error('提交失败'); // 默认 5s
message.loading('上传中…'); // duration 为 0，需手动 remove
const id = message.info('处理中', 0);
message.remove(id);
```

## 补充：逐条挂载目标

`message.push` 可通过 `target` 为单条消息指定 CSS 选择器或 DOM 元素。消息自身的 `target` 优先于 MessageContainer 的 `target`、最近的 `ConfigProvider` 和应用配置；选择器未命中时回退 `body`。

```ts
message.push('保存成功', { type: 'success', target: '#form-toasts' });
message.push('上传失败', { type: 'error', target: uploadRoot });
```

MessageContainer 按最终目标分组，每个目标只创建一个消息容器；目标变化时对应消息会迁移。相同文案和类型只有在同一 `target` 下才去重。
