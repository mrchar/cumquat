---
title: Descriptions 描述列表
---

# Descriptions 描述列表

数据绑定对象 + 字段元数据驱动的规整展示：`properties` 声明展示哪些字段、顺序与标签，值渲染复用 Table 的 Cell 竞选（`type`/`format` 元数据自动匹配渲染形态）。

`DescriptionProperty` 结构：`{ key, label, type?, format?, options?, cell?, bias? }`，与 useResources 产出的 properties 元数据同形。

| Prop       | 类型                              | 默认值 | 说明                                          |
| ---------- | --------------------------------- | ------ | --------------------------------------------- |
| title      | `string`                          | `''`   | 标题                                          |
| data       | `Record<string, unknown>`         | -      | 绑定的数据对象                                |
| properties | `DescriptionProperty[]`           | -      | 字段元数据（渲染顺序与标签声明）              |
| cells      | `CellRenderer[]`                  | -      | 局部渲染器，优先于全局注册表                  |
| bordered   | `boolean`                         | `false`| 单元格带边框                                  |
| column     | `number`                          | `2`    | 每行列数                                      |
| fetch      | `Fetch<Record<string, unknown>>`  | -      | 远程数据对象：挂载即请求，内置四态            |

渲染链路：`value-${key}` 插槽 > 显式 `cell` > 竞选推断 > 默认文本；标签可用 `label-${key}` 插槽覆盖。

```vue
<Descriptions title="用户信息" :data="user" :properties="properties" bordered :column="3" />
```

## 交互演示

### 描述列表

<CodeCard v-model:code="descriptionsCode" editable title="描述列表">
  <LiveDemo :code="descriptionsCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const user = {
  name: 'Cumquat',
  version: '0.1.0',
  license: 'MIT',
  language: 'TypeScript',
};

const properties = [
  { key: 'name', label: '名称' },
  { key: 'version', label: '版本' },
  { key: 'license', label: '协议' },
  { key: 'language', label: '语言' },
];

const descriptionsCode = ref(`
  <Descriptions title="项目信息" :data="user" :properties="properties" :bordered="true" :column="2" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { user, properties, descriptionsCode };
</script>
