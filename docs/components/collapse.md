---
title: Collapse 折叠面板
---

# Collapse 折叠面板

内容分节展开收起，支持手风琴模式。

[`CollapseItem`](/types/view/data-display#collapseitem) 结构：`{ key: string; title: string; content: string; disabled?: boolean }`。

| Prop              | 类型                  | 默认值  | 说明                                 |
| ----------------- | --------------------- | ------- | ------------------------------------ |
| items             | [`CollapseItem`](/types/view/data-display#collapseitem)`[]`      | `[]`    | 面板列表（绑定 fetch 时可省略）      |
| fetch             | [`FetchHandler`](/types/basics/core#fetchhandler)`<`[`CollapseItem`](/types/view/data-display#collapseitem)`>` | -       | 远程面板：挂载即请求，内置四态       |
| activeKeys        | `string[]`            | -       | 展开 key（受控，v-model:activeKeys） |
| defaultActiveKeys | `string[]`            | `[]`    | 非受控初始展开 key                   |
| accordion         | `boolean`             | `false` | 手风琴：同时至多展开一个             |

| 事件              | 参数             | 说明         |
| ----------------- | ---------------- | ------------ |
| update:activeKeys | `keys: string[]` | 展开集合更新 |
| change            | `keys: string[]` | 展开集合变化 |

```vue
<Collapse :items="faq" accordion />
<Collapse v-model:active-keys="openKeys" :items="sections" />
```

## 补充：订阅数据源

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| subscribe | [`SubscribeHandler`](/types/basics/core#subscribehandler)`<`[`CollapseItem`](/types/view/data-display#collapseitem)`[]>` | `undefined` | 订阅面板项；挂载时调用，优先于本地 `items` |

`subscribe` 与本地 `items` 同时存在时优先使用 `subscribe`；订阅失败时回退到 `items`。

## 交互演示

### 折叠面板

<CodeCard v-model:code="collapseCode" editable title="折叠面板">
  <LiveDemo :code="collapseCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const collapseItems = [
  { key: '1', title: '面板一', content: '面板一的内容。' },
  { key: '2', title: '面板二', content: '面板二的内容。' },
];

const collapseCode = ref(`
  <Collapse :items="collapseItems" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { collapseItems, collapseCode };
</script>
