# 独立校验器与数据模型校验规则

## Context

当前校验能力内嵌在表单组合函数中：`Form.vue` 只派生必填规则，真正的校验由 `useForm` 与 `useFormField` 承担，规则是函数式的 `FormRule`。这带来两个限制：

- 数据校验无法脱离表单单独使用，无法在请求层、测试或非表单视图中复用。
- `useResources` 解析 OpenAPI 时丢弃了 `minLength`、`maximum`、`pattern`、`minItems` 等约束，数据模型并不完整。

目标是把校验拆成独立组合函数，并让校验规则成为数据模型的一部分：

1. `createValidator(schema)` 返回纯校验器，`validate(data)` 返回 `{ valid, errors }`。
2. `useValidator(schema)` 在其上提供响应式 `errors` / `valid`，便于绑定视图。
3. `useResources` 的客户端暴露 `schema`（字段 + 规则），OpenAPI 约束随模型一起产出。
4. `<Form>` 新增 `schema` 属性，内部用 `createValidator` 同时导出 `properties` 与 `rules`；原有 `properties` / `rules` 仍可手动指定。

设计原则保持“可拆可合”：每个能力都能单独使用，组合起来则一步完成。

## 公共 API

### 类型（新建 `packages/composables/src/form/validation-types.ts`）

```ts
export type ValidationFieldType =
  | 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';

export interface ValidationField {
  name: string;
  label: string;
  type: ValidationFieldType;
  format?: string;
  options?: Array<{ label: string; value: string | number }>;
  required?: boolean;
}

export interface FieldRule {
  required?: boolean;
  nullable?: boolean;
  type?: ValidationFieldType;
  enum?: Array<string | number>;
  min?: number;
  max?: number;
  /** 与 min/max 互斥的排他边界 */
  exclusiveMin?: number;
  exclusiveMax?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
  format?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  validate?: (
    value: unknown,
    values: Record<string, unknown>,
  ) => boolean | string | Promise<boolean | string>;
  message?: string | ((ctx: MessageContext) => string);
}

/** 跨字段 / 整表规则 */
export interface CheckRule {
  /** 参与的字段，用于文档与错误定位 */
  fields: string[];
  /** 错误挂载字段，缺省取 fields[0] */
  target?: string;
  validate: (
    values: Record<string, unknown>,
  ) => boolean | string | Promise<boolean | string>;
  message?: string | ((ctx: MessageContext) => string);
}

export interface ResourceRules {
  fields?: Record<string, FieldRule>;
  checks?: CheckRule[];
}

export interface ValidationSchema {
  fields?: ValidationField[];
  rules?: ResourceRules;
  messages?: MessageTemplates;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
```

`MessageTemplates` 是“规则类型 → 文案模板”的映射，支持 `{label}`、`{field}`、`{value}`、`{min}`、`{max}`、`{minLength}`、`{maxLength}`、`{pattern}` 等占位。**不引入 locale 机制**：内置中文默认值，按 `rule.message` → `schema.messages` → 工厂 `options.messages` 的优先级覆盖，完全由使用方控制。

### 校验器

新建 `packages/composables/src/form/createValidator.ts`：

```ts
export interface Validator<T extends Record<string, unknown> = Record<string, unknown>> {
  /** 可直接传给 Form 的 rules，也兼容 useForm */
  readonly rules: FormRules<T>;
  validate(values: T): Promise<ValidationResult>;
  validateField(name: string, values: T): Promise<string | true>;
}

export function createValidator<T extends Record<string, unknown>>(
  schema: ValidationSchema,
  options?: { messages?: MessageTemplates },
): Validator<T>;
```

新建 `packages/composables/src/form/useValidator.ts`：

```ts
export function useValidator<T extends Record<string, unknown>>(
  schema: MaybeRefOrGetter<ValidationSchema | undefined>,
  options?: { messages?: MessageTemplates },
): {
  rules: ComputedRef<FormRules<T>>;
  errors: Record<string, string | undefined>;
  valid: ComputedRef<boolean>;
  validating: Ref<boolean>;
  result: ComputedRef<ValidationResult>;
  validate(values?: T): Promise<ValidationResult>;
  validateField(name: string, values?: T): Promise<string | true>;
  reset(): void;
};
```

## 校验算法

`createValidator` 在创建时编译一次规则，输出 `FormRules`：

1. 字段规则顺序固定：`required` → `nullable` → `type` → `enum` → `min` / `max` / `exclusiveMin` / `exclusiveMax` / `multipleOf` → `minLength` / `maxLength` → `pattern` → `format` → `minItems` / `maxItems` / `uniqueItems` → 自定义 `validate`。
2. 空值判定：`undefined`、`null`、`''`、空数组为空；`0` 与 `false` 不为空。
3. 非必填字段遇到空值直接跳过其余约束；必填失败立即返回。
4. 类型判断：
   - `string` / `boolean` 用 `typeof`。
   - `number` 要求 `Number.isFinite`。
   - `date` / `datetime` 同时接受字符串与时间戳数字，以兼容 `DatePicker` 的数值模型。
   - `enum` 优先使用 `rule.enum`，否则取 `field.options` 的值，用 `Object.is` 比较。
5. 长度按 Unicode 码点计数；`pattern` 支持字符串，创建时编译并移除 `g` / `y` 标志，非法正则创建期抛错。
6. 内置 `format` 仅校验 `email`、`uri`、`uuid`、`ipv4`，未知格式忽略，避免误判 OpenAPI 自定义格式。
7. 跨字段规则编译到 `target ?? fields[0] ?? '$checks'` 这个 key 下，追加在该字段规则之后，因此 `useForm.validate()` 会自然覆盖它。
8. `validate` / `validateField` 复用现有 `normalizeRules` 与 `runRules`，保证与表单语义一致：顺序执行、首错即止、同步异常归一化为错误文案。
9. 错误结果只包含失败的字段，`valid = Object.keys(errors).length === 0`。

跨字段规则的触发限制：编译到单一锚点后，只有锚点字段变更/失焦或整表校验时执行。v1 在文档中说明；后续如需增强，可给 `CheckRule` 增加 `triggers`，不要编译成多份规则。

`useValidator` 的响应式处理：

- `validator` 为 `computed(() => createValidator(toValue(schema) ?? {}, options))`。
- `watch(validator, reset)`，schema 替换时清空错误。
- 每次校验递增 `generation`，await 后仅当 token 未过期才写入 `errors` / `validating`，避免竞态覆盖。

## 数据模型与 OpenAPI

### 类型调整（`packages/composables/src/resources/types.ts`）

- `ResourceFieldType` 改为 `ValidationFieldType` 的别名，`ResourceField extends ValidationField`，保留 `help` / `scope`。
- `ResourceDefinition` 新增 `rules?: ResourceRules`。
- 新增单资源模型：

```ts
export interface ResourceModel extends ValidationSchema {
  name: string;
}
```

- `ResourceClient` 新增 `readonly schema: ResourceModel`，同时保留现有 `fields` / `columns` / `filters` / `properties`。

### 客户端（`use-resources.ts`）

`client(name)` 增加 `schema` getter，返回 `{ name, fields: fieldsOf(), rules: definition.rules }`。未加载完成时 `fields` 为空、`rules` 为空，与现有 `properties` 行为一致。

### 解析器（`parse-open-api.ts`）

新增 `extractRules(doc, schema)`，从 create / update 请求体 schema 提取：

| OpenAPI | FieldRule |
| --- | --- |
| `required` | `required: true` |
| `nullable`（3.0） | `nullable: true` |
| `type` | `type` |
| `enum` | `enum` |
| `minimum` / `maximum` | `min` / `max` |
| `exclusiveMinimum` / `exclusiveMaximum` | 3.0 布尔时并入 `min` / `max` 的排他边界；3.1 数值时写 `exclusiveMin` / `exclusiveMax` |
| `multipleOf` | `multipleOf` |
| `minLength` / `maxLength` | 同名 |
| `pattern` | `pattern` |
| `format` | `format` |
| `minItems` / `maxItems` / `uniqueItems` | 同名 |

create 与 update 的同名规则按 `create` 优先、`update` 补齐缺失键合并；`required` 取并集。该限制写入文档。

## Form 集成

`Form.vue` 新增 `schema?: ValidationSchema`：

```ts
const validator = computed(() => (props.schema ? createValidator(props.schema) : undefined));
const effectiveProperties = computed(() => props.properties ?? props.schema?.fields);
```

规则合并优先级：

1. 显式 `rules` 在前。
2. schema 派生的规则随后。
3. 传入 `schema` 时不再执行旧的 `properties[].required` 循环，避免同一字段生成两条必填规则。
4. `FormItem` 的必填星号改为 `schema.rules?.fields?.[name]?.required ?? field.required`。

`properties` 与 `schema` 同时传入时，`properties` 只覆盖渲染字段，规则仍来自 schema 与显式 `rules`；文档需写明。

`#field-{name}` 插槽、字段竞选、`writeFieldValue` 的“已有错误才重校验”行为保持不变。

## 实施顺序

1. 新建 `form/validation-types.ts`，包含类型与内置中文文案。
2. 新建 `form/createValidator.ts`，实现规则编译与校验结果。
3. 新建 `form/useValidator.ts`，实现响应式与竞态保护。
4. 调整 `resources/types.ts`：复用校验类型、增加 `rules`、`ResourceModel`、`schema`。
5. 调整 `parse-open-api.ts`：提取字段约束并写入 `definition.rules`。
6. 调整 `use-resources.ts`：暴露 `client.schema`。
7. 更新 `packages/composables/src/index.ts` 的导出。
8. 调整 `Form.vue` 支持 `schema`，并处理 required 星号与规则合并。
9. 补测试。
10. 更新文档与侧边栏。

## 测试

- `packages/composables/src/__tests__/form/createValidator.test.ts`
  - 必填、`0` / `false` 非空、可选空值跳过。
  - 各类型、`date` 接受字符串与时间戳、`enum`。
  - `min` / `max` / 排他边界 / `multipleOf`。
  - 码点长度、字符串与 RegExp `pattern`、非法正则创建期抛错。
  - `format`、数组约束、首错即止、异步与抛错归一化。
  - 消息覆盖优先级与占位替换。
  - 跨字段检查的 `target`、缺省锚点与 `$checks`。
- `packages/composables/src/__tests__/form/useValidator.test.ts`
  - `errors` / `valid` / `validating` 状态。
  - schema 替换后清空。
  - 延迟校验的过期结果丢弃。
- `packages/composables/src/__tests__/resources/parse-open-api.test.ts`
  - 请求体约束提取、required 合并、OpenAPI 3.0 与 3.1 的排他边界差异、无约束不产生空规则。
- `packages/composables/src/__tests__/resources/use-resources.test.ts`
  - `client.schema` 的 `{ name, fields, rules }` 形状与未加载时行为。
- `packages/components/src/components/__tests__/form-controls.spec.ts`
  - `<Form :schema>` 渲染字段与必填星号、提交校验、显式 `rules` 优先、跨字段检查、不重复报错。

## 文档

- 新增 `docs/composables/validation.md`：`createValidator` / `useValidator`、规则表、消息覆盖、跨字段检查、与 OpenAPI 的映射。
- `docs/.vitepress/config.mts` 的“表单”分组加入 `validation`。
- 更新 `docs/composables/resources.md`：`ResourceDefinition.rules`、`client.schema`、约束提取范围与 create/update 合并限制。
- 更新 `docs/components/form.md`：`schema` 属性、与 `properties` / `rules` 的优先级。
- 更新 `docs/types.md`：新增校验类型契约。
- 在 `docs/composables/form.md` 增加与校验器的交叉链接。

## 验证

1. `pnpm -C packages/composables build`
2. `pnpm -C packages/components build`
3. `pnpm -C packages/cumquat build`
4. `pnpm -C docs build`
5. 运行新增与相关测试；若测试运行器仍无法启动，如实记录，不声称通过。
6. `git diff --check`

## 关键文件

- `packages/composables/src/form/validation-types.ts`（新建）
- `packages/composables/src/form/createValidator.ts`（新建）
- `packages/composables/src/form/useValidator.ts`（新建）
- `packages/composables/src/form/form-types.ts`（复用 `FormRule` / `FormRules`）
- `packages/composables/src/resources/types.ts`
- `packages/composables/src/resources/parse-open-api.ts`
- `packages/composables/src/resources/use-resources.ts`
- `packages/composables/src/index.ts`
- `packages/components/src/components/data-entry/Form.vue`
