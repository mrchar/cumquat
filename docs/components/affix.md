---
title: Affix 固钉
---

# Affix 固钉

滚动吸附定位。

| Prop      | 类型     | 默认值 | 说明                                         |
| --------- | -------- | ------ | -------------------------------------------- |
| top       | `number` | `0`    | 距视口顶部吸附距离（px）                     |
| left      | `number` | `0`    | 距视口左侧吸附距离（px）                     |
| offsetTop | `number` | -      | 滚动超过该偏移量后切换为 fixed（默认取 top） |
| zIndex    | `number` | `100`  | 层级                                         |

| 事件   | 参数             | 说明         |
| ------ | ---------------- | ------------ |
| change | `fixed: boolean` | 吸附状态变化 |

| 插槽    | 说明           |
| ------- | -------------- |
| default | 需要吸附的内容 |

```vue
<Affix :top="64"><Button type="primary">固定在顶部</Button></Affix>
```

## 交互演示

### 吸顶固钉

<CodeCard v-model:code="affixCode" editable title="吸顶固钉">
  <LiveDemo :code="affixCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const affixCode = ref(`
  <Affix :top="16">
    <div
      class="rounded-cumquat border border-cumquat-border bg-cumquat-surface-2 px-4 py-2 text-sm"
    >
      吸顶内容（滚动页面时吸附在顶部）
    </div>
  </Affix>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { affixCode };
</script>

