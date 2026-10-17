---
title: FloatButton 悬浮按钮
---

# FloatButton 悬浮按钮

页面悬浮操作入口，可展开动作组。

`FloatAction` 结构：`{ key: string; label: string; disabled?: boolean }`。

| Prop      | 类型              | 默认值  | 说明                   |
| --------- | ----------------- | ------- | ---------------------- |
| actions   | `FloatAction[]`   | `[]`    | 展开的动作列表         |
| open      | `boolean`         | -       | 展开态（v-model:open） |
| placement | `'top' \| 'left'` | `'top'` | 展开方向               |

| 事件        | 参数            | 说明         |
| ----------- | --------------- | ------------ |
| update:open | `open: boolean` | 展开态更新   |
| select      | `key: string`   | 选中某个动作 |

```vue
<FloatButton
  :actions="[
    { key: 'edit', label: '编辑' },
    { key: 'share', label: '分享' },
  ]"
  @select="onAction"
/>
```

## 交互演示

### 悬浮动作组

<CodeCard v-model:code="floatButtonCode" editable title="悬浮动作组">
  <LiveDemo :code="floatButtonCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const floatActions = [
  { key: 'edit', label: '编' },
  { key: 'share', label: '享' },
  { key: 'fav', label: '藏' },
];

const floatButtonCode = ref(`
  <div class="flex flex-col gap-2">
    <FloatButton :actions="floatActions" />
    <p class="text-sm text-cumquat-text-muted">点击主按钮展开动作组。</p>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { floatActions, floatButtonCode };
</script>
