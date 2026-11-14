---
title: 类型参考 · 视图投影与竞选
---

# 视图投影与竞选

数据模型通向视图的最后一段路：先由转换器把 Schema 投影成字段视图 `View`，再由竞选机制决定具体由哪个渲染器接管。展示侧（Cell）与录入侧（Field）是同构的两套契约：自我评价 + 代理裁决 + 三层外部调整。

## 视图提示

### Hint · Scope {#hint}

```ts
export interface Hint {
  scope?: Scope;
  control?: string;
  placeholder?: string;
  bias?: Record<string, number>;
  enumLabels?: string[];
}

export interface Scope {
  list?: boolean;
  filter?: boolean;
  create?: boolean;
  update?: boolean;
}
```

`Resource.hints` 按字段名索引这些提示，转换器在投影时读取；纯数据 schema 不感知它们。

## 视图投影

### View {#view}

录入侧消费的是 schema 的视图投影：`label` 来自属性定义，`component` 来自类型定义；约束留在字段上，`validation` 表达必填、可空与自定义校验（`Validation` 的完整定义见[数据模型与表单](/types/model/form#validation)）。

```ts
export interface View {
  name: string;
  label: string;
  description?: string;
  help?: string;
  /** 首选控件：命中同名渲染器即生效 */
  component: string;
  /** 控件附加属性：options / placeholder / format / bias… */
  props?: Record<string, unknown>;
  validation: Validation;
}
```

### Context · Converter {#converter}

schema → 视图的转换契约。类型定义在 core，默认实现在 composables（`createView()` / `defaultView`），可整体替换。

```ts
export interface Context {
  /** 字段名 */
  name: string;
  /** 对象级 required 是否包含该字段 */
  required: boolean;
  /** 所属对象 */
  schema: Schema;
  /** 当前字段的视图提示 */
  hint?: Hint;
}

export interface Converter {
  toField(name: string, field: Schema, context: Context): View;
  toFields(schema: Schema, hints?: Record<string, Hint>): View[];
}
```

## 竞选机制

状态自持让组件决定“数据现在是什么状态”；竞选机制让组件决定“这段数据应该怎么呈现”。

传统组件库通常在组件内部写死展示分支：`format === 'email'` 就渲染链接，`type === 'boolean'` 就渲染是 / 否。每增加一种格式，组件就要改一次；如果改用插槽交给页面，页面又要为每一列手写渲染逻辑，元数据驱动退化成了胶水代码。

竞选机制把“谁来渲染”从组件内部抽出来，变成可注册、可自评的渲染器。页面只声明数据是什么；对象 schema 经 `schemaToColumns` 投影为列，类型、格式与枚举随之展开：

```ts
import { schemaToColumns } from '@mrchar/cumquat';

const columns = schemaToColumns({
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', title: '邮箱' },
    active: { type: 'boolean', title: '在职' },
    state: { type: 'string', enum: ['active', 'leave'], title: '状态' },
  },
});
```

组件拿完整列定义去问每个已注册的 `CellRenderer`：你能多好地渲染它？最高分者接管。注册一个状态徽章只需要：

```ts
import { h } from 'vue';
import { registerCell, Badge } from '@mrchar/cumquat';

registerCell({
  name: 'status-badge',
  fitness: (column) => (column.format === 'status' ? 10 : 0),
  render: (value) => h(Badge, { type: String(value) }),
});
```

之后任何声明了 `format: 'status'` 的列都会自动使用徽章，Table 本身不需要修改。显式指定（`cell` / `component`）和局部渲染器始终可以覆盖默认竞选结果。

## 展示侧

### CellColumn {#cellcolumn}

单元格渲染的列定义；与 Table 的列配置、资源池的列表列投影同形。

```ts
export interface CellColumn {
  key: string;
  title: string;
  /** 类型提示：JSON Schema 子集（string / number / integer / boolean / array / object / null） */
  type?: Kind;
  /** 内容格式提示：date / date-time / email / uri / tag / status…（原样透传文档声明） */
  format?: string;
  /** 枚举值：单元格据此识别枚举列 */
  enum?: Array<string | number | boolean | null>;
  /** 枚举选项：enum 单元格据此显示 label */
  options?: Option[];
  /** 显式指定单元格渲染器名称，跳过竞选 */
  cell?: string;
  /** 竞选加成：对指定渲染器加减分，正负均可 */
  bias?: Record<string, number>;
}
```

### CellRenderer {#cellrenderer}

```ts
export interface CellRenderer {
  /** 注册名：显式指定的目标；同名重注册替换既有实现（含内建） */
  name: string;
  /** 自我评价：完整列定义 → 适配度分数，0 弃权；纯函数、不读单元格值 */
  fitness: (column: CellColumn) => number;
  /** 渲染：值 → 展示内容；需自行处理空值与越界值 */
  render: (value: unknown, column: CellColumn) => VNodeChild;
}
```

## 录入侧

### FieldContext {#fieldcontext}

值与错误经上下文接入表单。

```ts
export interface FieldContext {
  name: string;
  disabled: boolean;
  /** 当前校验错误信息（无错误为 undefined） */
  error: string | undefined;
  /** 写回整表值；已存在错误的字段写回后自动重新校验 */
  setValue: (value: unknown) => void;
}
```

### FieldRenderer {#fieldrenderer}

```ts
export interface FieldRenderer {
  name: string;
  /** 自我评价：完整字段视图 → 适配度分数，0 弃权；纯函数、不读字段值 */
  fitness: (field: View) => number;
  /** 装配：值 + 字段视图 + 上下文 → 控件节点 */
  render: (value: unknown, field: View, ctx: FieldContext) => VNodeChild;
}
```
