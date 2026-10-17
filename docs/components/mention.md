---
title: Mention 提及
---

# Mention 提及

输入中的 @ 成员唤起。

| Prop        | 类型                                                        | 默认值                            | 说明                                               |
| ----------- | ----------------------------------------------------------- | --------------------------------- | -------------------------------------------------- |
| modelValue  | `string`                                                    | -                                 | 文本绑定值（v-model）                              |
| members     | `string[]`                                                  | `['Amber','Bolt','Cedar','Dawn']` | 本地候选成员（与 fetch 二选一）                    |
| fetch       | `Fetch<string> \| ((keyword: string) => Promise<string[]>)` | -                                 | 异步候选源（触发符后的片段作为关键词；兼容旧签名） |
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

## 交互演示

### @ 成员提及

<CodeCard v-model:code="mentionCode" editable title="@ 成员提及">
  <LiveDemo :code="mentionCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const mentionValue = ref('请通知 @');

const mentionMembers = ['Amber', 'Bolt', 'Cyan', 'Della'];

const mentionCode = ref(`
  <div class="flex flex-col gap-2">
    <Mention v-model="mentionValue" :members="mentionMembers" class="w-72" />
    <p class="text-sm text-cumquat-text-muted">输入 @ 唤起成员候选列表。</p>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { mentionValue, mentionMembers, mentionCode };
</script>
