---
title: Transfer 穿梭框
---

# Transfer 穿梭框

双栏数据搬移。

[`TransferItem`](/types/view/data-entry#transferitem) 结构：`{ key: string; label: string; disabled?: boolean }`。

| Prop       | 类型                  | 默认值                   | 说明                                                                                   |
| ---------- | --------------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| data       | [`TransferItem`](/types/view/data-entry#transferitem)`[]`      | `[]`                     | 全部数据（绑定 fetch 时可省略）                                                        |
| fetch      | [`FetchHandler`](/types/basics/core#fetchhandler)`<`[`TransferItem`](/types/view/data-entry#transferitem)`>` | -                        | 远程候选：挂载即请求，左侧搜索以 `query.keyword`（防抖 300ms）重取，远程模式不本地过滤 |
| modelValue | `string[]`            | -                        | 右栏（已选）key 列表（v-model）                                                        |
| titles     | `[string, string]`    | `['源列表', '目标列表']` | 两侧标题                                                                               |
| searchable | `boolean`             | `false`                  | 两侧搜索过滤                                                                           |

| 事件              | 参数                                           | 说明     |
| ----------------- | ---------------------------------------------- | -------- |
| update:modelValue | `keys: string[]`                               | 值更新   |
| change            | `keys: string[], direction: 'left' \| 'right'` | 搬移方向 |

```vue
<Transfer v-model="selected" :data="allUsers" searchable :titles="['可选', '已选']" />
```

## 补充：交互动作

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| action | [`ActionHandler`](/types/basics/core#actionhandler) | `undefined` | 交互动作；执行期间进入 pending/禁用状态，失败时 emit `actionError` |

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| actionError | `error: unknown` | 动作失败（reject 或返回值导出错误）时触发 |

动作失败时回退到原穿梭结果，并 emit `actionError`。

## 交互演示

### 穿梭框

<CodeCard v-model:code="transferCode" editable title="穿梭框">
  <LiveDemo :code="transferCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const transferTarget = ref<string[]>([]);

const transferData = [
  { key: '1', label: '条目一' },
  { key: '2', label: '条目二' },
  { key: '3', label: '条目三' },
];

const transferCode = ref(`
  <Transfer v-model="transferTarget" :data="transferData" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { transferTarget, transferData, transferCode };
</script>
