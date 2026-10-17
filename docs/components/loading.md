---
title: Loading 加载
---

# Loading 加载

局部 / 全屏加载指示。

| Prop       | 类型                   | 默认值  | 说明                                            |
| ---------- | ---------------------- | ------- | ----------------------------------------------- |
| size       | `'sm' \| 'md' \| 'lg'` | `'md'`  | 指示器尺寸                                      |
| text       | `string`               | `''`    | 文案                                            |
| active     | `boolean`              | `true`  | 局部加载是否激活（非全屏形态使用）              |
| fullscreen | `boolean`              | `false` | 全屏遮罩形态：可见性与全局 loading 服务计数联动 |

Expose：`service`（全局 loading 服务，可 `service.show() / hide()`）。

```vue
<Loading :active="fetching" text="加载中…" />
<Loading fullscreen text="提交中…" />
```

## 交互演示

### 加载指示

<CodeCard v-model:code="loadingCode" editable title="加载指示">
  <LiveDemo :code="loadingCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const loadingCode = ref(`
  <div class="flex flex-wrap items-center justify-center gap-10">
    <Loading text="加载中..." />
    <Loading />
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { loadingCode };
</script>

