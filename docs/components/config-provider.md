---
title: ConfigProvider 全局配置
---

# ConfigProvider 全局配置

为局部区域提供浮层配置。当前只承载 `appendTo`：后代浮层未显式指定挂载目标时，使用这里配置的挂载点。

配置按组件树逐级继承：本级未传的属性继续沿用父级，因此可以只在需要改变挂载点的局部子树外层包一层 `ConfigProvider`，不影响其他区域。

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| appendTo | [`MountTarget`](/types/basics/overlay#mounttarget) | `undefined` | 后代浮层的默认挂载目标；未传时继承父级配置 |

| 插槽 | 说明 |
| --- | --- |
| default | 需要应用配置的子树 |

挂载目标优先级（从高到低）：

1. 组件自身的 `appendTo` / `target`
2. 最近的 `ConfigProvider`
3. 应用级配置 `app.use(Cumquat, { overlay: { appendTo } })`
4. `body`

```vue
<script setup lang="ts">
import { ConfigProvider, Dialog } from '@mrchar/cumquat';
</script>

<template>
  <ConfigProvider append-to="#local-overlays">
    <!-- 该区域的 Dialog 默认挂载到 #local-overlays -->
    <Dialog v-model:open="open" title="局部浮层">
      <!-- 内容 -->
    </Dialog>
  </ConfigProvider>
</template>
```

应用级配置与 `ConfigProvider` 的形状不同：`app.use` 接收完整配置对象，`ConfigProvider` 只接收独立的 `append-to` 属性。类型定义见 [`CumquatConfig`](/types/basics/overlay#cumquatconfig)。

自定义组件需要读取当前配置时，使用 `useCumquatConfig()`：

```ts
import { useCumquatConfig } from '@mrchar/cumquat';

const config = useCumquatConfig();
const target = props.appendTo ?? config.value.overlay?.appendTo ?? document.body;
```
