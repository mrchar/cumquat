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

## 补充：订阅数据源

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| subscribe | [`SubscribeHandler`](/types/basics/core#subscribehandler)`<string>` | `undefined` | 订阅二维码内容；挂载时调用，优先于 `value` |
| errorText | `string` | `undefined` | 订阅失败时的错误文案；未提供时使用组件内建兜底 |

`subscribe` 与本地 `value` 同时存在时优先使用订阅结果；订阅失败时内容回退到 `value`，并在提供 `errorText` 时额外展示错误条。

## 交互演示

### 二维码

<CodeCard v-model:code="qrCode" editable title="二维码">
  <LiveDemo :code="qrCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const qrCode = ref(`
  <QRCode value="https://mock.test" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { qrCode };
</script>
