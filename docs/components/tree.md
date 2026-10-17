---
title: Tree 树形控件
---

# Tree 树形控件

层级数据展示与勾选，含半选传播；绑定 `fetch` 后为远程懒加载树。

`TreeNode` 结构：`{ key: string; label: string; disabled?: boolean; leaf?: boolean; children?: TreeNode[] }`（远程模式用 `leaf: true` 标记叶子，避免空节点显示展开箭头）。

| Prop             | 类型              | 默认值  | 说明                                                                         |
| ---------------- | ----------------- | ------- | ---------------------------------------------------------------------------- |
| nodes            | `TreeNode[]`      | -       | 树数据（绑定 fetch 时可省略）                                                |
| fetch            | `Fetch<TreeNode>` | -       | 远程树：展开时以 `query.filters.parentKey` 请求子级并挂回，内置加载/失败重试 |
| checkable        | `boolean`         | `false` | 显示勾选框                                                                   |
| defaultExpandAll | `boolean`         | `false` | 默认展开全部父节点                                                           |
| checked          | `string[]`        | -       | 受控勾选集合（保存被点选节点自身 key）                                       |

| 事件           | 参数                                    | 说明          |
| -------------- | --------------------------------------- | ------------- |
| update:checked | `keys: string[]`                        | 勾选集合更新  |
| check          | `keys: string[]`                        | 勾选变化      |
| expand         | `{ node: TreeNode, expanded: boolean }` | 节点展开/收起 |
| node-click     | `node: TreeNode`                        | 点击节点      |

```vue
<Tree :nodes="orgTree" checkable default-expand-all v-model:checked="checkedKeys" />
```

## 交互演示

### 勾选与展开

<CodeCard v-model:code="treeCode" editable title="勾选与展开">
  <LiveDemo :code="treeCode" :scope="demoScope" />
</CodeCard>

### 懒加载树（fetch）

<CodeCard v-model:code="remoteTreeCode" editable title="懒加载树（fetch）">
  <LiveDemo :code="remoteTreeCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

import type { Fetch, FetchQuery } from '@cumquat/components';

const treeChecked = ref<string[]>([]);

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface OrgNode {
  key: string;
  label: string;
  leaf?: boolean;
  children?: OrgNode[];
}

const fetchOrg: Fetch<OrgNode> = async (query: FetchQuery) => {
  await delay(400);
  const parentKey = (query.filters as { parentKey?: string } | undefined)?.parentKey;
  if (!parentKey) {
    // 根层：研发中心可继续展开，市场中心为叶子
    return [
      { key: 'rd', label: '研发中心' },
      { key: 'mk', label: '市场中心', leaf: true },
    ];
  }
  return [1, 2, 3].map((i) => ({
    key: `${parentKey}-${i}`,
    label: `${parentKey === 'rd' ? '研发' : '市场'}小组 ${i}`,
    leaf: true,
  }));
};

const remoteTreeCode = ref(`
  <Tree :fetch="fetchOrg" />
`);

const treeCode = ref(`
  <div class="flex flex-wrap items-start gap-6">
    <Tree
      v-model:checked="treeChecked"
      :nodes="treeNodes"
      :default-expand-all="true"
      :checkable="true"
    />
    <span class="text-sm text-cumquat-text-muted"
      >勾选：{{ treeChecked.join('、') || '（无）' }}</span
    >
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { treeChecked, treeNodes, delay, fetchOrg, remoteTreeCode, treeCode };
</script>
