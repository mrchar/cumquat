---
title: Popover 气泡卡片
---

# Popover 气泡卡片

悬停 / 点击触发的轻量浮层。

| Prop       | 类型             | 默认值    | 说明                 |
| ---------- | ---------------- | --------- | -------------------- |
| title      | `string`         | `''`      | 标题                 |
| trigger    | `PopoverTrigger` | `'click'` | 触发方式             |
| placement  | `Placement`      | `'top'`   | 气泡位置             |
| open       | `boolean`        | -         | 开合（v-model:open） |
| openDelay  | `number`         | `100`     | 打开延迟（ms）       |
| closeDelay | `number`         | `100`     | 关闭延迟（ms）       |
| disabled   | `boolean`        | `false`   | 禁用                 |

| 事件        | 参数             | 说明     |
| ----------- | ---------------- | -------- |
| update:open | `value: boolean` | 开合更新 |

| 插槽    | 说明                                            |
| ------- | ----------------------------------------------- |
| trigger | 触发器内容（必填）                              |
| default | 气泡主体                                        |
| footer  | 底部操作区，slot props：`{ close: () => void }` |

Expose：`open()` / `close()` / `toggle()`。

```vue
<Popover title="筛选条件" trigger="click">
  <template #trigger><Button ghost>筛选</Button></template>
  <p>气泡内容</p>
  <template #footer="{ close }">
    <Button size="sm" @click="close">完成</Button>
  </template>
</Popover>
```

## 交互演示

### 气泡卡片

<CodeCard v-model:code="popoverCode" editable title="气泡卡片">
  <LiveDemo :code="popoverCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const popoverCode = ref(`
  <Popover title="气泡标题">
    <template #trigger>
      <Button>点击弹出</Button>
    </template>
    <p class="text-sm text-cumquat-text-muted">这里是气泡卡片的内容区域。</p>
  </Popover>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { popoverCode };
</script>
