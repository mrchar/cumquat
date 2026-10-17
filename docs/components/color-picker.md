---
title: ColorPicker 颜色选择器
---

# ColorPicker 颜色选择器

色板与透明度选择，支持预设色与 Hex 输入。

| Prop       | 类型       | 默认值      | 说明                   |
| ---------- | ---------- | ----------- | ---------------------- |
| modelValue | `string`   | `'#4f46e5'` | 颜色值（v-model，Hex） |
| presets    | `string[]` | 内置 10 色  | 预设色板               |
| disabled   | `boolean`  | `false`     | 禁用                   |
| showAlpha  | `boolean`  | `false`     | 显示透明度滑块         |

| 事件              | 参数            | 说明     |
| ----------------- | --------------- | -------- |
| update:modelValue | `color: string` | 颜色更新 |
| change            | `color: string` | 颜色变化 |

```vue
<ColorPicker v-model="themeColor" show-alpha :presets="brandColors" />
```

## 交互演示

### 颜色选择

<CodeCard v-model:code="colorPickerCode" editable title="颜色选择">
  <LiveDemo :code="colorPickerCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const colorValue = ref('#4f46e5');

const colorPickerCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <ColorPicker v-model="colorValue" />
    <span class="text-sm text-cumquat-text-muted">当前颜色：{{ colorValue }}</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { colorValue, colorPickerCode };
</script>

