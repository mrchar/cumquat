---
title: 竞选机制
---

# 竞选机制

Table 绑定 `columns` 后，每一列都有数据，但数据本身并不描述呈现方式。一列邮箱地址可以是纯文本，也可以是可点击的链接；一个状态码可以显示原始值，也可以显示对应的标签；一个时间戳可以原样输出，也可以格式化。要得到后者，代码必须对每一列做出判断。

这一判断目前有两种做法：写在 Table / Form 内部，或交由宿主逐列编写插槽。前者每新增一种格式都要修改组件源码，后者使元数据驱动退化为手写代码，两者都会随格式数量增长而持续累积成本。

竞选机制将「某个定义应由谁渲染」从组件内部抽离出来，交由可注册、可替换的渲染器裁决。组件只负责发起竞选，具体判断下沉到渲染器；新增一种格式只需注册一个渲染器，不必改动组件，也不必改动既有列定义。

展示侧的渲染器称为 **Cell**，录入侧称为 **Field**，两者规则完全同构。本文先完整介绍表格一侧，再介绍表单一侧，最后说明共同机制。

## 表格

### 效果

下列表格未使用任何单元格插槽，列元数据（`type` / `format` / `enum`）由 `schemaToColumns` 投影展开：

<CodeCard v-model:code="cellCampaignCode" :default-expand="true" editable title="列定义驱动的单元格">
  <LiveDemo :code="cellCampaignCode" />
</CodeCard>

各列按投影元数据呈现为不同形态：

- `format: 'email'` → `mailto:` 链接
- `type: 'number'` → 带千分位的数字
- `type: 'boolean'` → 「是 / 否」徽标
- `enum` 存在 → 按 `enum` 映射显示的选项名称
- `format: 'date'` → `YYYY-MM-DD`
- `format: 'uri'` → 可点击的外链

### 列定义

列就是视图视角的 schema。`schemaToColumns` 把字段的 `type` / `format` / `enum` 展开到列上，手写列则只声明传统表格属性。与竞选相关的字段如下：

| 字段        | 说明                                                                |
| ----------- | ------------------------------------------------------------------- |
| `type`      | 类型提示（schema 投影），参与评分                                   |
| `format`    | 内容格式（schema 投影），参与评分                                   |
| `enum`      | 值 → 文案映射（值可为 string / number / boolean / null），参与评分  |
| `options`   | 筛选候选值：静态数组或 `FetchHandler`（展开面板时拉取），不参与评分 |
| `formatter` | 自定义格式化函数，提供后优先于竞选                                  |
| `cell`      | 显式指定渲染器名称，跳过评分                                        |
| `bias`      | 对指定渲染器加减分                                                  |

手写列没有 `type` / `format`，展示由 `enum`、`formatter` 或显式 `cell` 表达；需要按格式自动竞选时，用 `schemaToColumns` 从 schema 投影。

### 内建渲染器

| 渲染器     | 自评依据                                       | 显示效果                                 |
| ---------- | ---------------------------------------------- | ---------------------------------------- |
| `text`     | 恒为 `1`（兜底）                               | 原始值文本                               |
| `number`   | `type: number` / `integer` → `80`              | 千分位数字                               |
| `boolean`  | `type: boolean` → `90`                         | 是 / 否 徽标                             |
| `enum`     | `enum?.length` → `100`                         | `enum` 映射中的 label 徽标               |
| `date`     | `format: date` → `90`                          | `YYYY-MM-DD`                             |
| `datetime` | `format: date-time` → `95`                     | `YYYY-MM-DD HH:mm:ss`                    |
| `email`    | `format: email` → `95`                         | `mailto:` 链接                           |
| `link`     | `format: uri` → `95`                           | 新窗口打开的外链                         |
| `tag`      | `format: tag` / `format: status` → `85`        | 语义标签                                 |

行为说明：

- `format` 的得分普遍高于同来源的 `type`，因为内容格式比保存格式更具体，更具体者优先
- 越界值统一降级：无法解析的数字与日期显示原值；`enum` 中查不到的值显示原值并附虚线样式
- 空值统一渲染为空，不显示 `null` 或 `undefined`
- 内建集保持最小范围，`uuid`、`int64`、`binary` 等格式由宿主按同一契约扩展

### 优先级

竞选是默认路径，但并非唯一路径。表格可通过以下层级直接接管渲染：

| 层级     | 写法                 | 说明                                             |
| -------- | -------------------- | ------------------------------------------------ |
| 插槽     | `#cell-{key}`        | 完全交由宿主实现，优先级最高，slot props 为 `{ row, value }` |
| 显式指定 | 列上 `cell`          | 按名称指定渲染器，跳过评分；名称未注册时退回竞选 |
| 竞选推断 | 列上的 `type` / `format` | 默认路径，由 schema 投影展开          |
| 兜底     | 原始文本             | 内建 `text` 渲染器                               |

- **插槽**适用于操作列、复合控件与特殊布局
- **显式指定**适用于单列的定制诉求，写 `cell: 'tag'` 即可
- **竞选推断**适用于绝大多数普通数据列，也是资源池投影的默认形态
- 各层级互不冲突：使用插槽的列不参与竞选，未指定的列照常竞选

### 调整

按照影响范围由小到大，提供四种调整方式。

**一、加成：`bias`**

不改变注册表，仅作用于当前列：

```ts
// 先由 schema 投影出列，再在列上调整：状态列默认由 enum 接管（100 分），加成后 tag 胜出
const columns = schemaToColumns({
  type: 'object',
  properties: { status: { type: 'string', enum: ['active', 'leave'], format: 'status' } },
});
columns[0].bias = { tag: 30 };
```

**二、指定：`cell`**

按名称直接指定渲染器，跳过评分：

```ts
const columns = schemaToColumns({
  type: 'object',
  properties: { status: { type: 'string', enum: ['active', 'leave'] } },
});
columns[0].enum = statusOptions; // 自定义文案
columns[0].cell = 'tag';
```

若指定的名称未注册，不会抛出错误，而是退回竞选，因此允许先编写配置、后补充渲染器。

**三、局部注册：`cells`**

仅作用于当前 Table 实例，适用于页面级定制：

```vue
<Table :columns="columns" :rows="rows" :cells="[progressCell]" />
```

局部渲染器与全局注册共同参与竞选；名称相同时，显式指定与同分裁决均优先命中局部。

**四、全局注册：`registerCell`**

需要全局统一的渲染策略时，注册到全局：

```ts
import { registerCell } from '@mrchar/cumquat';

// 同名重注册会替换既有实现（包括内建实现）
registerCell(myEmailCell);
```

- 注册后对所有 Table 生效
- 同名覆盖时，内建实现被替换，注册位置保持不变
- 例：重注册 `email` 后，全局邮箱列统一改用宿主的链接组件

### 自定义渲染器

```ts
import type { VNodeChild } from 'vue';

export interface CellColumn {
  key: string;
  title: string;
  type?: Kind;
  format?: string;
  enum?: Array<string | number | boolean | null>;
  options?: Option[];
  cell?: string;
  bias?: Record<string, number>;
}

export interface CellRenderer {
  /** 注册名，也是 cell 显式指定的目标 */
  name: string;
  /** 自评：完整列定义 → 分数，0 表示弃权 */
  fitness: (column: CellColumn) => number;
  /** 渲染：值 → 展示内容，空值与越界值自行处理 */
  render: (value: unknown, column: CellColumn) => VNodeChild;
}
```

例：为 `format: 'percent'` 增加进度条渲染。

```ts
import { h } from 'vue';
import { Progress, registerCell } from '@mrchar/cumquat';

registerCell({
  name: 'progress',
  fitness: (column) => (column.format === 'percent' ? 95 : 0),
  render: (value) => h(Progress, { value: Number(value) }),
});
```

注册后，schema 中补充 `format`，投影出的列即改用进度条渲染：

```ts
const columns = schemaToColumns({
  type: 'object',
  properties: { completion: { format: 'percent', title: '完成度' } },
});
```

扩展入口在 Cell 一侧，Table 无需改动。既有列定义不必修改，也无需为新格式修改组件源码。

## 表单

### 效果

绑定 `properties` 后，各字段按定义选择控件并完成装配：

<CodeCard v-model:code="fieldCampaignCode" :default-expand="true" editable title="字段定义驱动的控件">
  <LiveDemo :code="fieldCampaignCode" />
</CodeCard>

字段视图与生成的控件对应如下（`component` 由转换器按 schema 类型给出）：

- `string` → `input` 文本输入框
- `string + format: 'email'` → 邮箱输入框
- `number` / `integer` → `number` 数值输入框
- `boolean` → `switch` 开关
- `format: 'date'` → `date` 日期选择器
- `enum + options` → `select` 下拉选择

`validation.required` 为 `true` 的字段在提交时会提示必填，该规则同样由 schema 派生。

### 字段定义

字段视图中与竞选相关的字段如下：

| 字段                   | 说明                               |
| ---------------------- | ---------------------------------- |
| `component`            | 首选控件名，命中同名渲染器即生效     |
| `props.format`         | 内容格式，参与评分                 |
| `props.options`        | `enum` 的候选值，直接作为下拉选项  |
| `props.placeholder`    | 占位提示，缺省回落到 `label`       |
| `props.bias`           | 对指定渲染器加减分                 |
| `validation.required`  | 是否必填，为 `true` 时派生必填校验 |

### 内建渲染器

| 渲染器   | 自评依据                  | 装配效果                                                                                 |
| -------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| `input`  | 恒为 `1`（兜底）          | 文本输入框；`props.format` 为 `textarea` / `multiline` → 多行；`email` / `uri` / `password` → 原生输入类型 |
| `number` | `component: number` → `80` | 数值输入框                                                                               |
| `switch` | `component: switch` → `90` | 开关                                                                                     |
| `select` | `component: select` → `100` | 下拉选择，`props.options` 直接作为选项，非必填时可清空                                 |
| `date`   | `component: date` → `90`   | 日期选择器                                                                               |

行为说明：

- 空值与非法值由控件自身处理，竞选层不做转换
- 值类型由所选控件定义：`select` 使用选项的 `value`，`date` 使用时间戳数字
- `date-time` 组合选择、`time` 时刻选择、`color` 取色器等未内置，可按同一契约扩展

### 优先级

表单侧的层级与表格侧一一对应：

| 层级     | 写法                     | 说明                                                       |
| -------- | ------------------------ | ---------------------------------------------------------- |
| 插槽     | `#field-{name}`          | 完全交由宿主实现，优先级最高，slot props 为 `{ field, value, error, setValue }` |
| 显式指定 | 字段上 `component`       | 按名称指定渲染器，跳过评分；名称未注册时退回竞选           |
| 竞选推断 | `component` / `props` 等 | 默认路径，无需配置                                         |
| 兜底     | 文本输入框               | 内建 `input` 渲染器                                        |

- **插槽**适用于复合控件与特殊布局
- **显式指定**适用于单字段的定制诉求，写 `component: 'select'` 即可
- **竞选推断**适用于绝大多数普通字段，也是资源池投影的默认形态
- 各层级互不冲突：使用插槽的字段不参与竞选，未指定的字段照常竞选

### 调整

调整方式与表格侧同构，替换为录入侧的对应名称。

**一、加成：`props.bias`**

```ts
// 状态字段默认由 select 接管（100 分），加成后改用其他渲染器
{ name: 'status', label: '状态', component: 'select', props: { options: statusOptions, bias: { tag: 30 } }, validation: { required: false, rules: [] } }
```

**二、指定：`component`**

```ts
{ name: 'status', label: '状态', component: 'select', props: { options: statusOptions }, validation: { required: false, rules: [] } }
```

若指定的名称未注册，同样退回竞选。

**三、局部注册：`controls`**

```vue
<Form :properties="properties" :controls="[colorField]" />
```

**四、全局注册：`registerField`**

```ts
import { registerField } from '@mrchar/cumquat';

// 同名重注册会替换既有实现（包括内建实现）
registerField(myDateField);
```

- 注册后对所有 Form 生效
- 例：重注册 `date` 后，全局日期字段统一改用宿主的选择器

### 自定义渲染器

```ts
export interface View {
  name: string;
  label: string;
  description?: string;
  help?: string;
  /** 首选控件名：与 FieldRenderer.name 对应 */
  component: string;
  /** 控件附加属性：options / placeholder / format / bias… */
  props?: Record<string, unknown>;
  validation: Validation;
}

export interface FieldContext {
  name: string;
  disabled: boolean;
  /** 当前校验错误，无错误为 undefined */
  error: string | undefined;
  /** 写回整表值；已有错误的字段写回后自动重新校验 */
  setValue: (value: unknown) => void;
}

export interface FieldRenderer {
  name: string;
  fitness: (field: View) => number;
  render: (value: unknown, field: View, ctx: FieldContext) => VNodeChild;
}
```

例：为 `format: 'color'` 增加取色器。

```ts
import { h } from 'vue';
import { ColorPicker, registerField } from '@mrchar/cumquat';

registerField({
  name: 'color',
  fitness: (field) => (field.props?.format === 'color' ? 95 : 0),
  render: (value, _field, ctx) =>
    h(ColorPicker, {
      modelValue: (value as string | null) ?? null,
      'onUpdate:modelValue': ctx.setValue,
      disabled: ctx.disabled,
    }),
});
```

宿主只需在字段定义上补充 `format: 'color'`，该字段即改用取色器装配。扩展入口在 Field 一侧，Form 无需改动。

## 机制

表格与表单共用同一套裁决规则，差别仅在于参与竞争的渲染器集合与最终产出的形态。

### 裁决过程

以一个带 `enum` 的列为例：

```text
列定义 { enum: ['active', 'leave'], options: [...] }
        │
        ├─ text    自评 1
        ├─ date    自评 0     ← 弃权
        ├─ enum    自评 100   ← 胜出
        └─ tag     自评 0     ← 弃权
                    │
                    ▼
        enum 渲染器接管这一列的每一行
```

完整流程分为四步：

1. 代理取出该列（或该字段）的完整定义
2. 每个已注册的渲染器依据定义评分，`0` 表示不参与竞争
3. 叠加定义上的加成 `bias`（可选），可正可负
4. 得分最高者接管渲染；同分时局部注册优先，其次先注册者优先

裁决过程遵循三条约定：

- **得分仅在同一次比较中有意义**：100 分不代表绝对优劣，只表示在该轮候选中更为合适
- **评分只读取定义，不读取值**：值仅在渲染阶段参与，因此同一列的所有行始终使用同一种方式渲染
- **每个定义只裁决一次**：定义变化时重新裁决，而非逐行、逐次输入重新竞选

### 评分

渲染器的 `fitness` 为纯函数：输入完整定义，输出一个数值。正数参与竞争，`0` 或负数视为弃权，返回非数值（如 `NaN`）同样按 `0` 处理。

评分函数的输入是**完整定义**，`type` / `format` / `enum` 只是其中最常用的几个字段。宿主可以在定义上附加自定义字段，渲染器同样可读取（TypeScript 下可扩展 `CellColumn` / `View` 类型以获得类型提示）。

### 同分

最终得分相同时，按以下顺序决胜：

1. 局部注册优先于全局注册
2. 同一来源内，先注册者优先

该规则保证结果稳定、可预期，不依赖运行时遍历顺序。

### 兜底

内建的默认渲染器（展示侧 `text`、录入侧 `input`）恒为 `1` 分，因此任何定义都有渲染器接手。未匹配到专用渲染器时，展示侧显示原始文本，录入侧退化为文本输入框；仅声明 `{ key, title }` 的列同样可以正常渲染。

## 与其它能力的关系

- **资源池**：[useResources](/composables/resources) 投影出的 `columns` 已把字段的 `type` / `format` / `enum` 展开到列上（enum 列自动以 `enum` 作为筛选项），直接参与竞选；`properties` 自带 `type` / `format` / `options` / `required`，绑定后即可直接参与竞选
- **元数据导出**：[元数据导出](/metadata) 介绍从服务端文档批量产出上述定义的完整链路，以及用 useMask 按视角裁剪字段
- **插槽与手写布局**：`#cell-{key}`、`#field-{name}` 与手写 FormItem 的行为不变，竞选只接管无插槽、未显式指定的普通列与字段
- **校验**：录入侧仅派生必填一项，格式、长度、异步校验仍由宿主 `rules` 负责
- **主题**：Cell 输出 `cumquat-cell--*` 语义 class，内置样式随主题机制生效；自定义渲染器可复用这些 class
- **排序 / 筛选 / 分页**：与展示无关，竞选不作处理；小屏卡片模式下的单元格同样走竞选

## 边界

以下为机制有意不覆盖的范围：

- **不做单元格级 / 值级竞选**：按列、按字段裁决，保证同列策略一致，开销可预期
- **不做异步渲染器**：渲染与装配均为同步过程，数据获取交由 `fetch` / `subscribe` 或控件自身处理
- **不做字段联动编排**：联动由响应式对象与宿主规则实现，竞选只负责选型
- **不做布局**：栅格、分组、分步属于布局组件职责，录入侧仅逐行产出 FormItem

<script setup lang="ts">
import { ref } from 'vue';

const cellCampaignCode = ref(`
<script setup lang="ts">
import { schemaToColumns } from '@mrchar/cumquat';

const columns = schemaToColumns({
  type: 'object',
  properties: {
    name: { type: 'string', title: '姓名' },
    email: { type: 'string', format: 'email', title: '邮箱' },
    score: { type: 'number', title: '积分' },
    active: { type: 'boolean', title: '在职' },
    joinedAt: { type: 'string', format: 'date', title: '入职日期' },
    level: { type: 'string', enum: ['junior', 'senior'], title: '等级' },
    homepage: { type: 'string', format: 'uri', title: '主页' },
  },
});
const levelColumn = columns.find((column) => column.key === 'level');
if (levelColumn) {
  levelColumn.enum = [
    { label: '初级', value: 'junior' },
    { label: '高级', value: 'senior' },
  ];
}

const rows = [
  {
    name: '甲乙',
    email: 'jia@mock.test',
    score: 12800,
    active: true,
    joinedAt: '2023-04-12',
    level: 'senior',
    homepage: 'https://mock.test/jia',
  },
  {
    name: '丙丁',
    email: 'bing@mock.test',
    score: 8600,
    active: false,
    joinedAt: '2024-09-01',
    level: 'junior',
    homepage: 'https://mock.test/bing',
  },
];
<\/script>

<template>
  <Table :columns="columns" :rows="rows" />
</template>
`);

const fieldCampaignCode = ref(`
<script setup lang="ts">
import { ref } from 'vue';

const values = ref({});

const properties = [
  { name: 'name', label: '姓名', component: 'input', validation: { required: true, rules: [] } },
  { name: 'email', label: '邮箱', component: 'input', props: { format: 'email' }, validation: { required: false, rules: [] } },
  { name: 'age', label: '年龄', component: 'number', validation: { required: false, rules: [] } },
  { name: 'active', label: '启用', component: 'switch', validation: { required: false, rules: [] } },
  { name: 'joinedAt', label: '入职日期', component: 'date', validation: { required: false, rules: [] } },
  {
    name: 'level',
    label: '等级',
    component: 'select',
    props: {
      options: [
        { label: '初级', value: 'junior' },
        { label: '高级', value: 'senior' },
      ],
    },
    validation: { required: false, rules: [] },
  },
];
<\/script>

<template>
  <Form v-model="values" :properties="properties" style="max-width: 22rem">
    <Button type="primary" native-type="submit">提交</Button>
  </Form>
</template>
`);
</script>
