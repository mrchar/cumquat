# 统一浮层挂载配置

## Context

当前 `Cumquat` 只负责注册组件，Dialog、Drawer 和 MessageContainer 分别处理挂载目标，其他 Teleport 浮层仍固定挂载到 `body`。Button 的 `toast` 只有布尔开关，无法指定消息挂载点；全局消息队列也没有逐条目标信息。

本次建立统一配置链路：支持 `app.use(Cumquat, config)`、`<ConfigProvider>` 包裹和组件局部覆盖，并让所有 Teleport 浮层共享同一默认挂载配置。已确认 Button 采用独立的 `toastTarget`，不扩展 `toast` 的类型。挂载目标为 CSS 选择器或 `HTMLElement`；挂载到组件时传其根 DOM 元素。

## 公开 API

```ts
interface CumquatConfig {
  overlay?: {
    appendTo?: string | HTMLElement;
  };
}

app.use(Cumquat, {
  overlay: { appendTo: '#overlays' },
});
```

```vue
<ConfigProvider append-to="#local-overlays">
  <Button :action="save" toast toast-target="#button-toasts">保存</Button>
</ConfigProvider>
```

- 保留 `app.use(Cumquat)` 和现有 `components.Cumquat` 用法。
- ConfigProvider 不接受统一的 `config` 对象，而是将各配置项声明为独立 Props；本期提供 `appendTo`，后续配置也按同样方式扩展。
- 配置组件可嵌套，本级已声明属性覆盖父级，其余配置继承。
- 普通浮层优先级：组件 `appendTo` / `target` > 最近的 ConfigProvider > 应用配置 > `body`。
- Button：`toast` 继续控制是否提示；`toastTarget` 只覆盖该按钮消息的挂载点。
- 消息项自身 `target` 优先；未指定时由 MessageContainer 应用自身 `target`、注入配置和 `body` 回退。

## 实施步骤

### 1. 共享挂载类型与响应式解析

- 在 `packages/composables/src/types.ts` 增加并导出 `MountTarget = string | HTMLElement`，同步 `src/index.ts`。
- 增强 `packages/composables/src/behavior/useOverlayContainer.ts`：`to` 接受 ref/getter，挂载后监听目标变化并重新解析；保持 SSR 不访问 `document`、选择器未命中回退和卸载清理语义。
- 更新 `useOverlayContainer` 测试，覆盖 getter 动态切换、选择器回退和 SSR 安全。

### 2. 应用配置与 ConfigProvider

- 新增 `packages/components/src/config.ts`：定义 `CumquatConfig`、注入键和 `useCumquatConfig`，通过 computed 暴露合并后的配置。
- 新增 `components/basic/ConfigProvider.vue`：声明 `appendTo?: MountTarget` 等独立配置 Props，读取父配置并合并本级已传属性后继续 provide，只渲染默认插槽；不提供统一 `config` 入参。
- 修改 `packages/components/src/index.ts`：
  - 注册并导出 ConfigProvider；
  - 将默认 `Cumquat` 改为可直接传给 `app.use` 的函数插件 `(app, config?) => void`；
  - 保留自引用 `install`，注册全部组件并提供应用级配置。
- 修改根 `index.ts`：默认导出 Cumquat，导出 ConfigProvider 和配置类型，保留 composables/components 命名空间。
- 修改 `packages/cumquat/build.mjs`：分别生成 JS 与 d.ts 聚合入口，确保默认导出和类型导出在发布包中一致。

### 3. 所有 Teleport 浮层接入统一配置

- Dialog、Drawer 保留 `appendTo`，改为向 `useOverlayContainer` 传 getter：`props.appendTo ?? 注入配置`。
- Tour、全屏 Loading 增加局部 `appendTo`；NotificationContainer 增加局部 `target`；替换固定 `to="body"`。
- MessageContainer 的 `target` 默认值改为 `undefined`，使局部属性未传时可以继承配置。
- 非 Teleport 的锚定浮层不改变定位机制。

### 4. Button 多目标 toast 链路

- 在 `useToastQueue.ts` 的 `PushToastOptions` / `ToastItem` 增加可选 `target`；去重键加入 target，避免不同挂载点的同文案消息被错误合并。
- Button 新增 `toastTarget?: MountTarget`。成功和失败反馈通过 `message.push` 写入对应类型及 `target = props.toastTarget ?? Button 注入的挂载配置`，保持现有文案优先级和 `toast: false` 行为。
- MessageContainer 按每条消息最终 target 分组，每个目标只渲染一个 Teleport、消息容器和 TransitionGroup；保留现有暂停、关闭、计时和动画行为。目标变化时迁移对应分组，不为每条消息重复创建容器。

### 5. 测试

- 组件安装：无参安装保持可用，带配置安装和 ConfigProvider 全局注册可用。
- 配置优先级：应用配置、嵌套 Provider、组件局部覆盖及未配置回退 body。
- Button：默认 toast、`toastTarget` 选择器/DOM、成功与失败消息均携带目标。
- MessageContainer：两个目标各自分组堆叠、同文案跨目标不去重、同目标仍去重、目标迁移、关闭与计时不变。
- Dialog/Drawer/Tour/Loading/NotificationContainer：局部属性与注入配置均能驱动 Teleport 目标。

### 6. 文档

- `getting-started.md`：改为默认导入 Cumquat，补充 `app.use(Cumquat, config)` 和 ConfigProvider 示例，说明优先级及目标类型。
- `components/button.md`：在 Props 表增加 `toastTarget`，补充局部消息挂载示例。
- 更新 Dialog、Drawer、Tour、Loading、MessageContainer、NotificationContainer 文档中的挂载属性及默认来源。
- `types.md` 增加 `MountTarget` / `CumquatConfig`；消息服务文档仅补充 `message.push` 的 target 配置，不展开无关修订。

## 验证

1. 运行 composables 与 components 的目标测试及完整测试：`pnpm -C packages/composables test`、`pnpm -C packages/components test`。
2. 依次构建 composables、components 和发布包，确认根入口默认导出与 d.ts 正确。
3. 运行 `pnpm -C docs build`。
4. 浏览器验证两个挂载容器并存：不同 Button 的 toast 分别进入目标容器，Dialog/Drawer 等浮层按局部、Provider、全局优先级迁移，未配置时仍挂载 body。
