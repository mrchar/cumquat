---
title: Form 表单
---

# Form 表单

字段容器与校验编排，配合 FormItem 使用。

| Prop          | 类型                      | 默认值   | 说明                                |
| ------------- | ------------------------- | -------- | ----------------------------------- |
| modelValue    | `Record<string, unknown>` | -        | 整表值（受控或作为初始值）          |
| rules         | `FormRules`               | `{}`     | 校验规则表（详见 composables 文档） |
| disabled      | `boolean`                 | `false`  | 整表禁用                            |
| labelPosition | `'top' \| 'left'`         | `'top'`  | 标签摆放位置                        |
| labelWidth    | `string`                  | `'6rem'` | 左排标签宽度                        |

| 事件              | 参数                                          | 说明           |
| ----------------- | --------------------------------------------- | -------------- |
| update:modelValue | `values: Record<string, unknown>`             | 任意字段值更新 |
| submit            | `values: Record<string, unknown>`             | 校验通过后提交 |
| invalid           | `errors: Record<string, string \| undefined>` | 校验失败       |

| 插槽    | 说明                                                                    |
| ------- | ----------------------------------------------------------------------- |
| default | 表单内容，slot props：`{ values, errors, valid, dirty, submit, reset }` |

Expose：`values / errors / valid / dirty / validate() / validateField(name) / reset() / clearValidate() / submit()`。

```vue
<Form v-model="form" :rules="rules" @submit="onSubmit">
  <FormItem name="username" label="用户名" required>
    <Input name="username" />
  </FormItem>
  <Button type="primary" native-type="submit">提交</Button>
</Form>
```

## 交互演示

### 表单与校验

<CodeCard v-model:code="formCode" editable title="表单与校验">
  <LiveDemo :code="formCode" :scope="demoScope" />
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

/** LiveDemo 渲染作用域 */
const demoScope = { formCode };
</script>
