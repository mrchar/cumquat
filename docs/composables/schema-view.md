---
title: 视图转换器
---

# 视图转换器

[`Schema`](/types/model/form#schema) 只描述数据本身，组件消费的是视图投影 [`View`](/types/model/rendering#view)。本页的函数是默认转换器 [`Converter`](/types/model/rendering#converter) 的实现与可复用的字段级辅助函数：资源池 `useResources` 的 `view` 选项缺省即使用它们，宿主也可以脱离资源池单独调用。

## createView

创建一个 schema → 视图转换器。

```ts
function createView(options?: CreateViewOptions): Converter;

interface CreateViewOptions {
  /** 自定义控件推断：返回 undefined 时回落内置推断 */
  component?: (name: string, field: Schema) => string | undefined;
  /** 自定义标签：缺省 title 回落字段名 */
  label?: (name: string, field: Schema) => string | undefined;
}
```

转换器实现 [`Converter`](/types/model/rendering#converter) 的两个方法：

- `toField(name, field, context)`：投影单个字段，产出 [`View`](/types/model/rendering#view)
- `toFields(schema, hints)`：投影整张 schema，按 `schema.required` 派生各字段必填态，并过滤暂不可渲染的结构型字段

```ts
import { createView, type Schema, type View } from '@mrchar/cumquat';

const converter = createView({
  // 全局改写控件推断：未命中的字段回落内置规则
  component: (name, field) => (name === 'bio' ? 'textarea' : undefined),
  label: (name, field) => field.title ?? `字段 ${name}`,
});

const fields: View[] = converter.toFields(schema, hints);
```

### 投影规则

| View 成员 | 取值来源 |
| --- | --- |
| `label` | `options.label` 自定义 → `field.title` → 字段名 |
| `component` | `options.component` 自定义 → [`componentOf`](#componentof) 内置推断 |
| `validation.required` | 对象级 `schema.required` 是否包含该字段 |
| `validation.nullable` | `field.nullable` 为真时写入 |
| `description` | `field.description` 原样透传 |
| `help` | [`helpOf`](#helpof) 合成的帮助提示 |
| `props.options` | [`optionsOf`](#optionsof) 由 enum 生成的选项 |
| `props.placeholder` / `props.bias` | 字段 [`Hint`](/types/model/rendering#hint) 上的视图提示 |
| `props.format` | `field.format` |

`toFields` 会过滤结构型字段：`type` 为 `array` / `object` 且没有 `hint.control` 指定控件的字段不进入投影；在 `toField` 中单点调用不受此限制。

## defaultView

`createView()` 的无定制实例，是资源池的缺省转换器：

```ts
const defaultView: Converter = createView();
```

`useResources({ view })` 不传 `view` 时即使用它；自定义转换器后可整体替换，见[资源池](/composables/resources#使用说明)。

## componentOf

单字段的内置控件推断，`createView` 内部也调用它，可单独用于自研转换器。

```ts
function componentOf(field: Schema, hint?: Hint): string;
```

推断顺序：

1. `hint.control` 显式指定 → 直接采用
2. `field.enum` 非空 → `'select'`
3. 按 `field.type`：`boolean` → `'switch'`；`integer` / `number` → `'number'`
4. `string` 且 `format === 'date'` → `'date'`
5. 其余情况（含未知类型）→ `'input'`

```ts
componentOf({ type: 'boolean' }); // 'switch'
componentOf({ type: 'string', enum: ['a', 'b'] }); // 'select'
componentOf({ type: 'string' }, { control: 'mention' }); // 'mention'
```

控件名命中同名渲染器时生效，竞选机制见[视图投影与竞选](/types/model/rendering)。

## helpOf

把字段的描述与示例合成一条帮助提示，两者都缺省时返回 `undefined`。

```ts
function helpOf(field: Schema): string | undefined;
```

- 仅有 `description` → 原样返回
- 仅有 `example` → 返回 `示例：xxx`（对象 / 数组示例经 JSON 序列化）
- 两者都有 → 以中文分号 `；` 拼接

## optionsOf

由 enum 字段生成组件可直接消费的 [`Option`](/types/model/resources#option) 列表；字段没有 enum 或 enum 为空时返回 `undefined`。

```ts
function optionsOf(field: Schema, hint?: Hint): Option[] | undefined;
```

选项 `value` 取 enum 原值；`label` 优先取 `hint.enumLabels` 中同下标的文案，缺省把值字符串化：

```ts
optionsOf(
  { type: 'string', enum: ['open', 'closed'] },
  { enumLabels: ['进行中', '已关闭'] },
);
// [
//   { label: '进行中', value: 'open' },
//   { label: '已关闭', value: 'closed' },
// ]
```

## 相关

- [资源池 useResources](/composables/resources)：`view` 选项的消费方，`fields` / `columns` / `filters` / `properties` 均由转换器投影
- [视图投影与竞选类型](/types/model/rendering)：[`Converter`](/types/model/rendering#converter) / [`View`](/types/model/rendering#view) / [`Hint`](/types/model/rendering#hint) 契约
- [数据校验](/composables/validation)：约束留在 schema 节点上，转换器只表达视图层校验状态
