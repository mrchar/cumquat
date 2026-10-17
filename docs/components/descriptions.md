---
title: Descriptions 描述列表
---

# Descriptions 描述列表

只读字段的规整展示。

`DescriptionItem` 结构：`{ label: string; value: string }`。

| Prop     | 类型                | 默认值  | 说明             |
| -------- | ------------------- | ------- | ---------------- |
| title    | `string`            | `''`    | 标题             |
| items    | `DescriptionItem[]` | -       | 字段列表（绑定 fetch 时可省略） |
| fetch    | `Fetch<DescriptionItem>` | -   | 远程字段：挂载即请求，内置四态 |
| bordered | `boolean`           | `false` | 单元格带边框     |
| column   | `number`            | `2`     | 每行列数         |

```vue
<Descriptions title="用户信息" bordered :column="3" :items="userFields" />
```

## 交互演示

### 描述列表

<CodeCard v-model:code="descriptionsCode" editable title="描述列表">
  <LiveDemo :code="descriptionsCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const descriptionItems = [
  { label: '名称', value: 'Cumquat' },
  { label: '版本', value: '0.1.0' },
  { label: '协议', value: 'MIT' },
  { label: '语言', value: 'TypeScript' },
];

const descriptionsCode = ref(`
  <Descriptions title="项目信息" :items="descriptionItems" :bordered="true" :column="2" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { descriptionItems, descriptionsCode };
</script>

