---
title: Drawer 抽屉
---

# Drawer 抽屉

侧边滑出面板。

| Prop         | 类型                                     | 默认值    | 说明                           |
| ------------ | ---------------------------------------- | --------- | ------------------------------ |
| open         | `boolean`                                | `false`   | 开合（v-model:open）           |
| title        | `string`                                 | `''`      | 标题                           |
| direction    | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | 滑出方向                       |
| size         | `string`                                 | `'24rem'` | 面板尺寸（左右为宽，上下为高） |
| closable     | `boolean`                                | `true`    | 显示关闭按钮                   |
| maskClosable | `boolean`                                | `true`    | 点击遮罩关闭                   |
| escClosable  | `boolean`                                | `true`    | ESC 关闭                       |
| lockScroll   | `boolean`                                | `true`    | 锁定背景滚动                   |
| appendTo     | `string \| HTMLElement`                  | -         | Teleport 目标                  |

| 事件        | 参数             | 说明     |
| ----------- | ---------------- | -------- |
| update:open | `value: boolean` | 开合更新 |
| open        | -                | 打开后   |
| close       | -                | 关闭后   |

| 插槽    | 说明       |
| ------- | ---------- |
| default | 主体内容   |
| footer  | 底部操作区 |

Expose：`open()` / `close()`。

```vue
<Drawer v-model:open="show" title="编辑资料" direction="right" size="20rem">
  <Form v-model="profile">…</Form>
</Drawer>
```

## 交互演示

### 侧边抽屉

<CodeCard v-model:code="drawerCode" editable title="侧边抽屉">
  <LiveDemo :code="drawerCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const drawerOpen = ref(false);

const drawerCode = ref(`
  <Button type="primary" @click="drawerOpen = true">打开抽屉</Button>
  <Drawer v-model:open="drawerOpen" title="侧边抽屉">
    <p class="text-sm text-cumquat-text-muted">抽屉内容区，点击关闭按钮或遮罩可收起。</p>
  </Drawer>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { drawerOpen, drawerCode };
</script>
