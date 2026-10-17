---
title: Steps 步骤条
---

# Steps 步骤条

分步流程引导。

`StepItem` 结构：`{ key: string; title: string; description?: string; status?: 'done' | 'active' | 'error'; disabled?: boolean }`。

| Prop       | 类型         | 默认值 | 说明                      |
| ---------- | ------------ | ------ | ------------------------- |
| steps      | `StepItem[]` | `[]`   | 步骤列表                  |
| current    | `number`     | `0`    | 当前步骤索引（从 0 开始） |
| changeable | `boolean`    | `true` | 允许点击已到达的步骤跳转  |

| 事件           | 参数            | 说明         |
| -------------- | --------------- | ------------ |
| update:current | `index: number` | 当前步骤更新 |
| change         | `index: number` | 步骤变化     |

Expose：`next()` / `prev()` / `goTo(index)`。

```vue
<Steps :steps="steps" :current="current" @change="current = $event" />
<Button @click="stepsRef.next()">下一步</Button>
```

## 交互演示

### 步骤导航

<CodeCard v-model:code="stepsCode" editable title="步骤导航">
  <LiveDemo :code="stepsCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const currentStep = ref(1);

const stepItems = [
  { key: '1', title: '填写信息' },
  { key: '2', title: '确认订单' },
  { key: '3', title: '完成支付' },
];

const stepsCode = ref(`
  <div class="flex flex-col gap-4">
    <Steps :current="currentStep" :steps="stepItems" />
    <div class="flex gap-2">
      <Button size="sm" :disabled="currentStep <= 0" @click="currentStep--">上一步</Button>
      <Button
        size="sm"
        type="primary"
        :disabled="currentStep >= stepItems.length - 1"
        @click="currentStep++"
      >
        下一步
      </Button>
    </div>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { currentStep, stepItems, stepsCode };
</script>
