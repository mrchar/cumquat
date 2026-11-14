---
title: 元数据导出
---

# 元数据导出

同一个资源的列表、表单、详情通常共享同一批字段，页面却要重复声明。元数据导出把服务端已有的字段描述直接变成组件可绑定的 `columns`、`filters`、`properties`，避免在页面中重复维护。

## 示例演示

下面的表格和表单都没有手写字段定义，它们由 `useResources` 从同一份资源元数据中导出。创建一名成员后，表格会重新加载。

<CodeCard v-model:code="exportDemoCode" :default-expand="true" title="useResources 导出表格列和表单字段">
  <LiveDemo :code="exportDemoCode" />
</CodeCard>

演示中的资源表是文档解析的产物，成员数据与接口均在本地模拟；展开代码可以看到完整实现。

## 基本用法

### 创建资源池

```ts
// src/api/resources.ts —— 模块级创建一次，全站复用
import { useResources } from '@mrchar/cumquat';

export const pool = useResources({
  server: 'https://api.mock.test',
  doc: '/v3/api-docs', // 元数据文档地址，池初始化时自动拉取并解析
});

export const memberApi = pool.client('members');
```

### 绑定组件属性

```vue
<Table :columns="memberApi.columns" :fetch="memberApi.list" :size="20" />

<Form :properties="memberApi.properties" :action="memberApi.create">
  <Button type="primary" native-type="submit">创建</Button>
</Form>
```

到这里就没有字段定义需要手写了：列由 `columns` 导出，控件由 `properties` 交给竞选机制推断。

## 使用细节

### 元数据投影规则

`Schema` 是属性定义、类型定义、约束定义的组合，`hints.scope` 标记出现场景。投影时，原始定义直接给列，视图层再把它翻译成 `label / component`；约束不搬运，仍留在节点上供校验器读取：

| 导出         | 来源                                  | 逐字段映射                                                                                                        | 消费方                           |
| ------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `columns`    | `hints` 中 `scope.list` 为真 | `title` → `title`（缺省回落键名）；`type` / `format` 直接展开到列上供竞选；`enum` 投影为值 → 文案映射，同时作为筛选候选；`description` 与 `example` 合成 `help` | Table 的 `:columns`，单元格侧竞选 |
| `filters`    | `hints` 中 `scope.filter` 为真              | 经转换器投影为 `View`（`name` / `label` / `component` / `validation`）                                            | 筛选面板                         |
| `properties` | `hints` 中 `scope.create` 或 `update` 为真  | 经转换器投影为 `View`，控件由 `component` 指定                                                                    | Form 的 `:properties`，字段侧竞选 |
| `fields`     | 全部可渲染字段                        | 经转换器投影为 `View`，不做场景裁剪                                                                               | 需要自行装配的场景               |

schema 本身只描述「资源是什么」，不描述「用哪个控件」；控件由转换器把类型定义投影为 `component`，宿主仍可叠加插槽与自定义转换器覆盖。

### 使用 useMask 裁剪导出结果

`useResources` 导出的是资源的完整字段视图，不同页面可以按需选用其中一部分。例如，概览页不需要展示成员的级别，可以直接从导出结果中移除该列；快速创建表单也可以省略同名字段：

```ts
import { useMask } from '@mrchar/cumquat';

// 概览列表：移除 key 为 level 的列
const overviewColumns = useMask(
  memberApi.columns,
  { prop: 'key', value: 'level' },
);

// 快速创建表单：移除 name 为 level 的字段
const quickCreateProperties = useMask(
  memberApi.properties,
  { prop: 'name', value: 'level' },
);
```

返回形式由数据源决定：传入原始对象或数组时，直接返回一次性裁剪结果；传入 `ref` 或 getter 时，返回 `ComputedRef` 并随数据源和规则更新。两种形式都不会修改 `memberApi.columns` 和 `memberApi.properties`，因此同一份元数据可以同时供多个页面使用。

`useMask(source, ...rules)` 接收任意对象或数组，支持三种规则：

| 规则                      | 对数组                             | 对对象                         |
| ------------------------- | ---------------------------------- | ------------------------------ |
| `'password'`（属性名）    | 移除每个成员的同名属性             | 移除该属性                     |
| `{ prop, value }`         | 移除 `item[prop] === value` 的成员 | 原样返回（无成员可过滤）       |
| `(value, key) => boolean` | 按 `(item, index)` 移除匹配成员    | 按 `(value, key)` 移除匹配属性 |

规则可叠加并按顺序应用。只有数据源本身为 `ref` 或 getter 时，结果才会随数据源和规则响应式更新；这里的 `memberApi.columns` 与 `memberApi.properties` 是普通数组，因此只执行一次性裁剪。

### 列与字段的标识差异

列的标识是 `key`，字段的标识是 `name`。直接对数组传 `'password'` 会移除每个列对象中名为 `password` 的属性，而不是移除 `key` 为 `password` 的整列。

### 使用 refine 调整资源定义

要修正字段名、类型、选项或合并资源，属于解析后的结构调整，交给 `useResources` 的 `refine`；`useMask` 只做减法。

## 工作原理

### 整体工作流程

从服务端文档出发，产出组件可直接绑定的字段元数据；需要不同视角时，在产出结果上裁剪。

```text
元数据文档（Swagger / OpenAPI 或自定义协议）
        │  解析
        ▼
Registry
  resources[id].schema.properties   ← 字段的三层定义，hints.scope 标记场景
        │  投影：按场景过滤 + schema → 视图
        ├──────────────┬──────────────┬──────────────┐
        ▼              ▼              ▼
    columns         filters       properties
  （列表列）       （筛选项）      （表单字段）
        │              │              │
        └──────────────┴──────────────┘
                       ▼
       竞选机制：Cell / Field 依视图与类型选型
```

两个组合函数各管一段：

| 能力           | 职责                                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `useResources` | 解析文档 → 资源表 → 投影出 `columns` / `filters` / `properties`，并顺带生成 `list` / `create` 等请求方法                       |
| `useMask`      | 在导出结果上按页面或场景裁剪，只做减法，不动源定义                                                                                |

### 文档解析与资源表生成

`Registry` 是解析器与资源池之间唯一的契约。默认解析器读取 OpenAPI 的 `paths`：

| 文档特征                     | 归为     |
| ---------------------------- | -------- |
| `GET /users`（无路径参数）   | `list`   |
| `GET /users/{id}`            | `detail` |
| `POST /users`                | `create` |
| `PUT` / `PATCH /users/{id}`  | `update` |
| `DELETE /users/{id}`         | `remove` |

字段定义取自 schema 的 `properties`，并保持三层结构：

- **属性定义**：`title` / `description` / `example` / `default` 原样保留
- **类型定义**：`type`（含 `integer`）/ `format` / `enum` / `const` / `nullable` / `items` / `properties` 原样保留
- **约束定义**：`minimum` / `maximum` / `exclusiveMinimum` / `minLength` / `pattern` 等同名保留

`type` 不再被压缩成视图类型，`date-time` 仍是 `string` + `format: 'date-time'`；对象级必填取 `required` 数组，create / update 请求体合并取并集。

场景标记由字段出现的位置决定：列表响应属性 → `hints.scope.list`，创建请求体 → `hints.scope.create`，更新请求体 → `hints.scope.update`，非分页类查询参数 → `hints.scope.filter`。**未标记的字段不进入任何投影。**

### 字段投影与组件属性生成

资源池没有为每个视图各存一份数据，而是在读取时才投影：

```ts
get columns() {
  const hints = resource.hints ?? {};
  return Object.entries(resource.schema.properties)
    .filter(([key]) => hints[key]?.scope?.list)
    .map(([key, field]) => ({
      key,
      title: field.title ?? key,
      type: field.type,
      format: field.format,
      enum: field.enum,
    }));
}
```

因此 `columns` / `properties` 是**读时计算的 getter**：解析完成前为空数组，解析完成后即为完整结果，不存在「两份定义各自漂移」的可能。绑定请直接写 `memberApi.columns`，不要解构到本地常量——解构会取走求值那一刻的快照。

### 基于不可变数据的裁剪

传入原始对象或数组时，`useMask` 同步执行一次并返回新值；传入 `ref` 或 getter 时，它通过 `computed` 派生结果，在源或规则变化时重新计算。两种路径都不会改写原数据，因此可以在同一份导出结果上为不同页面生成独立的裁剪结果。

### 与竞选机制的衔接

导出只负责「给出定义」，不负责「选控件」。选型发生在渲染时：Cell 侧读列的 `type` / `format` / `enum`，Field 侧优先读视图的 `component`，未注册时再按渲染器评分竞选。详见[竞选机制](/campaign)。

### 使用边界

- **裁剪是展示层行为**：`useMask` 只影响页面拿到的视图元数据与数据，不改变服务端响应，也不构成权限边界；接口鉴权与数据脱敏仍须在服务端完成
- **移除不等于脱敏**：`useMask` 是把匹配项去掉；需要打码或替换值时，应由服务端返回脱敏结果，或在单元格 / 字段插槽中自行渲染

## 相关文档

- [资源池 useResources](/composables/resources)：接入方式、资源表契约与覆盖策略
- [竞选机制](/campaign)：导出的 `type` / `format` 如何决定展示与录入控件
- [类型参考](/types/model/resources)：[`Schema`](/types/model/form#schema) / [`ResourceColumn`](/types/model/resources#resourcecolumn) / [`Registry`](/types/model/resources#registry) 等导出类型的完整定义

<script setup lang="ts">
import { ref } from 'vue';

const exportDemoCode = ref(`
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Table, Form, Button, useResources } from '@mrchar/cumquat';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ===== 以下数据均来自服务端，此处用本地对象模拟 =====

// 资源表：真实项目中由 useResources 拉取 Swagger 文档后解析得到，这里直接提供解析产物
const serverRegistry = {
  resources: {
    members: {
      name: 'members',
      list: { method: 'GET', path: '/members' },
      create: { method: 'POST', path: '/members' },
      response: { list: 'records', total: 'total' },
      schema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            title: '姓名',
          },
          email: {
            type: 'string',
            title: '邮箱',
            format: 'email',
          },
          salary: {
            type: 'number',
            title: '薪资',
          },
          level: {
            type: 'string',
            title: '级别',
            enum: ['P7', 'P6'],
          },
        },
      },
      hints: {
        name: { scope: { list: true, create: true } },
        email: { scope: { list: true, create: true } },
        salary: { scope: { list: true, create: true } },
        level: {
          scope: { list: true, create: true },
          enumLabels: ['高级', '中级'],
        },
      },
    },
  },
};

// 服务端存储的成员数据：实际项目中由后端接口返回
const serverRows = reactive<Array<Record<string, unknown>>>([
  { name: '甲', email: 'a@mock.test', salary: 26000, level: 'P7' },
  { name: '乙', email: 'b@mock.test', salary: 18000, level: 'P6' },
]);

// 模拟服务端拉取元数据
const fetchRegistry = async () => {
  await delay(200);
  return serverRegistry;
};

// 模拟后端接口：GET 返回列表，POST 追加数据
const mockServer = async (request: { method: string; body?: unknown }) => {
  if (request.method === 'GET') {
    return { records: serverRows.map((row) => ({ ...row })), total: serverRows.length };
  }
  serverRows.unshift({ ...(request.body as Record<string, unknown>) });
  return { status: 'success', message: '已创建' };
};

// ===== 一次声明，批量导出资源方法与字段元数据 =====

const pool = useResources({
  server: 'https://api.mock.test',
  registry: fetchRegistry, // 真实服务改用 doc: '/v3/api-docs' 自动拉取并解析
  request: mockServer,
});

const memberApi = pool.client('members');

const reloadKey = ref(0);
const create = async (values: Record<string, unknown>) => {
  await memberApi.create(values);
  reloadKey.value += 1;
};
<\/script>

<template>
  <div class="flex flex-col gap-5">
    <Table :key="reloadKey" :columns="memberApi.columns" :fetch="memberApi.list" :size="20" />
    <Form :properties="memberApi.properties" @submit="create" style="max-width: 30rem">
      <Button type="primary" native-type="submit">创建成员</Button>
    </Form>
  </div>
</template>
`.trim());
</script>
