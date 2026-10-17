---
title: Anchor 锚点
---

# Anchor 锚点

页内锚点导航，滚动监听自动高亮。

`AnchorItem` 结构：`{ href: string; label: string }`。

| Prop           | 类型           | 默认值 | 说明                           |
| -------------- | -------------- | ------ | ------------------------------ |
| items          | `AnchorItem[]` | `[]`   | 锚点列表                       |
| active         | `string`       | -      | 受控激活锚点（v-model:active） |
| offset         | `number`       | `0`    | 命中判定的顶部偏移（px）       |
| scrollIntoView | `boolean`      | `true` | 点击时平滑滚动到目标           |

| 事件          | 参数               | 说明         |
| ------------- | ------------------ | ------------ |
| update:active | `href: string`     | 激活锚点更新 |
| change        | `href: string`     | 激活变化     |
| click         | `item: AnchorItem` | 点击锚点     |

```vue
<Anchor
  :items="[
    { href: '#basic', label: '基本信息' },
    { href: '#advance', label: '高级设置' },
  ]"
  :offset="64"
/>
```

## 交互演示

### 锚点导航

<CodeCard v-model:code="anchorCode" editable title="锚点导航">
  <LiveDemo :code="anchorCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const anchorItems = [
  { href: '#breadcrumb', label: 'Breadcrumb' },
  { href: '#menu', label: 'Menu' },
  { href: '#calendar', label: 'Calendar' },
];

const anchorCode = ref(`
  <Anchor :items="anchorItems" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { anchorItems, anchorCode };
</script>
