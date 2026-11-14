---
title: Tree 树形控件
---

# Tree 树形控件

层级数据展示与勾选，含半选传播；绑定 `fetch` 后为远程懒加载树。

[`TreeNode`](/types/view/data-entry#treenode) 结构：`{ key: string; label: string; disabled?: boolean; leaf?: boolean; children?: `[`TreeNode`](/types/view/data-entry#treenode)`[] }`（远程模式用 `leaf: true` 标记叶子，避免空节点显示展开箭头）。

| Prop             | 类型              | 默认值  | 说明                                                                         |
| ---------------- | ----------------- | ------- | ---------------------------------------------------------------------------- |
| nodes            | [`TreeNode`](/types/view/data-entry#treenode)`[]`      | -       | 树数据（绑定 fetch 时可省略）                                                |
| fetch            | [`FetchHandler`](/types/basics/core#fetchhandler)`<`[`TreeNode`](/types/view/data-entry#treenode)`>` | -       | 远程树资源工厂：展开时以 `query.filters.parentKey` 调 `execute` 请求子级并挂回，内置加载/失败重试 |
| checkable        | `boolean`         | `false` | 显示勾选框                                                                   |
| defaultExpandAll | `boolean`         | `false` | 默认展开全部父节点                                                           |
| checked          | `string[]`        | -       | 受控勾选集合（保存被点选节点自身 key）                                       |

| 事件           | 参数                                    | 说明          |
| -------------- | --------------------------------------- | ------------- |
| update:checked | `keys: string[]`                        | 勾选集合更新  |
| check          | `keys: string[]`                        | 勾选变化      |
| expand         | `{ node: `[`TreeNode`](/types/view/data-entry#treenode)`, expanded: boolean }` | 节点展开/收起 |
| node-click     | `node: `[`TreeNode`](/types/view/data-entry#treenode)                        | 点击节点      |

```vue
<Tree :nodes="orgTree" checkable default-expand-all v-model:checked="checkedKeys" />
```

## 补充：订阅与交互动作

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| subscribe | [`SubscribeHandler`](/types/basics/core#subscribehandler)`<`[`TreeNode`](/types/view/data-entry#treenode)`[]>` | `undefined` | 订阅完整树数据；挂载时调用，优先于 `fetch` / `nodes` |
| action | [`ActionHandler`](/types/basics/core#actionhandler) | `undefined` | 交互动作；执行期间进入 pending/禁用状态，失败时回退并 emit `actionError` |

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| actionError | `error: unknown` | 动作失败（reject 或返回值导出错误）时触发 |

优先级：`subscribe > fetch > 本地数据`。动作失败时回退到原勾选结果；`T` 为树节点类型。

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

import type { FetchHandler, ResolvedFetchQuery, Status } from '@mrchar/cumquat';

/** 演示用：把 execute 函数体包装为符合协议的 FetchHandler 资源工厂 */
function makeFetch<T>(run: (query: ResolvedFetchQuery) => T | Promise<T>): FetchHandler<T> {
  return () => {
    const status = ref<Status>('idle');
    const data = ref<T>();
    const error = ref<unknown>();
    const message = ref<string>();
    return {
      status,
      data,
      error,
      message,
      async execute(query: ResolvedFetchQuery) {
        status.value = 'pending';
        try {
          data.value = await run(query);
          status.value = 'success';
        } catch (err) {
          error.value = err;
          message.value = err instanceof Error ? err.message : String(err);
          status.value = 'error';
        }
      },
      abort() {},
    };
  };
}

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

const fetchOrg = makeFetch<OrgNode>(async (query) => {
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
});

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
