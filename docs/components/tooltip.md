---
title: Tooltip 文字提示
---

# Tooltip 文字提示

悬停提示。

| Prop       | 类型        | 默认值  | 说明           |
| ---------- | ----------- | ------- | -------------- |
| content    | `string`    | `''`    | 提示文本       |
| placement  | `Placement` | `'top'` | 气泡位置       |
| openDelay  | `number`    | `0`     | 打开延迟（ms） |
| closeDelay | `number`    | `0`     | 关闭延迟（ms） |
| disabled   | `boolean`   | `false` | 禁用           |

| 插槽    | 说明                                    |
| ------- | --------------------------------------- |
| default | 触发器内容（必填）                      |
| content | 自定义提示内容（缺省显示 content prop） |

```vue
<Tooltip content="复制到剪贴板"><Button ghost>复制</Button></Tooltip>
```

---

## 交互演示

### 文字提示

<CodeCard v-model:code="tooltipCode" editable title="文字提示">
  <LiveDemo :code="tooltipCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const tooltipCode = ref(`
  <Tooltip content="悬停时显示提示文字">
    <Button>悬停查看</Button>
  </Tooltip>
  <Tooltip content="顶部提示">
    <span class="cursor-help border-b border-dashed border-cumquat-border-strong text-sm"
      >文字锚点</span
    >
  </Tooltip>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { tooltipCode };
</script>

