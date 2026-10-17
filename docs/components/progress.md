---
title: Progress 进度条
---

# Progress 进度条

线形 / 环形进度展示，满格自动转 success。

| Prop        | 类型                                             | 默认值     | 说明             |
| ----------- | ------------------------------------------------ | ---------- | ---------------- |
| value       | `number`                                         | `0`        | 进度 0-100       |
| status      | `'normal' \| 'success' \| 'warning' \| 'danger'` | `'normal'` | 状态             |
| type        | `'line' \| 'circle'`                             | `'line'`   | 形态             |
| showText    | `boolean`                                        | `true`     | 显示百分比       |
| size        | `number`                                         | `80`       | 环形直径（px）   |
| strokeWidth | `number`                                         | `6`        | 环描边宽度（px） |
| lineHeight  | `number`                                         | `8`        | 条形高度（px）   |

```vue
<Progress :value="60" />
<Progress type="circle" :value="100" />
```

## 交互演示

### 进度条

<CodeCard v-model:code="progressCode" editable title="进度条">
  <LiveDemo :code="progressCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const progressCode = ref(`
  <div class="flex flex-col gap-3">
    <Progress :value="30" />
    <Progress :value="66" />
    <Progress :value="100" />
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { progressCode };
</script>

