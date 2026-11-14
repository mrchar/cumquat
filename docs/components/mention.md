---
title: Mention 提及
---

# Mention 提及

输入中的 @ 成员唤起。

| Prop        | 类型                                                        | 默认值                            | 说明                                               |
| ----------- | ----------------------------------------------------------- | --------------------------------- | -------------------------------------------------- |
| modelValue  | `string`                                                    | -                                 | 文本绑定值（v-model）                              |
| members     | `string[]`                                                  | `['甲','乙','丙','丁']` | 本地候选成员（与 fetch 二选一）                    |
| fetch       | [`FetchHandler`](/types/basics/core#fetchhandler)`<string>` | -                                 | 异步候选资源工厂（触发符后的片段作为 `query.keyword`）：首次建对象，之后调 `execute`；无 fetch 时回退本地 `members`，卸载自动 `abort` |
| trigger     | `string`                                                    | `'@'`                             | 触发符                                             |
| placeholder | `string`                                                    | `'输入 @ 唤起提及'`               | 占位文本                                           |
| debounce    | `number`                                                    | `300`                             | 异步防抖（ms）                                     |

| 事件              | 参数             | 说明         |
| ----------------- | ---------------- | ------------ |
| update:modelValue | `value: string`  | 文本更新     |
| select            | `member: string` | 选中某位成员 |

```vue
<Mention v-model="content" :members="team" />
<Mention v-model="content" trigger="#" :fetch="searchTags" />
```

## 补充：订阅数据源

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| subscribe | [`SubscribeHandler`](/types/basics/core#subscribehandler)`<string[]>` | `undefined` | 订阅候选成员；挂载时调用，优先于 `fetch` / `members` |

`subscribe` 与 `fetch` / 本地 `members` 同时存在时优先使用 `subscribe`；订阅失败时回退到 `fetch` / `members`。

## 交互演示

### @ 成员提及

<CodeCard v-model:code="mentionCode" editable title="@ 成员提及">
  <LiveDemo :code="mentionCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const mentionValue = ref('请通知 @');

const mentionMembers = ['甲', '乙', '丙', '丁'];

const mentionCode = ref(`
  <div class="flex flex-col gap-2">
    <Mention v-model="mentionValue" :members="mentionMembers" class="w-72" />
    <p class="text-sm text-cumquat-text-muted">输入 @ 唤起成员候选列表。</p>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { mentionValue, mentionMembers, mentionCode };
</script>
