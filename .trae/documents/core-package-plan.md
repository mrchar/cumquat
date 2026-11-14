# 新增 @cumquat/core 核心包（schema 优先）

## Context

当前核心契约分散在 `packages/composables`：异步状态在 `src/types.ts`，fetch 契约与 Vue 控制器混在 `src/data/fetch.ts`，资源 schema 在 `src/resources/types.ts`，校验类型在 `src/form/validation-types.ts`。更关键的是类型层次反了：`ResourceField extends ValidationField`、`ResourceModel extends ValidationSchema`，把 validation 当成了基类型。

本次以 **schema 为数据核心** 重构：schema 定义字段、约束与模型，validation 只是 schema 的一个视图（`Pick` 出校验所需属性）。同时把纯契约与纯逻辑内聚到内部包 `@cumquat/core`，Vue 组合函数留在 composables；内部源码直接 `import '@cumquat/core'`，对外由 `@mrchar/cumquat` 主包统一导出。`@cumquat/core` 为 private workspace 包，不独立发布，由主包作为 bundledDependency 打入 tarball。

## Schema 与 validation 的层次

```text
SchemaDefinition           字段 + 规则，数据 schema 的基类型
├── SchemaModel            具名数据模型（原 ResourceModel）
└── SchemaResource         schema 中的资源条目 = SchemaDefinition + 操作（原 ResourceDefinition）
Schema                     资源表 { resources }（原 ResourceSchema）

SchemaField                字段唯一规范定义（原 ResourceField）
└── ValidationField        Pick<SchemaField, 'name'|'label'|'type'|'format'|'options'|'required'>
ValidationSchema           { fields?: ValidationField[]; rules?: SchemaRules; messages? }  ← schema 的视图
ValidationResult           校验输出
```

依赖方向固定为 `schema → validation 视图`，不再出现 validation 作为基类型。`SchemaModel` / `SchemaResource` 结构上可赋给 `ValidationSchema`，`createValidator` / `Form` 无需改调用方式。

## 目标结构

```text
packages/core/
  package.json          # @cumquat/core, private: true
  tsconfig.json
  vite.config.ts        # vp pack, platform neutral, dts
  src/
    index.ts
    types.ts            # 异步契约：Status/AsyncState/AsyncResult/Action*/Subscribe*/Controlled*
    fetch.ts            # Fetch* 契约 + isPagedResult / normalizeFetchResult
    result.ts           # extractAsyncFailure / asyncErrorText
    schema.ts           # schema 契约（单文件）：SchemaField* / SchemaDefinition / SchemaModel / SchemaResource / Schema / SchemaRules / FieldRule / CheckRule / Message*、Resource 运行时契约，以及 Validation* 视图类型
```

`core` 不依赖 vue、不依赖 composables；`composables/components → core`；`@mrchar/cumquat → core + composables + components`。

## 类型重命名与兼容别名

核心新名与旧名（core 内同时导出别名，`@mrchar/cumquat` 通过 `export *` 继续暴露）：

| 规范名（schema 核心） | 旧名（兼容别名） |
| --- | --- |
| `SchemaFieldType` | `ResourceFieldType`、`ValidationFieldType` |
| `SchemaFieldOption` | `ResourceFieldOption` |
| `SchemaField` | `ResourceField` |
| `SchemaFieldScope` | —（从 `ResourceField.scope` 内联结构提取） |
| `SchemaRules` | `ResourceRules` |
| `SchemaDefinition` | —（新基类型：`fields` + `rules`） |
| `SchemaModel` | `ResourceModel` |
| `SchemaResource` | `ResourceDefinition` |
| `Schema` | `ResourceSchema` |

保留 Resource 前缀的运行时/资源契约：`ResourceMethod`、`ResourceOperation`、`QueryNames`、`ListResponseMapping`、`ResourceColumn`、`MetadataParser`、`ResourceRequest`、`RequestAdapter`、`UseResourcesOptions`、`ResourceClient`、`ResourcePool`。

`FieldRule`、`CheckRule`、`MessageContext`、`MessageTemplate`、`MessageTemplates` 属于 schema 的约束元数据，直接放在 `schema.ts`；`ValidationField`、`ValidationSchema`、`ValidationResult` 作为视图类型也在同一文件，用注释分隔区块，不另建目录。

## 迁移映射

| 源文件 | 去向 | 留在此处 |
| --- | --- | --- |
| `composables/src/types.ts` | `core/src/types.ts`（整文件） | — |
| `composables/src/data/fetch.ts` 顶部契约与两个纯函数 | `core/src/fetch.ts` | `FetchController`、`createFetchController`、`useFetch`、`useFetchResource` |
| `behavior/useActionState.ts` 的 `extractActionFailure`、`actionErrorText` | `core/src/result.ts`，统一命名 `extractAsyncFailure`、`asyncErrorText` | `useActionState` |
| `data/useSubscribe.ts` 的 `extractSubscribeFailure`、`subscribeErrorText` | 复用 `core/src/result.ts` | `useSubscribe` |
| `resources/types.ts` | `core/src/schema.ts`，按上表改名并保留别名 | `parse-open-api.ts`、`create-fetch-adapter.ts`、`use-resources.ts` |
| `form/validation-types.ts` 类型部分 | 约束/消息类型与 validation 视图类型都并入 `core/src/schema.ts` | `DEFAULT_VALIDATION_MESSAGES` |

`ResourceDefinition` 改为 `SchemaResource`，并 `extends SchemaDefinition` 增加操作字段；`ResourceModel` 改为 `SchemaModel extends SchemaDefinition`，不再 extends `ValidationSchema`。

## 实施步骤

### 1. 创建 core 包

`packages/core/package.json`：

```json
{
  "name": "@cumquat/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "files": ["dist"],
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "scripts": {
    "build": "cross-env NODE_OPTIONS=--max-old-space-size=4096 vp pack",
    "test": "vp test run"
  },
  "devDependencies": {
    "cross-env": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

`tsconfig.json` 继承根配置，`include: ["src/**/*.ts", "vite.config.ts"]`。

```ts
// packages/core/vite.config.ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: { entry: ['./src/index.ts'], platform: 'neutral', dts: true },
  test: { environment: 'node' },
});
```

根 `tsconfig.json` 的 `compilerOptions.paths` 增加 `"@cumquat/core": ["./packages/core/src/index.ts"]`。

### 2. 建立 schema-first 类型

`core/src/schema.ts`，上半部分为 schema 核心（字段 / 模型 / 资源表 / 约束 / 消息）：

```ts
export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';
export interface SchemaFieldScope { list?: boolean; filter?: boolean; create?: boolean; update?: boolean; }
export interface SchemaField {
  name: string;
  label: string;
  type: SchemaFieldType;
  format?: string;
  options?: SchemaFieldOption[];
  required?: boolean;
  help?: string;
  scope?: SchemaFieldScope;
}
export interface SchemaDefinition {
  fields?: SchemaField[];
  rules?: SchemaRules;
}
export interface SchemaModel extends SchemaDefinition { name: string; }
export interface SchemaResource extends SchemaDefinition {
  list?: ResourceOperation;
  detail?: ResourceOperation;
  create?: ResourceOperation;
  update?: ResourceOperation;
  remove?: ResourceOperation;
  queryNames?: QueryNames;
  response?: ListResponseMapping;
}
export interface Schema { resources: Record<string, SchemaResource>; }

export type ResourceField = SchemaField;
export type ResourceDefinition = SchemaResource;
export type ResourceSchema = Schema;
export type ResourceModel = SchemaModel;
export type ResourceRules = SchemaRules;
export type ResourceFieldType = SchemaFieldType;
export type ResourceFieldOption = SchemaFieldOption;
```

同一文件的 validation 视图区块（紧接 schema 核心，`ValidationField` 为 `Pick` 视图）：

```ts
// —— validation 视图 ——
export type ValidationFieldType = SchemaFieldType;
export type ValidationField = Pick<
  SchemaField,
  'name' | 'label' | 'type' | 'format' | 'options' | 'required'
>;
export interface ValidationSchema {
  fields?: ValidationField[];
  rules?: SchemaRules;
  messages?: MessageTemplates;
}
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
```

`SchemaModel` / `SchemaResource` 结构上可赋给 `ValidationSchema`，`createValidator(userApi.schema)` 与 `<Form :schema>` 的调用不变。

### 3. 迁移 fetch / result 纯逻辑

- `core/src/fetch.ts`：`FetchPagination/Sorter/Query/PagedResult/FetchResult/FetchHandler/NormalizedFetch`、`isPagedResult`、`normalizeFetchResult`。
- `core/src/result.ts`：`extractAsyncFailure(result: unknown)`、`asyncErrorText(error: unknown, fallback?)`。
- `data/fetch.ts` 只保留 Vue 控制器与 hook，从 `@cumquat/core` 导入。
- `useActionState.ts`、`useActionValue.ts`、`useChat.ts`、`useChatInput.ts`、`useSubscribe.ts` 改用 core helper；删除本地重复实现。

### 4. composables 导入与重命名

约 21 个文件，把 `../types`、`./types`、`./validation-types` 改为 `@cumquat/core`，并同步规范名：

- `resources/use-resources.ts`：`ResourceSchema/Schema`、`ResourceField/SchemaField`、`ResourceModel/SchemaModel` 等 19 处改名。
- `resources/parse-open-api.ts`：16 处改名，使用 `Schema`、`SchemaField`、`SchemaDefinition`、`SchemaResource`。
- `form/validation-types.ts`：只保留 `DEFAULT_VALIDATION_MESSAGES`，从 core 引 `RuleKind`。
- `form/createValidator.ts`、`form/useValidator.ts`：从 core 引 `ValidationField/ValidationSchema/FieldRule/SchemaRules/Message*`。
- `resources/create-fetch-adapter.ts`：从 core 引 `ResourceRequest/RequestAdapter`。
- `composables/package.json` 增加 `"@cumquat/core": "workspace:*"`。
- `composables/src/index.ts` 删除核心类型与 helper 导出（`Status` 等、`extractActionFailure/actionErrorText`、`extractSubscribeFailure/subscribeErrorText`、`normalizeFetchResult/isPagedResult`、全部 schema/validation 类型），仅保留 `DEFAULT_VALIDATION_MESSAGES` 与 Vue API。

### 5. components 迁移

- `components/package.json` 增加 `"@cumquat/core": "workspace:*"`。
- 核心类型从 `@cumquat/composables` 改为 `@cumquat/core`：`ActionHandler`、`AsyncState`、`FetchHandler`、`FetchResult`、`MountTarget`、`Placement`、`SubscribeHandler`、`ValidationSchema`、`isPagedResult`、`actionErrorText`、`subscribeErrorText`；`Form.vue`、`fields.ts`、表单测试中的 validation 类型同步改用 core 规范名。
- 其余 `use*`、`Use*Return`、表单运行时类型继续从 composables 导入。

### 6. 测试解析 core 源码

根 `ready` 顺序是 check → test → build，测试阶段 core dist 不存在。给 `composables/components` 的 `vite.config.ts` 增加：

```ts
import { fileURLToPath } from 'node:url';

test: {
  alias: [{
    find: /^@cumquat\/core$/,
    replacement: fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
  }],
}
```

不添加 `deps.alwaysBundle`：core 是 dependencies，vp pack 默认外部化；主包通过 `bundledDependencies` 提供 core，避免重复打进 composables/components。

测试调整：

- `parse-open-api.test.ts`、`openapi-fixtures.ts`、`use-resources.test.ts` 改用 core 的 `Schema/SchemaField/SchemaResource`，断言形状不变。
- `createValidator.test.ts`、`useValidator.test.ts` 改用 core 的 `ValidationSchema/ValidationResult`。
- `useActionState.test.ts`、`useSubscribe.test.ts` 改用 `asyncErrorText/extractAsyncFailure`。
- core 新增 `fetch.test.ts`、`result.test.ts`，覆盖归一化与错误文案。

### 7. 主包与开发环境

`packages/cumquat/package.json`：`dependencies` 增加 `"@cumquat/core": "workspace:*"`，`bundledDependencies` 增加 `"@cumquat/core"`。

`packages/cumquat/src/index.ts`：

```ts
import Cumquat from '@cumquat/components';

export * from '@cumquat/core'; // 同时包含 Schema* 规范名与 Resource* 兼容别名
export * from '@cumquat/composables';
export * from '@cumquat/components';

export {
  extractAsyncFailure as extractActionFailure,
  extractAsyncFailure as extractSubscribeFailure,
  asyncErrorText as actionErrorText,
  asyncErrorText as subscribeErrorText,
} from '@cumquat/core';

export default Cumquat;
export * as composables from '@cumquat/composables';
export * as components from '@cumquat/components';
```

- `docs/.vitepress/config.mts` 增加 `@cumquat/core` 源码 alias；`docs/package.json` 增加 core workspace 依赖。
- `playground/vite.config.ts` 增加 core 源码 alias，避免 core 未构建时 `pnpm dev` 解析失败。
- 同步文档与 skills 中的类型名：`docs/types/resources.md`、`docs/types/forms.md`、`docs/types/overview.md`、`docs/types/index.md`、`docs/types/philosophy.md`、`docs/metadata.md`、`docs/composables/resources.md`、`docs/composables/validation.md`、`skills/cumquat-components/SKILL.md`、`skills/cumquat-composables/SKILL.md`。规范名优先，旧名仅在兼容说明中出现。

## 验证

```bash
pnpm install
pnpm exec vp check --no-fmt
pnpm exec vp run -r test
pnpm exec vp run -r build

grep -rn '@cumquat/core' packages/composables/dist packages/components/dist packages/cumquat/dist
pnpm -C packages/cumquat pack
tar -tzf packages/cumquat/*.tgz | grep '@cumquat/core/dist/index.d.ts'
node -e "import('@mrchar/cumquat').then(m => console.log(typeof m.isPagedResult, typeof m.asyncErrorText, typeof m.SchemaField))"
```

额外类型断言（可在 `vp check` 中覆盖）：

```ts
// SchemaModel 可赋给 ValidationSchema，validation 只是视图
const model: SchemaModel = { name: 'user', fields: [], rules: {} };
const view: ValidationSchema = model;
```

说明：composables/components 的 dist 保留 `import '@cumquat/core'` 是允许的，前提是主包 tarball 内含 core；若 pack 发现 private 依赖未被打入，回退方案是给 composables/components 增加 `deps.alwaysBundle: ['@cumquat/core']`，代价是重复打包。

## 风险

- 这是一次公开类型重命名。`@mrchar/cumquat` 通过 `export * from '@cumquat/core'` 同时暴露新旧名，兼容旧代码；文档以新名为主。
- `SchemaModel` / `SchemaResource` 结构上必须保持可赋给 `ValidationSchema`，否则 `createValidator` 与 `<Form :schema>` 会断裂，类型检查需重点覆盖。
- `pnpm pack` 对 private workspace bundledDependency 的处理需实测；失败则采用 alwaysBundle 回退。
- 单独构建 composables 而 core 未构建可能失败；依赖 `vp run -r build` 的拓扑顺序，或先构建 core。
- 分阶段执行：core 创建 → schema 类型改名 → composables → components → umbrella/docs；每阶段可单独回滚。
