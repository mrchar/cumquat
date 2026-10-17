---
title: Collapse 折叠面板
---

# Collapse 折叠面板

内容分节展开收起，支持手风琴模式。

`CollapseItem` 结构：`{ key: string; title: string; content: string; disabled?: boolean }`。

| Prop              | 类型                  | 默认值  | 说明                                 |
| ----------------- | --------------------- | ------- | ------------------------------------ |
| items             | `CollapseItem[]`      | `[]`    | 面板列表（绑定 fetch 时可省略）      |
| fetch             | `Fetch<CollapseItem>` | -       | 远程面板：挂载即请求，内置四态       |
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
