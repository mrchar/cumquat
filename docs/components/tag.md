---
title: Tag 标签
---

# Tag 标签

状态标记，可关闭。

| Prop       | 类型                                                           | 默认值      | 说明                |
| ---------- | -------------------------------------------------------------- | ----------- | ------------------- |
| type       | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` | `'default'` | 语义类型            |
| closable   | `boolean`                                                      | `false`     | 可关闭              |
| modelValue | `boolean`                                                      | -           | 显隐绑定（v-model） |

| 事件              | 参数             | 说明         |
| ----------------- | ---------------- | ------------ |
| update:modelValue | `value: boolean` | 显隐更新     |
| close             | -                | 点击关闭按钮 |

| 插槽    | 说明     |
| ------- | -------- |
| default | 标签内容 |

```vue
<Tag type="success">已完成</Tag>
<Tag v-model="visible" closable type="primary">可关闭</Tag>
```

## 交互演示

### 语义类型与可关闭

<CodeCard v-model:code="tagCode" editable title="语义类型与可关闭">
  <LiveDemo :code="tagCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const tagVisible = ref(true);

const tagCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Tag>默认标签</Tag>
    <Tag type="success">成功</Tag>
    <Tag type="warning">警告</Tag>
    <Tag type="danger">危险</Tag>
    <Tag v-model="tagVisible" closable>可关闭</Tag>
    <Button v-if="!tagVisible" size="sm" @click="tagVisible = true">恢复标签</Button>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { tagVisible, tagCode };
</script>

