---
title: QRCode 二维码
---

# QRCode 二维码

二维码点阵渲染（结构对齐的演示矩阵，非可扫码真实编码）。

| Prop       | 类型                       | 默认值          | 说明                             |
| ---------- | -------------------------- | --------------- | -------------------------------- |
| value      | `string`                   | -               | 内容文本（必填）                 |
| size       | `number`                   | `21`            | 格子规模（奇数，保证定位角对齐） |
| level      | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'`           | 容错等级（影响数据区填充密度）   |
| color      | `string`                   | `'#171717'`     | 前景色                           |
| background | `string`                   | `'transparent'` | 背景色                           |

```vue
<QRCode value="https://example.com/invite/42" :size="25" />
```

## 交互演示

### 二维码

<CodeCard v-model:code="qrCode" editable title="二维码">
  <LiveDemo :code="qrCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const qrCode = ref(`
  <QRCode value="https://cumquat.dev" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { qrCode };
</script>

