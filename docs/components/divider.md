---
title: Divider 分割线
---

# Divider 分割线

| Prop        | 类型                         | 默认值         | 说明     |
| ----------- | ---------------------------- | -------------- | -------- |
| orientation | `'horizontal' \| 'vertical'` | `'horizontal'` | 方向     |
| label       | `string`                     | `''`           | 中间文案 |
| dashed      | `boolean`                    | `false`        | 虚线     |

| 插槽    | 说明                                      |
| ------- | ----------------------------------------- |
| default | 自定义中间文案（优先级高于 `label` prop） |

```vue
<Divider label="基本信息" />
<Divider dashed />
<Divider orientation="vertical" />
```

## 交互演示

### 水平、虚线与垂直

<CodeCard v-model:code="dividerCode" editable title="水平、虚线与垂直">
  <LiveDemo :code="dividerCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const text = ref('');

const dividerCode = ref(`
  <Divider label="section" />
  <Divider :dashed="true" label="虚线" />
  <div class="flex items-center gap-4">
    <span class="text-sm">左侧</span>
    <Divider orientation="vertical" />
    <span class="text-sm">右侧</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { text, dividerCode };
</script>

