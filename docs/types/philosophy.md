---
title: 类型参考 · 设计理念
---

# 设计理念

使用大多数组件库时，状态由页面持有：请求、loading、错误、分页参数都写在页面里，组件只接收最终的 `rows` / `value`。Cumquat 换了一种分工：**页面只提供“怎么处理数据”的函数和“数据长什么样”的定义，状态流转交给组件。**

这一分工全部落实在类型上。本页只讲类型为什么是现在的形状；用法见[状态自持](/state)、[元数据导出](/metadata)指南，字段释义见后续各页。

## 一、处理函数：属性是函数，不是数据

```ts
type FetchHandler<T>     = (query: FetchQuery) => FetchResult<T> | Promise<FetchResult<T>>;
type ActionHandler       = (...args: unknown[]) => Promise<ActionResult | void> | ActionResult | void;
type SubscribeHandler<T> = () => Promise<SubscribeResult<T>> | SubscribeResult<T>;
```

传函数而不是结果，**请求时机就属于组件**（首次拉取、翻页参数都不必进入页面类型）。fetch 与另两者的差异在于：它是资源工厂，产出的 `FetchResult` 对象把状态与方法封装在一起，组件侧只调 `execute / abort`；竞态与取消的**实现**留给宿主，组件不建控制器、不注入 `signal`。三种 handler 消费后归一为同一组观察面 `status / data / error / execute / abort`。

**handler 的载荷就是组件的 model，只是方向不同：**

- **出站**：fetch 资源对象的 `data` 与组件本地数据属性同型——`Table.rows: T[]`、`Statistic` 的值 `T`，`PagedResult<T>` 只多一个 `total`。本地写法里手动的 `rows.value = (await fetchUsers(q)).list`，在 `:fetch` 之后连同赋值时机一起被组件接管，组件读取的资源 `data` 观察面就是这份 model。
- **入站**：action 的可变参数由组件注入，注入的就是当前 model——`Form` 传整表 `values`，输入控件传新值，`Tabs` 传激活 `key`，`Table` 行操作传当前 `row`，`Button` 无参。action 只回传 `ActionResult` 成败结果（失败可回滚 model），不产生新的数据。

另有几个类型取舍：handler 统一允许 `Promise<T> | T` 同步返回；fetch 的数据载荷 `FetchData<T>` 用 `T[] | PagedResult<T> | T` 联合形态让组件按结构识别列表 / 分页 / 单值，分页留在 data 内部而不进入协议顶层；成败可走异常或带 `status` 的 `AsyncResult` 两条通道，`error` 保持 `unknown`，fetch 的 `execute` 失败不 reject、统一写 `error` 状态；`FetchQuery` 由组件单向注入（分页、关键词、排序、筛选，**不含 signal**），不回写宿主状态；订阅的 `data` 允许是响应式对象，解析一次后由响应式系统持续更新。定义见[核心类型](/types/basics/core)。

## 二、数据定义：Schema 是纯数据

```ts
interface Schema extends Meta, Type, Constraint {}
```

`Schema` 是递归的 JSON Schema 节点，`properties`、`items`、组合分支都是它自身；属性（`title` / `description`）、类型（`type` / `format` / `enum`）、约束（`minimum` / `pattern` / `minItems`）合在同一节点，不再设 `Field` 这类平行类型。

三条边界：

1. **约束留在 Schema 上**，校验器直接读取，不复制成规则，避免两个事实来源；
2. **`Rule` 只承载 Schema 表达不了的实现**（跨字段比较、远程校验），独立于 schema 传入——Constraint 是声明，Rule 是实现；
3. **视图提示不进 Schema**：`Hint`（控件偏好、场景标记）挂在 `Resource` 上，一份数据定义可中立服务于列表、筛选、表单。

## 三、视图投影：View 是产物，不是第二份定义

```ts
interface Converter {
  toField(name: string, schema: Schema, context: Context): View;
  toFields(schema: Schema, hints?: Record<string, Hint>): View[];
}
```

`View`（`label` / `component` / `validation` / `props`）是 Schema + Hint 的投影：`title → label`、`description/example → help`、`type/format/enum → component`、`required → validation.required`，约束不搬运。页面无需维护第二套字段表；`Converter` 契约也让默认推导可整体替换。

控件的最终裁决靠竞选：渲染器按数据信号（`type` / `format` / `enum` / `props`）自评 `fitness`，最高分接管，显式指定与插槽始终可覆盖。展示侧（Cell）与录入侧（Field）是同构的两套契约，定义见[视图投影与竞选](/types/model/rendering)。

## 四、资源：一份定义导出行为与形态

```ts
interface ResourceClient<T> {
  list: FetchHandler<T>;       // 直接绑给 Table 的 :fetch
  create: ActionHandler;       // 直接绑给 Form 的 :action
  columns: ResourceColumn[];   // 列表投影
  properties: View[];          // 表单投影
}
```

`ResourceClient` 的方法类型**就是**处理函数类型——资源池不是另一套获取 API，而是批量产出符合组件协议的 handler 与视图投影。OpenAPI / Swagger / 自定义协议的差异收敛在 `MetadataParser` / `RequestAdapter` 之后，页面接触到的类型始终统一。定义见[资源池类型](/types/model/resources)。

## 类型地图

| 设计意图 | 核心类型 | 详解 |
| --- | --- | --- |
| 函数托管与统一状态 | `FetchHandler` · `ActionHandler` · `SubscribeHandler` · `AsyncResult` · `Snapshot` | [核心类型](/types/basics/core) |
| 纯数据定义 | `Schema`（`Meta` · `Type` · `Constraint`） | [数据模型与表单](/types/model/form) |
| 声明与实现分离 | `Constraint`（在 Schema 上）· `Rule` · `Rules` · `Validator` | [数据模型与表单](/types/model/form) |
| 视图投影与竞选 | `Hint` · `View` · `Converter` · `CellRenderer` · `FieldRenderer` | [视图投影与竞选](/types/model/rendering) |
| 协议归一 | `Resource` · `Registry` · `ResourceClient` · `ResourcePool` | [资源池类型](/types/model/resources) |
