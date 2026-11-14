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
| size         | `string`                                 | `'24rem'` | 滑出轴尺寸（左右为宽，上下为高） |
| width        | `string`                                 | -         | 面板宽度；左右滑出缺省取 `size`，上下滑出缺省铺满 |
| height       | `string`                                 | -         | 面板高度；上下滑出缺省取 `size`，左右滑出缺省铺满 |
| align        | `'start' \| 'center' \| 'end'`           | `'center'` | 非滑出轴对齐：上下滑出控制水平位置，左右滑出控制垂直位置 |
| closable     | `boolean`                                | `true`    | 显示关闭按钮                   |
| maskClosable | `boolean`                                | `true`    | 点击遮罩关闭                   |
| escClosable  | `boolean`                                | `true`    | ESC 关闭                       |
| lockScroll   | `boolean`                                | `true`    | 锁定背景滚动                   |
| appendTo     | [`MountTarget`](/types/basics/overlay#mounttarget)                            | -         | Teleport 目标；继承配置，最终回退 body |

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

## 尺寸与位置

`size` 只决定滑出轴（左右滑出为宽度、上下滑出为高度），另一轴用 `width` / `height` 单独指定；`align` 决定面板在屏幕非滑出轴上的位置，`start` 贴起始边、`center` 居中、`end` 贴结束边。

```vue
<!-- 底部滑出：高 40vh，宽 32rem，靠右对齐 -->
<Drawer v-model:open="show" direction="bottom" size="40vh" width="32rem" align="end">
  …
</Drawer>

<!-- 右侧滑出：宽 24rem，高 60vh，垂直居中 -->
<Drawer v-model:open="show" direction="right" height="60vh" align="center">
  …
</Drawer>
```

## 补充：异步确认

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| action | [`ActionHandler`](/types/basics/core#actionhandler) | `undefined` | 确认动作；失败时保持打开并展示错误条 |
| confirmText | `string` | `'确认'` | 默认确认按钮文案 |
| cancelText | `string` | `'取消'` | 默认取消按钮文案 |
| errorText | `string` | `undefined` | 动作失败时的回退文案 |

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| confirm | - | 动作成功后触发 |
| cancel | - | 点击默认取消按钮时触发 |
| actionError | `error: unknown` | 动作失败时触发 |

未提供 `footer` 插槽且配置了 `action` 时，组件渲染默认底部按钮；失败时不会关闭，错误文案按 `error.message → errorText` 回退。

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
