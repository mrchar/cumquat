---
title: FormItem 表单项
---

# FormItem 表单项

字段标签、必填标记与错误提示的编排容器。

| Prop     | 类型      | 默认值  | 说明                                                 |
| -------- | --------- | ------- | ---------------------------------------------------- |
| name     | `string`  | -       | 字段名：与表单 rules/values 对应，并用于错误提示联动 |
| label    | `string`  | `''`    | 标签文本                                             |
| required | `boolean` | `false` | 显示必填星号                                         |
| error    | `string`  | `''`    | 外部直接指定错误信息（非空时优先于表单上下文错误）   |

| 插槽    | 说明                                      |
| ------- | ----------------------------------------- |
| default | 字段控件，slot props：`{ error: string }` |

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

