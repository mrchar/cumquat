---
title: Watermark 水印
---

# Watermark 水印

页面 / 容器水印，自动防篡改重建。

| Prop     | 类型     | 默认值                  | 说明                       |
| -------- | -------- | ----------------------- | -------------------------- |
| content  | `string` | -                       | 水印文字（必填）           |
| rotate   | `number` | `-22`                   | 旋转角度（deg）            |
| gap      | `number` | `96`                    | 平铺间隔（px）             |
| color    | `string` | `'rgba(23,23,23,0.16)'` | 水印颜色                   |
| fontSize | `number` | `14`                    | 字号（px）                 |
| image    | `string` | -                       | 水印图片地址（优先于文字） |
| zIndex   | `number` | `9`                     | 水印层级                   |

| 插槽    | 说明               |
| ------- | ------------------ |
| default | 被水印覆盖的内容区 |

```vue
<Watermark content="内部资料 · 张三">
  <div class="doc">受保护的正文内容</div>
</Watermark>
```

## 交互演示

### 文字水印

<CodeCard v-model:code="watermarkCode" editable title="文字水印">
  <LiveDemo :code="watermarkCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const watermarkCode = ref(`
  <Watermark content="机密文件">
    <div
      class="flex h-40 items-center justify-center rounded bg-cumquat-surface-2 text-cumquat-text-muted"
    >
      被水印覆盖的内容区域
    </div>
  </Watermark>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { watermarkCode };
</script>

