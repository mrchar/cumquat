---
title: TreeSelect 树选择
---

# TreeSelect 树选择

树形结构的选择器，叶子可选、回显完整路径。

`TreeSelectNode` 结构：`{ key: string; label: string; disabled?: boolean; children?: TreeSelectNode[] }`。

| Prop             | 类型               | 默认值     | 说明                             |
| ---------------- | ------------------ | ---------- | -------------------------------- |
| nodes            | `TreeSelectNode[]` | `[]`       | 树数据                           |
| modelValue       | `string \| null`   | -          | 选中叶子 key（v-model）          |
| placeholder      | `string`           | `'请选择'` | 占位文本                         |
| disabled         | `boolean`          | `false`    | 禁用                             |
| filterable       | `boolean`          | `false`    | 可搜索（过滤并自动展开命中路径） |
| defaultExpandAll | `boolean`          | `false`    | 默认展开全部父节点               |
| fetch            | `Fetch<TreeSelectNode>` | -      | 远程树：展开节点时以 `query.filters.parentKey` 请求子级，自动懒加载与四态 |

| 事件              | 参数                    | 说明   |
| ----------------- | ----------------------- | ------ |
| update:modelValue | `value: string \| null` | 值更新 |
| change            | `value: string \| null` | 值变化 |

```vue
<TreeSelect v-model="dept" :nodes="deptTree" filterable default-expand-all />
```

## 交互演示

### 树形选择

<CodeCard v-model:code="treeSelectCode" editable title="树形选择">
  <LiveDemo :code="treeSelectCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const treeSelectValue = ref<string | null>(null);

const treeNodes = [
  {
    key: 'p1',
    label: '父节点一',
    children: [
      { key: 'c1', label: '子节点一' },
      { key: 'c2', label: '子节点二' },
    ],
  },
  { key: 'p2', label: '父节点二' },
];

const treeSelectCode = ref(`
  <TreeSelect v-model="treeSelectValue" :nodes="treeNodes" class="w-56" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { treeSelectValue, treeNodes, treeSelectCode };
</script>

