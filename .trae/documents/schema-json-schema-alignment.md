# Schema 三层模型与视图转换

## Context

`packages/core/src/schema.ts` 目前把数据定义与展示信息揉在一起：`type` 含 `date/datetime/enum`，展示用 `label/help/options`，必填是字段布尔，约束用 `min/max`。这既偏离 JSON Schema / OpenAPI，也没有表达出「资源定义 → 视图」的转换关系。

目标模型：`Schema` 表达**资源定义**，由三层内涵组成——**属性定义、类型定义、约束定义**；转到视图层后换成另一套视角——**label、component、validation**。`schema.ts` 同时表达：资源如何持有 schema、视图层如何表达、两者之间的转换契约（转换器类型在 core，默认实现在 composables，用户可替换）。类型命名保持简洁。

## 命名对照

| 旧名 | 新名 |
|---|---|
| `SchemaFieldType` | `Kind` |
| `SchemaFieldOption` | `Option` |
| `SchemaFieldScope` | `Scope` |
| `SchemaFieldView` | `Hint` |
| `SchemaField` | `Field` |
| `SchemaRules` | `Rules` |
| `FieldRule` | `Rule` |
| `SchemaDefinition` | `Schema` |
| `SchemaModel` | `Model` |
| `SchemaResource` | `Resource` |
| `Schema`（资源表） | `Registry` |
| `ValidationSchema` / `ValidationField` | 删除，由 `View` / `Validation` 取代 |
| `SchemaViewConverter` | `Converter` |

属性定义层 `Meta`、类型定义层 `Type`、约束定义层 `Constraint`，`Field = Meta & Type & Constraint`。

## 目标类型（`packages/core/src/schema.ts`）

### 三层 schema

```ts
/** 类型词汇：JSON Schema 子集 */
export type Kind = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';

/** 属性定义：标识与元数据 */
export interface Meta {
  title?: string;
  description?: string;
  default?: unknown;
  example?: unknown;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
}

/** 类型定义 */
export interface Type {
  type?: Kind;
  format?: string;                 // date / date-time / email / uri / int64…
  enum?: Array<string | number | boolean | null>;
  const?: unknown;
  nullable?: boolean;              // OpenAPI 3.0 兼容
  items?: Field;                   // array 元素
  properties?: Record<string, Field>;  // 嵌套对象
  required?: string[];             // 嵌套对象必填
  additionalProperties?: boolean | Field;
  allOf?: Field[];
  anyOf?: Field[];
  oneOf?: Field[];
  not?: Field;
}

/** 约束定义：命名对齐 JSON Schema */
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

/** 视图提示：不参与数据语义 */
export interface Hint {
  scope?: Scope;
  control?: string;                // 强制指定控件
  placeholder?: string;
  bias?: Record<string, number>;   // 控件竞选加权
  enumLabels?: string[];           // 与 enum 下标对齐
}

export interface Scope { list?: boolean; filter?: boolean; create?: boolean; update?: boolean; }

/** 字段 = 属性定义 + 类型定义 + 约束定义 + 视图提示 */
export interface Field extends Meta, Type, Constraint { view?: Hint; }

/** 资源数据定义 */
export interface Schema {
  type?: 'object';
  properties: Record<string, Field>;
  required?: string[];             // 对象级必填，JSON Schema 原义
  rules?: Rules;                   // 宿主覆盖与非标准校验
}
```

### 资源与注册表

```ts
export interface Model { name: string; schema: Schema; }

export interface Resource extends Model {
  list?: ResourceOperation;
  detail?: ResourceOperation;
  create?: ResourceOperation;
  update?: ResourceOperation;
  remove?: ResourceOperation;
  queryNames?: QueryNames;
  response?: ListResponseMapping;
}

/** 资源表 */
export interface Registry { resources: Record<string, Resource>; }
```

### 视图层：label / component / validation

```ts
export interface Validation {
  /** 由 Schema.required 派生 */
  required: boolean;
  /** 由 Type + Constraint + rules.fields 覆盖编译出的规则 */
  rules: Rule[];
  messages?: MessageTemplates;
}

export interface View {
  name: string;
  /** 标签：title 回落 name */
  label: string;
  description?: string;
  help?: string;                   // description + example
  /** 控件标识：input/select/number/date/date-time/switch… */
  component: string;
  /** 控件附加属性：options、placeholder 等 */
  props?: Record<string, unknown>;
  /** 校验视图 */
  validation: Validation;
}
```

### 转换契约（core 只定义类型）

```ts
export interface Context {
  name: string;
  required: boolean;
  schema: Schema;
}

/** schema → 视图 的转换器；默认实现由 composables 提供，用户可替换 */
export interface Converter {
  toField(name: string, field: Field, context: Context): View;
  toFields(schema: Schema): View[];
}
```

`Rule` 只保留宿主覆盖与非标准扩展：`type/enum/const/format/pattern/minimum/maximum/exclusiveMinimum/exclusiveMaximum/multipleOf/minLength/maxLength/minItems/maxItems/uniqueItems/validate/message`；删除 `required/nullable`。`Rules = { fields?: Record<string, Rule>; checks?: CheckRule[] }`。`RuleKind`、`MessageContext`、`DEFAULT_VALIDATION_MESSAGES` 同步改用 `minimum/maximum/exclusiveMinimum/exclusiveMaximum`。

删除全部 `Resource*` 兼容别名（`ResourceField/ResourceFieldType/ResourceFieldOption/ResourceRules/ResourceDefinition/ResourceSchema/ResourceModel`）；保留 `ResourceColumn/ResourceOperation/ResourceClient/ResourceRequest/ResourcePool/ResourceMethod`。

## 三层 → 视图映射（默认实现规则）

| schema 层 | 视图层 | 规则 |
|---|---|---|
| `Meta.title/description/example` | `label/description/help` | `label = title ?? name`；`help = description + example` |
| `Type.enum` | `component = select` | `props.options = enum` + `view.enumLabels` |
| `Type.type = boolean` | `component = switch` | — |
| `Type.type = integer/number` | `component = number` | — |
| `type: string + format: date/date-time` | `component = date/date-time` | — |
| `type: string` | `component = input` | — |
| `type: array/object` | 不生成控件 | 除非 `view.control` 强制指定 |
| `Constraint.*` | `validation.rules` | 与 `rules.fields[name]` 合并，后者覆盖 |
| `Schema.required` | `validation.required` | 字段名是否在数组中 |
| `view.scope` | 资源投影 | `columns/filters/properties` 过滤依据 |

## 逐文件改造

1. `packages/core/src/schema.ts`：按上文重写三层 schema、`Model/Resource/Registry`、`View/Validation`、`Converter`、`Rule/Rules`；删除旧 `SchemaField/Field` 兼容别名。
2. `packages/core/src/index.ts`：导出更新；core 不含转换实现。
3. `packages/composables/src/resources/schema-view.ts`（新建）：`createView(options?): Converter` 默认实现，负责 label 回落、help、控件竞选、约束→规则编译；导出 `defaultView`。
4. `packages/composables/src/resources/parse-open-api.ts`：产出 `Registry`；`extractProperties` 原样保留 `type`（含 `integer`）、`format`、`enum`、`nullable` 与全部约束关键字；`type` 数组归一（`[T,'null'] → T + nullable`）；`required` 在 create/update 合并取并集；`scope/control/enumLabels` 写入 `field.view`；不再生成 `fields`、不再把约束翻译成 `FieldRule`。
5. `packages/composables/src/resources/use-resources.ts`：`UseResourcesOptions.schema` 改为 `registry`（`Registry | MetadataParser`）；新增 `view?: Converter`；`ResourceClient.schema` 返回 `Model`；`fields/properties/filters` 返回 `View[]`（经 `converter.toFields` 并按 `view.scope` 过滤）；`columns` 返回 `ResourceColumn[]`（由 `View` + `Field` 投影）。
6. `packages/core/src/schema.ts` 保留 `ResourceColumn`：`key/title/help/type/format/enum/sortable/filters`，由 composables 投影填充。
7. `packages/composables/src/form/createValidator.ts`：接收 `Schema` + 可选 `Converter`；逐字段执行 `View.validation.rules`；`matchesType` 支持 `integer/array/object/null`；`string + format: date/date-time` 继续兼容时间戳数字；`null && nullable` 在类型判断前放行。
8. `packages/composables/src/form/useValidator.ts`、`validation-types.ts`：类型与默认文案键同步为规范名。
9. `packages/components/src/components/data-entry/fields.ts`：控件竞选改读 `View.component`；`view.control/bias` 仍可覆盖；删除对 `type: 'date'/'datetime'/'enum'` 的判断。
10. `packages/components/src/components/data-entry/Form.vue`：`schema` 改为 `Schema`，新增 `view?: Converter`（默认 `defaultView`）；`properties` 改为 `View[]`；必填读 `field.validation.required`；模板 `label` 直接取 `field.label`。
11. `packages/components/src/components/data-display/cells.ts`、`Table.vue`：列类型仍为 `Kind`，新增 `enum?: unknown[]`；enum/日期判定改看 `enum`/`format`；number 接受 `integer`。
12. 测试：core `schema.test.ts`；composables `resources/{parse-open-api,use-resources}.test.ts`、`openapi-fixtures.ts`、`form/{createValidator,useValidator}.test.ts`；components `__tests__/{form-controls,data-display}.spec.ts`。断言改为 `Registry/Resource/Schema/properties/required/view`、`View` 三字段、规范类型与约束名。
13. 文档：`docs/types/resources.md`、`docs/types/forms.md`、`docs/types/overview.md`、`docs/types/index.md`、`docs/types/philosophy.md`、`docs/composables/resources.md`、`docs/composables/validation.md`、`docs/metadata.md`、`docs/components/form.md`、`docs/components/table.md`；`skills/cumquat-components/SKILL.md`、`skills/cumquat-composables/SKILL.md`。需新增「三层 schema 与 label/component/validation 视图」说明章节。

## 风险与易漏点

- `Schema` 语义变更（资源表 → 单个数据定义），原 `Schema.resources` 迁到 `Registry.resources`；`useResources({ schema })` 改名 `registry` 是破坏性变更，文档与 playground 同步。
- `view` 取代字段内 `scope`：`refine` 回调、OpenAPI fixtures、use-resources 测试都要同步。
- `enumLabels` 必须与 `enum` 下标对齐；`refine` 改 `enum` 时需同步标签。
- 默认转换实现在 composables；components 只能从 core 导入契约类型。
- `createValidator` 依赖 `View.validation.rules`，自定义 converter 必须保证 rules 完整；文档需说明契约职责。
- create/update 合并的 `required` 采用并集语义，需在 `docs/composables/validation.md` 明确。
- `null` 不能被当作普通空值提前跳过；`nullable` 判断必须在 `type` 之前。
- array/object 属性默认不生成控件，除非 `view.control` 指定。

## 验证

```bash
pnpm -r --filter './packages/*' build
pnpm -C packages/core exec vitest run --pool=threads --no-file-parallelism
pnpm -C packages/composables exec vitest run --pool=threads --no-file-parallelism
pnpm -C packages/components exec vitest run --pool=threads --no-file-parallelism
pnpm exec vp check --no-fmt
pnpm -C docs build
```

预期：composables 既有 1 个 SSR overlay 失败、components 既有 2 个 overlay/文案失败保持不变，其余全绿。
