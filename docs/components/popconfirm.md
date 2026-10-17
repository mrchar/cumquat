---
title: Popconfirm 气泡确认
---

# Popconfirm 气泡确认

轻量二次确认，确认动作执行期间按钮自动 loading。

| Prop        | 类型         | 默认值                 | 说明                                          |
| ----------- | ------------ | ---------------------- | --------------------------------------------- |
| text        | `string`     | `'确定执行该操作吗？'` | 确认气泡文案                                  |
| confirmText | `string`     | `'确定'`               | 确认按钮文案                                  |
| cancelText  | `string`     | `'取消'`               | 取消按钮文案                                  |
| placement   | `Placement`  | `'top'`                | 气泡位置                                      |
| open        | `boolean`    | -                      | 开合（v-model:open）                          |
| action      | `ActionLike` | -                      | 确认时执行的异步动作（期间按钮 loading/禁用） |
| disabled    | `boolean`    | `false`                | 禁用                                          |

| 事件        | 参数             | 说明     |
| ----------- | ---------------- | -------- |
| update:open | `value: boolean` | 开合更新 |
| confirm     | -                | 点击确认 |
| cancel      | -                | 点击取消 |

| 插槽    | 说明               |
| ------- | ------------------ |
| default | 触发器内容（必填） |

Expose：`open()` / `close()` / `toggle()`。

```vue
<Popconfirm text="确认删除这条记录？" :action="removeRow" @confirm="refresh">
  <Button danger size="sm">删除</Button>
</Popconfirm>
```

## 交互演示

### 气泡确认

<CodeCard v-model:code="popconfirmCode" editable title="气泡确认">
  <LiveDemo :code="popconfirmCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const popconfirmCode = ref(`
  <Popconfirm>
    <template #trigger>
      <Button type="danger">删除</Button>
    </template>
  </Popconfirm>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { popconfirmCode };
</script>

