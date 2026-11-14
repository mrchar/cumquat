---
title: 类型参考 · 数据模型与表单
---

# 数据模型与表单

数据定义的一半是字段与约束：它们既可以交给独立的 `createValidator` 执行校验，也可以直接驱动 Form 渲染。本页收录 Schema 三层定义、校验规则与文案，以及表单运行时在组件间传递的上下文类型；Schema 向视图的投影（`Hint` / `View` / `Converter`）与竞选契约见[视图投影与竞选](/types/model/rendering)。

完整用法见[数据校验](/composables/validation)与[表单模型](/composables/form)。

## 为什么是三层

数据定义不是“字段名 + 类型”这么简单。本库按三个层次描述数据，这三层正好对应编程语言对类型支持的递进：

| 层次 | 回答的问题 | 编程语言类比 | 本库的片段 |
| --- | --- | --- | --- |
| 属性定义 | 它叫什么、怎么被理解 | 弱类型语言只要求名称 | `Meta`：`title` / `description` / `default` / `example` |
| 类型定义 | 它是什么形状 | 强类型语言要求类型 | `Type`：`type` / `format` / `enum` / `items` / `properties` |
| 约束定义 | 它允许什么值 | 多数语言没有，数据库有 | `Constraint`：`minimum` / `maxLength` / `pattern` / … |

弱类型语言（JavaScript、Python）通常只停在第一层；强类型语言（Java、C++）补齐第二层；长度、范围、正则这类约束很少由语言表达，却是数据库的日常。JSON Schema 罕见地同时覆盖了三层，OpenAPI 又把它用于接口描述，因此本库以 JSON Schema 子集作为规范 schema。

三层在 Schema 节点上合流：

```ts
const email: Schema = {
  // 属性定义
  title: '邮箱',
  description: '用于接收系统通知',
  example: 'name@example.com',
  // 类型定义
  type: 'string',
  format: 'email',
  // 约束定义
  maxLength: 120,
};
```

## 从定义到视图

视图层不需要重新理解业务，它只做固定投影：

| 来源 | 视图侧 | 说明 |
| --- | --- | --- |
| `title` | `label` | `title` 优先，缺省回落字段名 `name` |
| `description` | `description` / `help` | 说明文本；`example` 存在时合成“说明；示例：xxx” |
| `example` | `help` / `placeholder` | 示例提示；`hints.placeholder` 可显式覆盖 |
| `type` / `format` / `enum` | `component` | `enum` → `select`，`boolean` → `switch`，`number` → `number`，`format: date` → `date`，其余 → `input` |
| `required` | `validation.required` | 对象级 `required` → 必填 |
| 约束 | `validation` 之外的节点本身 | 约束留在 `Schema` 节点上，校验器直接读取；不复制成 `Rule` |
| 校验器选项 `rules.fields` | `validation.rules` | 编译期合入，只承接自定义校验实现 |
| `hints.scope` | 投影位置 | 决定字段进入 `columns` / `filters` / `properties` 中的哪些 |

```ts
const schema: Schema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      title: '邮箱',
      description: '用于接收系统通知',
      example: 'name@example.com',
      maxLength: 120,
    },
  },
};

const emailView = createView().toField('email', schema.properties.email, {
  required: true,
  schema,
});
```

投影结果：

```ts
{
  name: 'email',
  label: '邮箱',
  description: '用于接收系统通知',
  help: '用于接收系统通知；示例：name@example.com',
  component: 'input',
  props: { format: 'email' },
  validation: { required: true },
}
```

`maxLength` / `format` 等约束不会被搬到视图里，它们仍留在 schema 节点上；`validation` 只表达必填、可空与宿主追加的自定义校验。

页面没有写“用输入框、校验 email 格式、标题叫邮箱”。这些来自定义，组件只负责把定义投影成视图并交给竞选机制。投影产物 `View` 与转换器契约 `Converter` 见[视图投影与竞选](/types/model/rendering)。

## 三层定义

schema 的三层内涵在本库落成三个可组合的片段：属性定义（`Meta`）、类型定义（`Type`）、约束定义（`Constraint`）。`Schema` 是三者之并的递归节点；视图层再从属性定义与类型定义投影出 `label / component`，`validation` 只承接必填、可空与自定义校验。

### Kind {#kind}

JSON Schema Draft 2020-12 的类型词汇子集。

```ts
export type Kind =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null';
```

### Meta · Type · Constraint {#layers}

```ts
/** 属性定义：资源如何被描述 */
export interface Meta {
  title?: string;
  description?: string;
  default?: unknown;
  example?: unknown;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
}

/** 类型定义：资源是什么 */
export interface Type {
  type?: Kind;
  format?: string;
  enum?: unknown[];
  const?: unknown;
  nullable?: boolean;
  items?: Schema;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean | Schema;
  allOf?: Schema[];
  anyOf?: Schema[];
  oneOf?: Schema[];
  not?: Schema;
}

/** 约束定义：资源允许什么 */
export interface Constraint {
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}
```

### Schema · Model {#schema}

```ts
/** JSON Schema 节点：递归描述任意值 */
export interface Schema extends Meta, Type, Constraint {}

export interface Model {
  name: string;
  schema: Schema;
}
```

`Schema` 只承载纯数据定义，不包含视图提示或校验实现；`properties` 可选，只有对象节点才需要它。顶层资源模型通常提供 `properties`，叶子节点只写 `type` 与约束；字段级必填不写在节点上，而由所属对象的 `required` 数组表达（对齐 JSON Schema）。嵌套对象的属性值同样是 `Schema`：

```ts
const article: Schema = {
  type: 'object',
  properties: {
    title: { type: 'string', maxLength: 80 },
    author: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: ['title'],
};
```

自定义校验作为独立配置传给 `createValidator`：

```ts
createValidator(schema, {
  rules: {
    fields: { alias: { validate: (value, values) => value !== values.name } },
    checks: [{ fields: ['start', 'end'], validate: (values) => (values.end as string) >= (values.start as string) }],
  },
});
```

## 自定义规则

### Rule {#rule}

`Rule` 是自定义校验的实现出口，不是 schema 约束的副本。类型、格式、范围、长度等内置约束由 `Schema` 节点直接携带，校验器按字段读取；`Rule` 只补充 schema 无法表达的校验逻辑。

```ts
export interface Rule {
  /** 自定义校验：返回 true 通过，字符串作为错误信息，false 使用配置文案 */
  validate?: (
    value: unknown,
    values: Record<string, unknown>,
  ) => boolean | string | Promise<boolean | string>;
  /** 字段级文案覆盖，优先于模型与全局模板 */
  message?: MessageTemplate;
}
```

```ts
const schema: Schema = {
  type: 'object',
  properties: {
    // 内置约束：留在字段上
    name: { type: 'string', minLength: 2, maxLength: 20 },
    // 自定义校验：schema 无法表达“不能与 name 相同”
    alias: { type: 'string' },
  },
  rules: {
    fields: {
      alias: {
        validate: (value, values) => value === values.name ? '别名不能与名称相同' : true,
      },
    },
  },
};
```

### CheckRule {#checkrule}

跨字段 / 整表规则。

```ts
export interface CheckRule {
  /** 参与校验的字段 */
  fields: string[];
  /** 错误挂载字段，缺省取 fields[0] */
  target?: string;
  validate: (
    values: Record<string, unknown>,
  ) => boolean | string | Promise<boolean | string>;
  message?: MessageTemplate;
}
```

### Rules {#rules}

`Rules` 是独立于 schema 的校验配置，随 `createValidator` / `useValidator` 或 Form 的 `validation` 属性传入；它不写进数据模型。

```ts
export interface Rules {
  fields?: Record<string, Rule>;
  checks?: CheckRule[];
  messages?: MessageTemplates;
}
```

校验职责由此分成两条互不重叠的通路：

| 来源 | 位置 | 由谁执行 |
| --- | --- | --- |
| `type` / `format` / `enum` / `minimum` / `maxLength` / `pattern` … | schema 节点 | `createValidator` 的字段约束检查 |
| `rules.fields[*].validate` | `createValidator` 选项 | 同一校验器的自定义规则阶段 |
| `rules.checks` | `createValidator` 选项 | 跨字段 / 整表检查 |

## 校验结果与执行

### ValidationResult {#validationresult}

`errors` 仅包含失败字段。

```ts
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
```

### Validator {#validator}

`createValidator(schema)` 的返回形态；`rules` 是可直接交给 Form / `useForm` 的 `FormRules`。

```ts
export interface Validator<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly rules: FormRules<T>;
  validate(values: T): Promise<ValidationResult>;
  validateField(name: string, values: T): Promise<string | true>;
}
```

## 文案

### RuleKind {#rulekind}

```ts
export type RuleKind =
  | 'required'
  | 'type'
  | 'enum'
  | 'minimum'
  | 'maximum'
  | 'exclusiveMinimum'
  | 'exclusiveMaximum'
  | 'multipleOf'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'format'
  | 'minItems'
  | 'maxItems'
  | 'uniqueItems'
  | 'validate'
  | 'check';
```

### MessageContext {#messagecontext}

```ts
export interface MessageContext {
  field: string;
  label: string;
  value?: unknown;
  rule: RuleKind;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  multipleOf?: number;
  pattern?: string;
}
```

### MessageTemplate {#messagetemplate}

```ts
export type MessageTemplate = string | ((ctx: MessageContext) => string);
```

### MessageTemplates {#messagetemplates}

```ts
export type MessageTemplates = Partial<Record<RuleKind, MessageTemplate>>;
```

## 校验视图

### Validation {#validation}

视图层的校验视角：属性定义 → `label`，类型定义 → `component`，约束定义不被搬运，校验器仍读取字段本身；`Validation` 只描述校验状态与宿主追加的自定义实现。它作为 `View.validation` 出现在每个字段投影上，`View` 的完整形状见[视图投影与竞选](/types/model/rendering#view)。

```ts
export interface Validation {
  /** 由 Schema.required 派生 */
  required: boolean;
  /** 由字段 nullable 派生 */
  nullable?: boolean;
  /** 宿主自定义校验实现；schema 约束不进入这里 */
  rules?: Rule[];
  messages?: MessageTemplates;
}
```

## 表单规则

### FormRule {#formrule}

`useForm` / Form 组件消费的单字段规则：返回 `true` 通过，返回字符串作为错误信息；支持异步。

```ts
export type FormRule<T = unknown> = (
  value: T,
  values: Record<string, unknown>,
) => string | true | Promise<string | true>;
```

### FormRules {#formrules}

字段名到规则（或规则数组）的映射。

```ts
export type FormRules<T extends Record<string, unknown>> = Partial<
  Record<keyof T, Array<FormRule> | FormRule>
>;
```

## 表单上下文

### FormContext {#formcontext}

`useForm` / Form 向子字段提供的整表上下文。

```ts
export interface FormContext {
  /** 整表值的只读快照（响应式对象） */
  values: Record<string, unknown>;
  /** 整表校验错误映射 */
  errors: Record<string, string | undefined>;
  /** 注册字段，返回注销函数 */
  registerField: (name: string | number, controller: FormFieldController) => () => void;
  /** 读取字段在表单规则中的校验器 */
  getFieldRules?: (name: string | number) => unknown;
  /** 提交表单（经 useForm 编排，触发校验与 submit 事件） */
  submit: () => Promise<void>;
  /** 重置整表 */
  reset: () => void;
  /** 字段值变化时回写整表聚合值 */
  setFieldValue?: (name: string | number, value: unknown) => void;
  /** 是否禁用整表 */
  disabled?: boolean;
  /** label 位置等布局信息（仅传递，不参与逻辑） */
  labelPosition?: 'left' | 'right' | 'top';
}
```

### FormFieldContext {#formfieldcontext}

单个字段的上下文，FormItem 与控件共享。

```ts
export interface FormFieldContext {
  /** 字段名 */
  name: string | number;
  /** 当前校验错误信息（无错误为 undefined） */
  error?: string;
  /** 是否被触碰过（blur 后置 true） */
  touched: boolean;
  /** 控件 id（label/aria 关联） */
  fieldId: string;
  /** 校验状态变化时由控件调用 */
  setError?: (error: string | undefined) => void;
}
```

### FormFieldController {#formfieldcontroller}

字段注册到表单的控制器。

```ts
export interface FormFieldController {
  validate: () => Promise<string | true> | string | true;
  reset: () => void;
  clearValidate: () => void;
  getValue?: () => unknown;
  setValue?: (value: unknown) => void;
}
```
