---
title: 字段竞选
---

# 字段竞选

> 机制已随 Form 落地：内建 Field 集与 `registerField` 由 @cumquat/components 导出，Form 支持 `properties` / `controls`，字段支持 `control` / `bias`。用法速览见 [Form 表单](/components/form)。

## 动机

表单页里「这个字段用什么控件」与列表页里「这一格显示什么」是同一类问题。字段元数据已经描述了两层事实：

- **type**：数据的保存格式（string / number / boolean / date / enum…）
- **format**：内容的格式（email / uri / textarea / password…）

同一 type 的字段，录入方式可能完全不同：`enum + options` 应生成下拉选择，
`boolean` 应生成开关，`number` 应生成数值输入，`date` 应生成日期选择。
资源池的 `properties` 投影（创建 / 编辑场景字段）天然携带这些元数据。

传统做法各有困境：

- 表单内部硬编码 if/else：不可扩展，每支持一种控件就加深一处分支
- 宿主逐字段手写 FormItem + 控件：字段一多元数据驱动就失去意义

目标：**Form 直接绑定 properties 定义，控件由字段定义自动推断**；宿主与第三方
可以插入新的控件实现，而无需修改表单内部。

## 设计原则

1. **自包含的控件渲染器**：每个 Field 只声明「我擅长什么、我怎么装配控件」，不感知其他 Field，不依赖注册顺序
2. **自我评价代替注册表匹配**：Field 对**整个字段定义**返回一个**适配度分数**，由**竞选代理**裁决，声明式且可组合。评价输入不限于 type / format，字段的任何字段（name、label、options、required、宿主附加字段…）都可参与
3. **按字段竞选，不按值竞选**：一个字段裁决一次、整个生命周期统一控件策略；值的合法性由控件与校验规则负责（如 enum 值不在 options 中由 Select 自行显示）
4. **兜底恒在**：所有 Field 弃权时回落默认文本输入框，机制对「随手写 properties」的用户零打扰
5. **装配不侵入**：Field 只负责「选型 + 装配 v-model」，控件自身的交互协议（action、键盘焦点、a11y、fetch / subscribe 选项）原样保留，不在竞选层重复实现

## 机制

### 核心概念

- **Field（控件渲染器）**：`字段定义 + 当前值 + 上下文 → 控件节点` 的实现。控件节点是既有表单控件的装配结果，值经上下文 `setValue` 写回整表。
- **适配度分数（fitness）**：Field 对**完整字段定义**的自我评价，纯函数、无副作用。输入是字段定义整体——name、label、type、format、options、required、placeholder…以及宿主附加的自定义字段；type / format 只是其中常用字段，不是评分的全部。约定：正数越大越适配，`0` 表示弃权不参与。分数只在一次竞选中相互比较，没有跨字段的绝对意义。
- **竞选代理**：无状态裁决者。对每个字段收集全部注册 Field 的分数，取最高者；**同分时先注册者优先**（稳定、可预期）；无正分则回落默认输入框。

### 运行流程（每字段一次）

1. 代理取出该字段的完整定义（含宿主附加字段）
2. 遍历注册表，各 Field 依据字段定义自我评价，返回适配度分数
3. 应用字段上的外部加成（`bias`，正负均可）
4. 取最高分（同分先注册者优先）；无正分回落默认输入框
5. 被选中的 Field 装配控件并接入表单值与错误上下文
6. 字段存在显式配置或插槽时跳过竞选（见下）

### 优先级链路

```
字段插槽 > 显式指定 control > 竞选推断 > 默认输入框
```

- **字段插槽**（`#field-{name}`）：完全交给宿主，复合控件、级联布局走这里，优先级最高
- **显式指定 control**：宿主在字段定义上按名称指定某个 Field（如 `control: 'select'`），指定即生效，不走分数
- **竞选推断**：默认路径，零配置
- **默认输入框**：兜底，文本录入

### 外部调整

竞选之外提供三层外部调整，从轻到重：

| 层级 | 位置              | 语义                                                                                                          |
| ---- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| 加成 | 字段定义 `bias`   | `bias?: Record<string, number>`，对指定 Field 加减分，正负均可；代理在裁决前应用，可翻转竞选结果而无需注册新 Field |
| 指定 | 字段定义 `control` | 按名称显式指定 Field，跳过竞选（见优先级链路）                                                                |
| 覆盖 | 注册表            | 同名重注册替换既有实现（含内建），全局调整某一类字段的控件                                                    |

- 加成示例：某备注字段想用多行文本，`bias: { input: +10 }` 即可在不声明 format 的情况下翻转结果
- 覆盖示例：宿主重注册 `date`，全部日期字段统一换用自家选择器
- Form 的 `controls` 属性可传入局部渲染器，与全局注册共同参与竞选；显式指定的名称在局部注册命中时以局部为准
- 三层调整都不改变优先级链路，只改变「竞选推断」这一层的结果

### 表单专属语义

- **值写回**：Field 装配的控件经上下文 `setValue` 写回整表值；已存在校验错误的字段在写回后自动重新校验，录入修正即时清除错误
- **必填派生**：`required: true` 的字段自动获得必填规则（提示「{label}不能为空」），随字段注册进表单参与整表校验；宿主 `rules` 按字段名叠加在派生规则之后
- **值语义**：值类型由选中控件自身定义（Select 是选项 value，DatePicker 遵循其取值契约），竞选层不做值转换
- **布局**：生成字段逐行渲染 FormItem（label / 必填标记 / 错误提示自动接线），默认插槽内容追加在生成字段之后（提交按钮等仍走插槽）

## 契约

```ts
/** 竞选输入：完整字段定义（ResourceField 结构兼容，宿主附加字段原样进入评价输入） */
interface FormFieldMeta {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';
  format?: string;
  options?: Array<{ label: string; value: string | number }>;
  required?: boolean;
  placeholder?: string;
  control?: string;               // 显式指定控件渲染器名称
  bias?: Record<string, number>;  // 竞选加成
}

/** 装配上下文：控件的值与错误经此接入表单 */
interface FieldContext {
  name: string;
  disabled: boolean;
  error: string | undefined;
  setValue: (value: unknown) => void;
}

/** Field 契约（示意） */
interface FieldRenderer {
  /** 注册名：显式指定的目标 */
  name: string;
  /** 自我评价：完整字段定义 → 适配度分数，0 表示弃权 */
  fitness: (field: FormFieldMeta) => number;
  /** 装配：值 + 字段定义 + 上下文 → 控件节点 */
  render: (value: unknown, field: FormFieldMeta, ctx: FieldContext) => VNodeChild;
}
```

## 内建 Field 与评分约定

| Field  | 得分依据                                 | 装配效果                                                       |
| ------ | ---------------------------------------- | -------------------------------------------------------------- |
| input  | 恒为 `1`（兜底）                         | 文本输入框；`format: textarea` / `multiline` → 多行；`format: email` / `uri` / `password` → 对应原生输入类型 |
| number | `type: number` → `80`                    | 数值输入框                                                     |
| switch | `type: boolean` → `90`                   | 开关                                                           |
| select | `type: enum` → `100`                     | 下拉选择，options 映射为选项                                   |
| date   | `type: date` → `90`                      | 日期选择器                                                     |

- 表中得分依据仅是内建 Field 的实现选择（恰好使用 type / format）；契约本身允许 Field 依据字段定义的任何字段评价。评分不看字段值，值只进入装配阶段
- `format` 得分普遍高于同 source 的 `type` 得分：内容格式比保存格式更具体，更具体者优先（如 `string + email` 的原生邮箱输入优先于兜底文本框）
- 内建集刻意保持克制；`datetime` 组合选择、`time` 时刻选择、`color` 取色器等留给宿主按同一契约扩展

## 扩展

宿主按同一契约注册自定义 Field，参与全局竞选或局部竞选：

```ts
/** 注册「取色器」Field：对 format: color 给出高分，其余弃权 */
registerField({
  name: 'color',
  fitness: (field) => (field.format === 'color' ? 95 : 0),
  render: (value, field, ctx) =>
    h(ColorPicker, {
      modelValue: (value as string | null) ?? null,
      'onUpdate:modelValue': ctx.setValue,
      disabled: ctx.disabled,
    }),
});
```

- 宿主已有请求字段只需在字段元数据上补 `format: 'color'`，表单即自动换用取色器装配——**扩展点在 Field，不在 Form**
- `FormFieldMeta` 是完整字段定义：宿主在 properties 上附加的自定义字段原样进入评价输入，Field 可依据自有字段评分
- 局部渲染器经 Form 的 `controls` 属性传入，适合页面级一次性控件；全局注册适合全站统一的控件策略

## 与既有机制的关系

- **字段元数据**：properties 的 `type` / `format` 是可选提示字段——来自资源池投影时自动携带；宿主手写 properties 时缺省全部走兜底输入框，机制无害
- **FormItem 与插槽**：既有手写布局完全不变，竞选只接管 `properties` 绑定下的自动生成；`#field-{name}` 与手写 FormItem 可共存于同一表单
- **校验**：`rules` 仍是宿主职责，机制只派生必填这一条；其余规则（格式、长度、异步校验）按字段名叠加
- **主题**：装配的控件是既有组件，语义 class 与 CSS 变量走既有主题机制，无新增样式负担
- **单元格竞选**：同一套「自我评价 + 代理裁决 + 三层外部调整」的机制形态，一个管展示（Cell），一个管录入（Field）；资源池的 `columns` 与 `properties` 投影分别对接两者

## 非目标

- **不做整表 schema 校验 DSL**：校验规则收敛在 `rules`，机制只派生必填
- **不做字段联动编排**：联动是响应式对象机制的职责（如「A 填写后 B 必填」由宿主 rules 闭包实现）
- **不做异步字段**：选项获取属于控件自身 fetch / subscribe 的职责
- **不碰布局**：栅格、分组、分步是布局组件的职责，机制只逐行产出 FormItem
