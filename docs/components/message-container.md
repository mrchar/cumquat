---
title: MessageContainer 消息容器
---

# MessageContainer 消息容器

命令式消息服务的全局渲染层，在应用根部挂载一次即可。

| Prop | 类型         | 默认值             | 说明                                |
| ---- | ------------ | ------------------ | ----------------------------------- |
| api  | `MessageApi` | 全局单例 `message` | 可传入自建服务（`createMessage()`） |

```vue
<!-- App.vue -->
<MessageContainer />
```

```ts
import { message } from '@mrchar/cumquat/composables';
message.success('保存成功');
message.error('提交失败'); // 默认 5s
message.loading('上传中…'); // duration 为 0，需手动 remove
const id = message.info('处理中', 0);
message.remove(id);
```
