---
title: 数据校验
---

# 数据校验

数据校验围绕纯数据 schema 展开：字段的三层定义（属性 / 类型 / 约束）提供内置校验，自定义实现与跨字段规则作为独立配置传入。校验器只负责执行它们，因此校验能力可以从表单中完全拆出，也可以与 Form 一步组合。

- `createValidator(schema)`：纯校验器，`validate(data)` 返回 `{ valid, errors }`，不依赖组件与响应式。
- `useValidator(schema)`：在其上维护 `errors` / `valid` / `validating`，直接绑定视图。
- `<Form :schema="schema">`：内部用 `createValidator` 经转换器投影出字段视图，同时渲染与校验。
- `pool.client('users').schema`：随资源池一起导出，接上述任意一种用法。

## 快速上手

### 独立校验

```ts
import { createValidator } from '@mrchar/cumquat';

const validator = createValidator({
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', title: '姓名', minLength: 2, maxLength: 20 },
    email: { type: 'string', title: '邮箱', format: 'email' },
  },
});

const result = await validator.validate({ name: 'A', email: 'bad' });
// {
//   valid: false,
//   errors: {
//     name: '姓名长度不能少于2个字符',
//     email: '邮箱格式不正确',
//   },
// }
```

`validator.rules` 是编译后的 [`FormRules`](/types/model/form#formrules)，可直接交给 `Form` / `useForm`，与 `validate()` 使用同一套语义。

### 响应式校验（绑定视图）

```ts
import { useValidator } from '@mrchar/cumquat';

const { errors, valid, validating, validate, validateField } = useValidator(schema);

await validate(form);          // 整表校验，写入 errors
await validateField('email', form); // 单字段校验，只更新该字段
```

| 成员                          | 说明                                                  |
| ----------------------------- | ----------------------------------------------------- |
| `rules`                       | `ComputedRef<`[`FormRules`](/types/model/form#formrules)`>`，编译后的规则表              |
| `errors`                      | `Record<string, string \| undefined>`，失败字段 → 文案 |
| `valid`                       | 当前是否无错误（未校验时为 `true`）                   |
| `validating`                  | 是否有校验正在进行                                    |
| `result`                      | 最近一次结果 `{ valid, errors }`                      |
| `validate(values?)`           | 整表校验，返回 [`ValidationResult`](/types/model/form#validationresult)                     |
| `validateField(name, values?)` | 单字段校验，通过返回 `true`                           |
| `reset()`                     | 清空错误与进行中状态                                  |

`schema` 支持 `MaybeRefOrGetter`：替换 schema 会自动重建校验器并清空状态；异步校验以代次令牌保护，过期结果不会覆盖新结果。

### 与资源池、Form 组合

```ts
const userApi = pool.client('users');

// 单独校验
const validator = createValidator(userApi.schema);

// 或一步渲染 + 校验
```

```vue
<Form :schema="userApi.schema" :action="userApi.create" />
```

## Schema 结构

校验不定义新的数据模型：schema 是纯数据定义，不携带视图提示或校验实现。`Schema` 由三层定义组合，并可递归嵌套：

```ts
/** JSON Schema 节点：递归描述任意值；属性值同样是 Schema */
interface Schema extends Meta, Type, Constraint {}
```

校验器读取两份来源，职责互不重叠：`Converter` 把每个字段投影为 `View`，提供 `label` / `component` / `validation.required`；**内置约束直接从 schema 节点读取**；`Rule` 只承载 schema 无法表达的自定义校验，通过 `createValidator(schema, { rules })` 独立传入。默认转换器做了三件事：

1. `title`（缺失回落字段名）→ `label`
2. `type` / `format` / `enum` → `component` 与可渲染的 `props`
3. `schema.required` → `validation.required`

```ts
interface Validation {
  required: boolean;
  /** 仅放行 null，不改变必填语义 */
  nullable?: boolean;
  /** 宿主自定义校验实现；schema 约束不进入这里 */
  rules?: Rule[];
  messages?: MessageTemplates;
}
```

内置约束由字段本身携带，校验器直接读取，不需要任何翻译：

| 字段键                                         | 说明                                                       |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `type` / `enum` / `const`                      | 类型检查；取值集合                                          |
| `minimum` / `maximum`                          | 数值闭区间                                                 |
| `exclusiveMinimum` / `exclusiveMaximum`        | 数值开区间                                                 |
| `multipleOf`                                   | 数值倍数，带浮点容差                                       |
| `minLength` / `maxLength`                      | 字符串长度，按 Unicode 码点计数                            |
| `pattern`                                      | 字符串或 `RegExp`；创建期编译，非法正则直接抛错            |
| `format`                                       | 内置 `email` / `uri` / `url` / `uuid` / `ipv4` / `date`，未知格式忽略 |
| `minItems` / `maxItems` / `uniqueItems`        | 数组约束                                                   |

[`Rule`](/types/model/form#rule) 只有两个键，用于补充 schema 表达不了的逻辑：

| 键        | 说明                                                       |
| --------- | ---------------------------------------------------------- |
| `validate` | 自定义校验：`true` 通过、字符串作为错误文案、`false` 用默认文案，支持 Promise |
| `message`  | 该字段的文案覆盖，优先于模型与全局模板                     |

[`CheckRule`](/types/model/form#checkrule) 用于跨字段 / 整表规则：

```ts
interface CheckRule {
  /** 参与字段，用于文档与错误定位 */
  fields: string[];
  /** 错误挂载字段，缺省取 fields[0]；都为空时落到保留键 $checks */
  target?: string;
  validate: (values) => boolean | string | Promise<boolean | string>;
  message?: MessageTemplate;
}
```

## 执行语义

1. 单个字段的顺序固定：`required` → `nullable` → 字段约束（类型 → 枚举 / const → 数值约束 → 字符串约束 → 数组约束）→ 自定义 `rules`（`validate`）。
2. 任一约束失败立即返回该字段的错误，实现“首错即止”。
3. 空值判定：`undefined`、`null`、`''`、空数组为空；`0` 与 `false` 不为空。非必填字段遇到空值直接跳过其余约束。
4. `type: 'string'` + `format: 'date'` / `'date-time'` 同时接受字符串与时间戳数字，兼容 DatePicker 的数值模型；`integer` 用 `Number.isInteger` 判定；`enum` 用 `Object.is` 比较。
5. 规则内抛出的异常会归一化为该字段的错误文案。
6. 校验结果只包含失败字段，`valid` 由错误数量派生。
7. 校验覆盖 schema 的全部属性——包括 `array` / `object` 字段；只有表单布局会按视图的可渲染性做过滤。

字段本身就是约束来源：`type` / `format` / `enum` / `minimum` / `maxLength` 等直接写在 schema 节点上，校验器按字段读取；`createValidator` 的 `rules.fields` 只追加自定义校验实现，不与约束合并或覆盖。要改约束，直接改 schema。

## 文案

不引入 i18n / locale 机制，文案完全由使用方控制。优先级从高到低：

1. [`Rule`](/types/model/form#rule)`.message` / [`CheckRule`](/types/model/form#checkrule)`.message`（单条规则）
2. `createValidator(schema, { rules: { messages } })[ruleKind]`（模型级）
3. `createValidator(schema, { messages })[ruleKind]`（调用方）
4. 内置中文默认文案（`DEFAULT_VALIDATION_MESSAGES`）

模板支持 `{label}`、`{field}`、`{value}`、`{minimum}`、`{maximum}`、`{exclusiveMinimum}`、`{exclusiveMaximum}`、`{minLength}`、`{maxLength}`、`{minItems}`、`{maxItems}`、`{multipleOf}`、`{pattern}` 占位，也可以是接收上下文的函数。

```ts
createValidator(schema, {
  messages: { required: '{label}必填', type: () => '内容格式不正确' },
});
```

## 跨字段检查

跨字段规则编译到锚点字段（`target ?? fields[0] ?? '$checks'`），因此：

- 锚点字段变更 / 失焦时会重新执行；
- 整表 `validate()` / 表单提交时一定会执行；
- 其他参与字段变化不会单独触发该检查，整表校验仍然是最终保障。

## OpenAPI 约束映射

`useResources` 解析 OpenAPI 时，约束**留在 schema 节点上**，由校验器直接读取，不投影成 `Rule`：

| OpenAPI                                            | Schema 节点                                  | 说明                         |
| -------------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 对象级 `required`                                  | `schema.required`（create / update 取并集）  | 派生 `validation.required`   |
| `nullable`（3.0）                                  | `nullable: true`                             | 派生 `validation.nullable`   |
| `type` / `enum` / `format`                         | 同名保留（含 `integer`）                     | 校验器直接读取               |
| `minimum` / `maximum`                              | 同名                                         | 同名                         |
| `exclusiveMinimum` / `exclusiveMaximum`（3.1 数值） | 同名                                         | 同名                         |
| `exclusiveMinimum` / `exclusiveMaximum`（3.0 布尔） | 归一为数值形式                               | 同名                         |
| `multipleOf`                                       | 同名                                         | 同名                         |
| `minLength` / `maxLength` / `pattern`              | 同名                                         | 同名                         |
| `minItems` / `maxItems` / `uniqueItems`（数组）    | 同名                                         | 同名                         |

`type` 为数组时（如 `['string', 'null']`）归一为单类型 + `nullable: true`。

## 相关

- [资源池 useResources](/composables/resources)：`client.schema` 的产出方
- [表单模型](/composables/form)：`useForm` / `useFormField`
- [Form 表单](/components/form)：`schema` 属性的组件侧约定
