---
title: Result 结果页
---

# Result 结果页

操作结果反馈页。

| Prop     | 类型                                          | 默认值      | 说明   |
| -------- | --------------------------------------------- | ----------- | ------ |
| status   | `'success' \| 'error' \| 'warning' \| 'info'` | `'success'` | 状态   |
| title    | `string`                                      | `''`        | 标题   |
| subTitle | `string`                                      | `''`        | 副标题 |

| 插槽     | 说明         |
| -------- | ------------ |
| title    | 自定义标题   |
| subTitle | 自定义副标题 |
| default  | 额外操作区   |

```vue
<Result status="success" title="支付成功" sub-title="订单号 CUMQ-2026-0001">
  <Button type="primary">查看订单</Button>
</Result>
```

## 交互演示

### 结果状态

<CodeCard v-model:code="resultCode" editable title="结果状态">
  <LiveDemo :code="resultCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const resultCode = ref(`
  <div class="grid grid-cols-2 gap-4">
    <Result status="success" title="操作成功" sub-title="数据已提交至服务器" />
    <Result status="danger" title="操作失败" sub-title="请检查网络后重试" />
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { resultCode };
</script>

