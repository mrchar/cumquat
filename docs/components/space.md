---
title: Space 间距
---

# Space 间距

子项间距容器。

| Prop      | 类型                         | 默认值         | 说明     |
| --------- | ---------------------------- | -------------- | -------- |
| direction | `'horizontal' \| 'vertical'` | `'horizontal'` | 排列方向 |
| size      | `'sm' \| 'md' \| 'lg'`       | `'md'`         | 间距尺寸 |
| wrap      | `boolean`                    | `false`        | 子项换行 |

| 插槽    | 说明       |
| ------- | ---------- |
| default | 排列的子项 |

```vue
<Space size="sm" wrap>
  <Button>保存</Button>
  <Button ghost>取消</Button>
</Space>
```

---

## 交互演示

### 间距排列

<CodeCard v-model:code="spaceCode" editable title="间距排列">
  <LiveDemo :code="spaceCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const spaceCode = ref(`
  <Space>
    <Button>按钮一</Button>
    <Button>按钮二</Button>
    <Button>按钮三</Button>
  </Space>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { spaceCode };
</script>

