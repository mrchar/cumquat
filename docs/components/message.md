---
title: Message 全局提示
---

# Message 全局提示

轻量反馈浮层。声明式单条渲染，也可配合 MessageContainer 命令式调用。

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

