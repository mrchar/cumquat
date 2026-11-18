---
title: Message 全局提示
---

# Message 全局提示

轻量反馈浮层，有两种用法：

- **声明式**：`<Message>` 渲染单条提示，由 `v-model:visible` 控制显隐，适合页面内固定位置。
- **命令式**：在应用根部挂载一次 `<MessageContainer />`，之后调用 `message.success()` 等方法即可从队列堆叠展示，自动关闭。

## 声明式单条（Message）

| Prop     | 类型                                                                   | 默认值   | 说明                      |
| -------- | ---------------------------------------------------------------------- | -------- | ------------------------- |
| type     | `'info' \| 'success' \| 'warning' \| 'danger' \| 'error' \| 'loading'` | `'info'` | 语义类型                  |
| closable | `boolean`                                                              | `false`  | 显示关闭按钮              |
| visible  | `boolean`                                                              | -        | 可见性（v-model:visible） |

| 事件           | 参数             | 说明     |
| -------------- | ---------------- | -------- |
| update:visible | `value: boolean` | 显隐更新 |
| close          | -                | 关闭     |

| 插槽    | 说明     |
| ------- | -------- |
| default | 消息内容 |

```vue
<Message v-model:visible="showTip" type="success" closable>保存成功</Message>
```

## 命令式调用（MessageContainer）

| Prop   | 类型                                        | 默认值           | 说明                                     |
| ------ | ------------------------------------------- | ---------------- | ---------------------------------------- |
| api    | `MessageApi`                                | 全局单例 `message` | 可传入 `createMessage()` 自建的队列    |
| target | [`MountTarget`](/types/basics/overlay#mounttarget) | -        | 默认 Teleport 目标，消息自身的 target 优先 |

```vue
<!-- App.vue：全局挂载一次 -->
<MessageContainer />
```

```ts
import { message } from '@mrchar/cumquat';

message.success('保存成功');
message.warning('配额即将用尽');
message.error('导入失败，请重试', 5000);
```

不挂载 Container 时命令式调用只会入队、不渲染，因此它属于应用级基础设施，页面级单条提示请直接用 `<Message>`。

## 交互演示

### 消息类型

<CodeCard v-model:code="messageCode" editable title="消息类型">
  <LiveDemo :code="messageCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const messageVisible = ref(true);

const messageCode = ref(`
  <Message type="info">这是一条信息提示</Message>
  <Message type="success">保存成功</Message>
  <Message type="warning">磁盘空间不足</Message>
  <Message type="danger">网络连接失败</Message>
  <div class="flex items-center gap-3">
    <Message v-model="messageVisible" type="success" closable>可关闭提示</Message>
    <Button size="sm" @click="messageVisible = true">重新显示</Button>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { messageVisible, messageCode };
</script>
