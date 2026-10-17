---
title: AutoComplete 自动完成
---

# AutoComplete 自动完成

输入联想补全，支持本地候选与异步候选源。

| Prop             | 类型                                     | 默认值         | 说明                             |
| ---------------- | ---------------------------------------- | -------------- | -------------------------------- |
| modelValue       | `string`                                 | -              | 绑定值（v-model）                |
| options          | `string[]`                               | `[]`           | 静态候选（本地包含匹配）         |
| fetch            | `Fetch<string> \| ((keyword: string) => Promise<string[]>)` | -              | 异步候选源（提供时替代本地过滤；新签名经 query.keyword 收参，旧签名继续兼容） |
| placeholder      | `string`                                 | `'输入以搜索'` | 占位文本                         |
| disabled         | `boolean`                                | `false`        | 禁用                             |
| triggerOnFocus   | `boolean`                                | `true`         | 聚焦即触发建议                   |
| debounce         | `number`                                 | `300`          | 防抖时长（异步源生效，ms）       |
| minKeywordLength | `number`                                 | `0`            | 触发请求的最小关键词长度         |

| 事件              | 参数            | 说明         |
| ----------------- | --------------- | ------------ |
| update:modelValue | `value: string` | 值更新       |
| change            | `value: string` | 值变化       |
| select            | `value: string` | 选中某条建议 |

| 插槽   | 说明                                                  |
| ------ | ----------------------------------------------------- |
| option | 自定义建议项，slot props：`{ option, index, active }` |

Expose：`focus()` 聚焦输入框。

```vue
<AutoComplete v-model="kw" :options="candidates" />
<AutoComplete v-model="kw" :fetch="searchUsers" :min-keyword-length="2" />
```

## 交互演示

### 输入建议

<CodeCard v-model:code="autoCompleteCode" editable title="输入建议">
  <LiveDemo :code="autoCompleteCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const autoCompleteValue = ref('');

const autoCompleteCode = ref(`
  <AutoComplete
    v-model="autoCompleteValue"
    :options="['苹果', '香蕉', '樱桃', '葡萄', '柠檬']"
    placeholder="输入水果名"
    class="w-64"
  />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { autoCompleteValue, autoCompleteCode };
</script>

