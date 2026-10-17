---
title: Image 图片
---

# Image 图片

图片加载占位与预览放大，支持缩放 / 旋转 / 翻转 / 拖拽平移。

| Prop        | 类型      | 默认值  | 说明                     |
| ----------- | --------- | ------- | ------------------------ |
| src         | `string`  | -       | 图片地址（必填）         |
| alt         | `string`  | `''`    | 替代文本                 |
| rounded     | `boolean` | `false` | 圆角                     |
| lazy        | `boolean` | `false` | 进入视口才加载           |
| previewable | `boolean` | `false` | 点击进入预览             |
| previewSrc  | `string`  | `''`    | 预览图地址（缺省用 src） |

| 事件  | 参数           | 说明     |
| ----- | -------------- | -------- |
| load  | `event: Event` | 加载成功 |
| error | `event: Event` | 加载失败 |
| close | -              | 关闭预览 |

```vue
<Image src="/cover.jpg" alt="封面" rounded lazy previewable />
```

---

## 交互演示

### 图片与失败态

<CodeCard v-model:code="imageCode" editable title="图片与失败态">
  <LiveDemo :code="imageCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const demoImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='140'><rect width='240' height='140' rx='8' fill='%234f46e5'/><circle cx='64' cy='70' r='30' fill='%23fbbf24' opacity='0.9'/><text x='112' y='78' font-size='20' font-family='sans-serif' fill='white'>Cumquat</text></svg>";

const imageCode = ref(`
  <div class="flex flex-wrap items-start gap-4">
    <Image :src="demoImage" alt="演示图片" :rounded="true" class="w-60" />
    <Image
      src="https://invalid.cumquat.dev/none.png"
      alt="加载失败"
      :rounded="true"
      class="w-60"
    />
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { demoImage, imageCode };
</script>
