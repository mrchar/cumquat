---
title: Icon 图标
---

# Icon 图标

内联 SVG 图标容器，是其他组件的基础依赖。无 props / 事件。

| 插槽    | 说明             |
| ------- | ---------------- |
| default | SVG 图标路径内容 |

```vue
<Icon>
  <path d="m5 13 4 4L19 7" />
</Icon>
```

## 交互演示

### 内置路径与语义色

<CodeCard v-model:code="iconCode" editable title="内置路径与语义色">
  <LiveDemo :code="iconCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const text = ref('');

const iconCode = ref(`
  <div class="flex flex-wrap items-center gap-4">
    <Icon class="size-5 text-cumquat-warning">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2l-5-4.9 6.9-1z" />
    </Icon>
    <Icon class="size-5 text-cumquat-accent">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4m0 4h.01" />
    </Icon>
    <Icon class="size-5 text-cumquat-danger">
      <path
        d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
      />
    </Icon>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { text, iconCode };
</script>
