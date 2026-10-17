---
title: BackTop 回到顶部
---

# BackTop 回到顶部

长页面快速回顶。

| Prop             | 类型      | 默认值 | 说明                         |
| ---------------- | --------- | ------ | ---------------------------- |
| visible          | `boolean` | `true` | 是否启用                     |
| visibilityHeight | `number`  | `0`    | 滚动超过该高度（px）才出现   |
| right            | `number`  | `32`   | 距视口右侧（px）             |
| bottom           | `number`  | `32`   | 距视口底部（px）             |
| duration         | `number`  | `300`  | 回顶动画时长（ms），0 为瞬时 |

| 事件  | 参数 | 说明     |
| ----- | ---- | -------- |
| click | -    | 点击回顶 |

```vue
<BackTop :visibility-height="200" />
```

## 交互演示

### 回到顶部

<CodeCard v-model:code="backTopCode" editable title="回到顶部">
  <LiveDemo :code="backTopCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const backTopCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <BackTop />
    <span class="text-sm text-cumquat-text-muted">点击按钮返回页面顶部。</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { backTopCode };
</script>

