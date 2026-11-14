---
title: Form 表单
---

# Form 表单

字段容器与校验编排，配合 FormItem 使用。

| Prop          | 类型                      | 默认值   | 说明                                                                             |
| ------------- | ------------------------- | -------- | -------------------------------------------------------------------------------- |
| modelValue    | `Record<string, unknown>` | -        | 整表值（受控或作为初始值）                                                       |
| rules         | [`FormRules`](/types/model/form#formrules)               | `{}`     | 校验规则表（详见 composables 文档）                                              |
| disabled      | `boolean`                 | `false`  | 整表禁用                                                                         |
| labelPosition | `'top' \| 'left'`         | `'top'`  | 标签摆放位置                                                                     |
| labelWidth    | `string`                  | `'6rem'` | 左排标签宽度                                                                     |
| properties    | [`View`](/types/model/rendering#view)`[]`         | -        | 字段视图：绑定后按[竞选机制](/campaign)的字段侧（Field）自动生成完整表单（生成字段在前、插槽在后） |
| schema        | [`Schema`](/types/model/form#schema)        | -        | 纯数据模型：`properties` + 对象级 `required`；内部用 `createValidator` 派生字段视图与规则（见[数据校验](/composables/validation)） |
| validation    | [`Rules`](/types/model/form#rules)        | -        | 自定义校验与跨字段检查：与纯数据 schema 分离 |
| view          | [`Converter`](/types/model/rendering#converter)        | 内置转换器 | schema → 视图的转换器，可整体替换 |
| controls      | [`FieldRenderer`](/types/model/rendering#fieldrenderer)`[]`         | -        | 局部控件渲染器：与全局注册共同参与竞选，同名显式指定与同分时局部优先             |
| action        | [`ActionHandler`](/types/basics/core#actionhandler) | -        | 提交动作：校验通过后由组件自行调用，执行期间自动禁用整表（如资源客户端的 `create` / `update`） |

| 事件              | 参数                                          | 说明           |
| ----------------- | --------------------------------------------- | -------------- |
| update:modelValue | `values: Record<string, unknown>`             | 任意字段值更新 |
| submit            | `values: Record<string, unknown>`             | 校验通过后触发（传了 `action` 时仍会触发，动作由组件执行） |
| invalid           | `errors: Record<string, string \| undefined>` | 校验失败       |

| 插槽           | 说明                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------ |
| default        | 表单内容，slot props：`{ values, errors, valid, dirty, submitting, submit, reset }`        |
| `field-{name}` | 覆盖单个生成字段，slot props：`{ field, value, error, setValue }`（properties 绑定时生效） |

Expose：`values / errors / valid / dirty / submitting / validate() / validateField(name) / reset() / clearValidate() / submit()`。

```vue
<Form v-model="form" :rules="rules" @submit="onSubmit">
  <FormItem name="username" label="用户名" required>
    <Input name="username" />
  </FormItem>
  <Button type="primary" native-type="submit">提交</Button>
</Form>
```

## 字段竞选

绑定 `properties` 字段视图后，表单自动生成完整字段：每个控件渲染器（Field）对**完整字段视图**自我评价返回适配度分数，竞选代理按字段裁决取最高分（同分先注册者优先，全部弃权回落文本输入框）。`component` 是首选控件名，命中同名渲染器即生效；`props.format` 描述内容格式；`validation.required` 决定必填。

- 优先级链路：字段插槽（`#field-{name}`）> `component` 命中 > 竞选推断 > 默认输入框
- 内建推荐：`enum` → 下拉选择、`boolean` → 开关、`number` / `integer` → 数值输入、`format: date` → 日期选择、其余 → 文本输入；`props.format` 为 `email` / `url` / `password` / `textarea` 时切换输入形态
- 必填派生：未传 `schema` 时，`validation.required` 为 `true` 的字段自动获得必填校验（「{label}不能为空」），宿主 `rules` 按字段名叠加其后；录入修正即时清除错误
- 外部调整三层：`props.bias` 加成、显式指定 `component`、`registerField` 同名覆盖；Form 的 `controls` 属性传入局部渲染器

```vue
<template>
  <Form v-model="form" :properties="properties" :rules="rules" @submit="onSubmit">
    <Button type="primary" native-type="submit">提交</Button>
  </Form>
</template>

<script setup lang="ts">
import type { View } from '@cumquat/core';

const empty = { required: false, rules: [] };

const properties: View[] = [
  { name: 'name', label: '姓名', component: 'input', validation: { ...empty, required: true } },
  { name: 'email', label: '邮箱', component: 'input', props: { format: 'email' }, validation: empty },
  { name: 'age', label: '年龄', component: 'number', validation: empty },
  { name: 'active', label: '启用', component: 'switch', validation: empty },
  {
    name: 'status',
    label: '状态',
    component: 'select',
    props: {
      options: [
        { label: '活跃', value: 'active' },
        { label: '休假', value: 'leave' },
      ],
    },
    validation: empty,
  }, // component 命中 → 下拉选择
];
</script>
```

宿主扩展：按同一契约注册自定义 Field（机制设计、评分约定与扩展契约详见[竞选机制](/campaign)）。

## 数据模型驱动（schema）

`schema` 把属性定义、类型定义与约束定义合成一个数据模型，通常直接来自资源池：

```vue
<Form :schema="userApi.schema" :action="userApi.create" />
```

- 渲染：未指定 `properties` 时，用内置转换器（或 `view`）把 `schema.properties` 投影为字段视图再参与竞选；同时传 `properties` 时只以它决定渲染字段，规则仍来自 `schema` 与 `validation`。
- 校验：显式 `rules` 在前，schema 约束与 `validation` 派生规则随后；传入 `schema` 时不再按字段视图的 `validation.required` 重复派生必填，避免同一字段出现两条必填规则。
- 必填星号：取字段视图的 `validation.required`（即 `schema.required` 的投影）。
- 跨字段规则（`validation.checks`）在整表提交时执行，错误挂到 `target` 或首个参与字段上。

规则本身的写法、类型与 OpenAPI 映射见[数据校验](/composables/validation)。

## 交互演示

### 表单与校验

<CodeCard v-model:code="formCode" editable title="表单与校验">
  <LiveDemo :code="formCode" :scope="demoScope" />
</CodeCard>

### 字段竞选

<CodeCard v-model:code="fieldFormCode" editable title="字段竞选">
  <LiveDemo :code="fieldFormCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const formCode = ref(`
  <Form class="max-w-sm">
    <FormItem label="用户名" required>
      <Input placeholder="请输入用户名" />
    </FormItem>
    <FormItem label="邮箱" error="邮箱格式不正确">
      <Input placeholder="name@example.com" invalid />
    </FormItem>
    <FormItem label="备注">
      <Input placeholder="选填" />
    </FormItem>
    <Button type="primary" block>提交</Button>
  </Form>
`);

/** 竞选演示字段：component / props / validation 驱动控件选择 */
const fieldProperties = [
  { name: 'name', label: '姓名', component: 'input', validation: { required: true, rules: [] } },
  { name: 'email', label: '邮箱', component: 'input', props: { format: 'email' }, validation: { required: false, rules: [] } },
  { name: 'age', label: '年龄', component: 'number', validation: { required: false, rules: [] } },
  { name: 'active', label: '启用', component: 'switch', validation: { required: false, rules: [] } },
  {
    name: 'status',
    label: '状态',
    component: 'select',
    props: {
      options: [
        { label: '活跃', value: 'active' },
        { label: '休假', value: 'leave' },
      ],
    },
    validation: { required: false, rules: [] },
  },
  { name: 'remark', label: '备注', component: 'input', props: { format: 'textarea' }, validation: { required: false, rules: [] } },
];

const fieldFormCode = ref(`
  <Form
    class="max-w-sm"
    v-model="fieldValues"
    :properties="fieldProperties"
    @submit="onFieldSubmit"
  >
    <Button type="primary" native-type="submit" block>提交</Button>
  </Form>
`);

/** 演示表单值 */
const fieldValues = ref<Record<string, unknown>>({});

const onFieldSubmit = (values: Record<string, unknown>) => {
  window.alert(`校验通过：${JSON.stringify(values)}`);
};

/** LiveDemo 渲染作用域 */
const demoScope = { formCode, fieldProperties, fieldFormCode, fieldValues, onFieldSubmit };
</script>
