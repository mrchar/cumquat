---
title: Breadcrumb 面包屑
---

# Breadcrumb 面包屑

层级路径导航。

`BreadcrumbItem` 结构：`{ label: string; href?: string }`。

| Prop  | 类型               | 默认值 | 说明     |
| ----- | ------------------ | ------ | -------- |
| items | `BreadcrumbItem[]` | `[]`   | 路径列表 |

```vue
<Breadcrumb
  :items="[{ label: '首页', href: '/' }, { label: '订单', href: '/orders' }, { label: '详情' }]"
/>
```

## 交互演示

### 基础面包屑

<CodeCard v-model:code="breadcrumbCode" editable title="基础面包屑">
  <LiveDemo :code="breadcrumbCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const breadcrumbItems = [
  { label: '首页', href: '#breadcrumb' },
  { label: '组件', href: '#breadcrumb' },
  { label: '面包屑' },
];

const breadcrumbCode = ref(`
  <Breadcrumb :items="breadcrumbItems" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { breadcrumbItems, breadcrumbCode };
</script>
