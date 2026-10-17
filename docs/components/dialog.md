---
title: Dialog 对话框
---

# Dialog 对话框

模态弹层，承载确认、表单等临时交互。

| Prop         | 类型                    | 默认值    | 说明                       |
| ------------ | ----------------------- | --------- | -------------------------- |
| open         | `boolean`               | `false`   | 开合（v-model:open）       |
| title        | `string`                | `''`      | 标题                       |
| width        | `string`                | `'32rem'` | 面板最大宽度               |
| closable     | `boolean`               | `true`    | 显示关闭按钮               |
| maskClosable | `boolean`               | `true`    | 点击遮罩关闭               |
| escClosable  | `boolean`               | `true`    | ESC 关闭                   |
| lockScroll   | `boolean`               | `true`    | 锁定背景滚动               |
| appendTo     | `string \| HTMLElement` | -         | Teleport 目标（默认 body） |

| 事件        | 参数             | 说明     |
| ----------- | ---------------- | -------- |
| update:open | `value: boolean` | 开合更新 |
| open        | -                | 打开后   |
| close       | -                | 关闭后   |

| 插槽    | 说明         |
| ------- | ------------ |
| title   | 自定义标题区 |
| default | 主体内容     |
| footer  | 底部操作区   |

Expose：`open()` / `close()`。

```vue
<Dialog v-model:open="show" title="确认删除" width="24rem">
  <p>删除后不可恢复。</p>
  <template #footer>
    <Button @click="show = false">取消</Button>
    <Button type="primary" danger :action="doDelete">删除</Button>
  </template>
</Dialog>
```

## 交互演示

### 受控对话框

<CodeCard v-model:code="dialogCode" editable title="受控对话框">
  <LiveDemo :code="dialogCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const dialogOpen = ref(false);

const dialogCode = ref(`
  <Button type="primary" @click="dialogOpen = true">打开对话框</Button>
  <Dialog v-model:open="dialogOpen" title="确认操作">
    <p class="text-sm text-cumquat-text-muted">
      这是一段对话框内容，点击遮罩或取消按钮可关闭。
    </p>
    <div class="mt-5 flex justify-end gap-2">
      <Button @click="dialogOpen = false">取消</Button>
      <Button type="primary" @click="dialogOpen = false">确认</Button>
    </div>
  </Dialog>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { dialogOpen, dialogCode };
</script>

