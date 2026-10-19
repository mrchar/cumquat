---
title: Form 表单
---

# Form 表单

字段容器与校验编排，配合 FormItem 使用。

| Prop          | 类型                      | 默认值   | 说明                                                                                     |
| ------------- | ------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| modelValue    | `Record<string, unknown>` | -        | 整表值（受控或作为初始值）                                                               |
| rules         | `FormRules`               | `{}`     | 校验规则表（详见 composables 文档）                                                      |
| disabled      | `boolean`                 | `false`  | 整表禁用                                                                                 |
| labelPosition | `'top' \| 'left'`         | `'top'`  | 标签摆放位置                                                                             |
| labelWidth    | `string`                  | `'6rem'` | 左排标签宽度                                                                             |
| properties    | `FormFieldMeta[]`         | -        | 字段元数据：绑定后按[字段竞选](/field)自动生成完整表单（生成字段在前、插槽在后）         |
| controls      | `FieldRenderer[]`         | -        | 局部控件渲染器：与全局注册共同参与竞选，同名显式指定与同分时局部优先                     |

| 事件              | 参数                                          | 说明           |
| ----------------- | --------------------------------------------- | -------------- |
| update:modelValue | `values: Record<string, unknown>`             | 任意字段值更新 |
| submit            | `values: Record<string, unknown>`             | 校验通过后提交 |
| invalid           | `errors: Record<string, string \| undefined>` | 校验失败       |

| 插槽                | 说明                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| default             | 表单内容，slot props：`{ values, errors, valid, dirty, submit, reset }`                           |
| `field-{name}`      | 覆盖单个生成字段，slot props：`{ field, value, error, setValue }`（properties 绑定时生效）        |

Expose：`values / errors / valid / dirty / validate() / validateField(name) / reset() / clearValidate() / submit()`。

```vue
<Form v-model="form" :rules="rules" @submit="onSubmit">
  <FormItem name="username" label="用户名" required>
    <Input name="username" />
  </FormItem>
  <Button type="primary" native-type="submit">提交</Button>
</Form>
```

## 字段竞选

绑定 `properties` 字段元数据后，表单自动生成完整字段：每个控件渲染器（Field）对**完整字段定义**自我评价返回适配度分数，竞选代理按字段裁决取最高分（同分先注册者优先，全部弃权回落文本输入框）。`type` 描述保存格式，`format` 描述内容格式；资源池投影的 `properties` 自动携带两者。

- 优先级链路：字段插槽（`#field-{name}`）> 显式指定 `control` > 竞选推断 > 默认输入框
- 内建推断：`enum + options` → 下拉选择、`boolean` → 开关、`number` → 数值输入、`date` → 日期选择、`format: textarea` / `email` / `uri` / `password` → 对应输入形态
- 必填派生：`required: true` 的字段自动获得必填校验（「{label}不能为空」），宿主 `rules` 按字段名叠加其后；录入修正即时清除错误
- 外部调整三层：字段上加成 `bias`、显式指定 `control`、`registerField` 同名覆盖；Form 的 `controls` 属性传入局部渲染器

```vue
<template>
  <Form v-model="form" :properties="properties" :rules="rules" @submit="onSubmit">
    <Button type="primary" native-type="submit">提交</Button>
  </Form>
</template>

<script setup lang="ts">
const properties = [
  { name: 'name', label: '姓名', type: 'string', required: true },
  { name: 'email', label: '邮箱', type: 'string', format: 'email' },
  { name: 'age', label: '年龄', type: 'number' },
  { name: 'active', label: '启用', type: 'boolean' },
  {
    name: 'status',
    label: '状态',
    type: 'enum',
    options: [
      { label: '活跃', value: 'active' },
      { label: '休假', value: 'leave' },
    ],
  }, // 竞选推断 → 下拉选择
];
</script>
```

宿主扩展：按同一契约注册自定义 Field（机制设计、评分约定与扩展契约详见[字段竞选](/field)）。

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

/** 竞选演示字段：type / format 元数据驱动控件推断 */
const fieldProperties = [
  { name: 'name', label: '姓名', type: 'string', required: true },
  { name: 'email', label: '邮箱', type: 'string', format: 'email' },
  { name: 'age', label: '年龄', type: 'number' },
  { name: 'active', label: '启用', type: 'boolean' },
  {
    name: 'status',
    label: '状态',
    type: 'enum',
    options: [
      { label: '活跃', value: 'active' },
      { label: '休假', value: 'leave' },
    ],
  },
  { name: 'remark', label: '备注', type: 'string', format: 'textarea', required: false },
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
