---
title: Slider 滑块
---

# Slider 滑块

单点 / 区间数值选择，支持刻度、键盘步进与轨道点击定位。

[`SliderMark`](/types/view/data-entry#slidermark) 结构：`{ value: number; label?: string }`。

| Prop       | 类型                          | 默认值  | 说明                                |
| ---------- | ----------------------------- | ------- | ----------------------------------- |
| modelValue | `number \| [number, number]`  | -       | 绑定值（v-model，range 时为二元组） |
| min        | `number`                      | `0`     | 最小值                              |
| max        | `number`                      | `100`   | 最大值                              |
| step       | `number`                      | `1`     | 步进                                |
| disabled   | `boolean`                     | `false` | 禁用                                |
| range      | `boolean`                     | `false` | 区间选择                            |
| marks      | `Array<number \| `[`SliderMark`](/types/view/data-entry#slidermark)`>` | `[]`    | 刻度（数值或对象）                  |
| showValue  | `boolean`                     | `true`  | 显示当前值文字                      |

| 事件              | 参数                 | 说明   |
| ----------------- | -------------------- | ------ |
| update:modelValue | `value: SliderValue` | 值更新 |
| change            | `value: SliderValue` | 值变化 |

```vue
<Slider v-model="volume" :min="0" :max="100" />
<Slider v-model="range" range :marks="[0, 25, 50, 75, 100]" />
```

---

## 补充：交互动作

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| action | [`ActionHandler`](/types/basics/core#actionhandler) | `undefined` | 交互动作；执行期间进入 pending/禁用状态，失败时 emit `actionError` |

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| actionError | `error: unknown` | 动作失败（reject 或返回值导出错误）时触发 |

动作失败时回退到原值，并 emit `actionError`。

## 交互演示

### 滑块取值

<CodeCard v-model:code="sliderCode" editable title="滑块取值">
  <LiveDemo :code="sliderCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const sliderValue = ref(40);

const sliderCode = ref(`
  <div class="flex flex-col gap-4">
    <Slider v-model="sliderValue" :min="0" :max="100" />
    <span class="text-sm text-cumquat-text-muted">当前值：{{ sliderValue }}</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { sliderValue, sliderCode };
</script>
