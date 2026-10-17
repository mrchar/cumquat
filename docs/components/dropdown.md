---
title: Dropdown 下拉菜单
---

# Dropdown 下拉菜单

悬停 / 点击触发的操作菜单。

`DropdownItem` 结构：`{ key: string; label: string; disabled?: boolean; divider?: boolean }`，`divider: true` 渲染为分隔线。

| Prop      | 类型             | 默认值           | 说明                              |
| --------- | ---------------- | ---------------- | --------------------------------- |
| items     | `DropdownItem[]` | `[]`             | 数据驱动菜单项；不传时用默认插槽  |
| trigger   | `PopoverTrigger` | `'click'`        | 触发方式（click / hover / focus） |
| placement | `Placement`      | `'bottom-start'` | 菜单位置                          |
| open      | `boolean`        | -                | 开合（v-model:open）              |
| disabled  | `boolean`        | `false`          | 禁用                              |

| 事件        | 参数                 | 说明       |
| ----------- | -------------------- | ---------- |
| update:open | `value: boolean`     | 开合更新   |
| select      | `item: DropdownItem` | 选中菜单项 |

| 插槽    | 说明                          |
| ------- | ----------------------------- |
| trigger | 触发器内容（必填）            |
| default | 自定义菜单内容（无 items 时） |

Expose：`open()` / `close()` / `toggle()`。

```vue
<Dropdown :items="menuItems" @select="onSelect">
  <template #trigger><Button>更多操作</Button></template>
</Dropdown>
```

## 交互演示

### 下拉菜单

<CodeCard v-model:code="dropdownCode" editable title="下拉菜单">
  <LiveDemo :code="dropdownCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const dropdownCode = ref(`
  <Dropdown>
    <template #trigger>
      <Button>操作菜单</Button>
    </template>
    <div class="flex flex-col py-1 text-sm">
      <span class="cursor-pointer px-4 py-1.5 transition-colors hover:bg-cumquat-surface-2"
        >编辑</span
      >
      <span class="cursor-pointer px-4 py-1.5 transition-colors hover:bg-cumquat-surface-2"
        >复制</span
      >
      <span
        class="cursor-pointer px-4 py-1.5 text-cumquat-danger transition-colors hover:bg-cumquat-danger-soft"
        >删除</span
      >
    </div>
  </Dropdown>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { dropdownCode };
</script>

