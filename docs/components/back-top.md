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

## 补充：局部挂载

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| mount | `boolean` | `false` | 挂载到最近定位祖先（`position: absolute`）而非视口，用于局部滚动容器 |

开启 `mount` 时，滚动监听仍读取窗口滚动；局部容器场景需确保祖先元素已建立定位上下文。

## 交互演示

### 回到顶部

<CodeCard v-model:code="backTopCode" editable title="回到顶部">
  <LiveDemo :code="backTopCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const backTopCode = ref(`
  <div class="relative h-40 rounded-md border border-dashed border-cumquat-border p-4">
    <BackTop mount :right="16" :bottom="16" />
    <span class="text-sm text-cumquat-text-muted">按钮挂载在当前演示区域，点击后返回页面顶部。</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { backTopCode };
</script>
