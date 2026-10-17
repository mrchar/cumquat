---
title: Tabs 标签页
---

# Tabs 标签页

平级内容切换，支持增减页签与懒渲染。

`TabItem` 结构：`{ key: string; label: string; disabled?: boolean; closable?: boolean }`。

| Prop       | 类型        | 默认值  | 说明                                            |
| ---------- | ----------- | ------- | ----------------------------------------------- |
| tabs       | `TabItem[]` | `[]`    | 页签列表（绑定 fetch 时可省略）                  |
| fetch      | `Fetch<TabItem>` | -  | 远程页签：挂载即请求，数据就绪后自动激活首个可用页签 |
| modelValue | `string`    | -       | 激活 key（v-model）                             |
| editable   | `boolean`   | `false` | 允许增减页签（触发 add/remove，数据由外层维护） |
| addText    | `string`    | `'+'`   | 新增按钮文案                                    |
| lazy       | `boolean`   | `true`  | 面板懒渲染（首次激活后才挂载）                  |

| 事件              | 参数           | 说明          |
| ----------------- | -------------- | ------------- |
| update:modelValue | `key: string`  | 激活 key 更新 |
| change            | `key: string`  | 切换          |
| add               | -              | 点击新增      |
| remove            | `tab: TabItem` | 关闭页签      |

| 插槽    | 说明                                         |
| ------- | -------------------------------------------- |
| default | 面板内容区，slot props：`{ active: string }` |

```vue
<Tabs v-model="tab" :tabs="tabs">
  <div v-if="tab === 'a'">面板 A</div>
  <div v-else-if="tab === 'b'">面板 B</div>
</Tabs>
```

## 交互演示

### 标签切换

<CodeCard v-model:code="tabsCode" editable title="标签切换">
  <LiveDemo :code="tabsCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const tab = ref('a');

const tabs = [
  { key: 'a', label: '标签一' },
  { key: 'b', label: '标签二' },
  { key: 'c', label: '标签三' },
];

const tabsCode = ref(`
  <div class="flex flex-col gap-3">
    <Tabs v-model="tab" :tabs="tabs" />
    <p class="text-sm text-cumquat-text-muted">当前标签：{{ tab }}</p>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { tab, tabs, tabsCode };
</script>

