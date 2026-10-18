---
title: 交互动作 Action
---

# 交互动作 Action

统一动作协议：为所有有交互操作的组件提供 `action` 属性，绑定一个返回 Promise 的函数。组件在动作执行期间自动进入 loading / 禁用态，返回值可导出状态与错误，组件据此控制自身状态与错误提示。

## 协议

```ts
/** 动作结果：返回值可导出状态与错误 */
export interface ActionResult {
  status?: 'success' | 'error'; // 缺省视为 success
  error?: unknown; // 失败信息，组件据此展示错误提示
  message?: string; // 提示文案，覆盖组件默认错误文案
}

export type ActionLike = (...args: any[]) => Promise<ActionResult | void> | ActionResult | void;
```

**失败判定**：action `reject`，或 resolve 出 `status: 'error'` / 携带 `error` 字段的对象，均视为失败；其余视为成功。

**错误文案归一**：组件展示错误时按 `message` → `error` 字符串 → `Error.message` → 回退文案（各组件 `errorText` prop）取值，可通过 `@cumquat/composables` 的 `actionErrorText` 复用。

## 两类动作语义

| 语义       | 组件                                                                                                                  | 执行中                   | 失败                                           | 成功                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **确认型** | Button、Form、Popconfirm、Upload、Dialog、Drawer、Tour、TimePicker                                                    | 按钮/入口 loading 并禁用 | 容器内展示错误提示条，保持打开/停留当前步骤    | emit `confirm` / `success`，Dialog 与 Drawer 自动关闭、Tour 进入下一步、TimePicker 提交并关闭 |
| **切换型** | Select、DatePicker、ColorPicker、Transfer、Rate、Segmented、Tabs、Checkbox、Radio、RadioGroup、Slider、Cascader、Tree | 禁用新的值变更           | **乐观回退**：值恢复为旧值，emit `actionError` | 新值生效                                                                                      |

确认型组件的错误提示条内建于容器（`cq-state--error` 语义 class），切换型组件（Rate、Slider 等即时变更控件）没有合理位置内嵌错误条，错误通过 `@action-error` 事件交由外部呈现（例如配合全局消息），值已自动回退，数据一致性由组件保证。

## 使用示例

### 确认型：Dialog 异步确认

动作失败时对话框保持打开并展示错误条；成功后自动关闭。

<CodeCard v-model:code="dialogCode" editable title="Dialog 异步确认">
  <LiveDemo :code="dialogCode" :scope="dialogScope" />
</CodeCard>

### 确认型：Popconfirm 与 Button

Popconfirm 确认按钮自动 loading，失败后气泡保持打开；Button 动作期间自动 loading 并禁用。

<CodeCard v-model:code="buttonCode" editable title="Button 与 Popconfirm">
  <LiveDemo :code="buttonCode" :scope="buttonScope" />
</CodeCard>

### 切换型：Select 乐观更新

选择后立即显示新值，动作失败自动回退旧值并触发 `action-error`。

<CodeCard v-model:code="selectCode" editable title="Select 乐观更新">
  <LiveDemo :code="selectCode" :scope="selectScope" />
</CodeCard>

## 交互组件清单

| 组件        | 动作时机                 | 执行中                     | 失败行为                        | 成功行为                  |
| ----------- | ------------------------ | -------------------------- | ------------------------------- | ------------------------- |
| Button      | 点击                     | loading + disabled         | emit `action-error`             | emit `click` 正常派发     |
| Form        | 提交                     | 提交按钮 loading           | 表单保持当前值，emit 错误       | emit `submit-success`     |
| Popconfirm  | 点击确认                 | 确认按钮 loading，气泡保持 | emit `action-error`             | 关闭气泡并 emit `confirm` |
| Upload      | 上传                     | 条目 loading               | 条目标记 error 状态             | 条目标记 success          |
| Dialog      | 点击确认（默认底部按钮） | 确认按钮 loading           | 错误提示条，保持打开            | emit `confirm` 并关闭     |
| Drawer      | 点击确认（默认底部按钮） | 确认按钮 loading           | 错误提示条，保持打开            | emit `confirm` 并关闭     |
| Tour        | 下一步 / 完成            | 推进按钮 loading           | 错误提示条，停留当前步骤        | 进入下一步或完成          |
| TimePicker  | 点击确定                 | 确定按钮 loading           | 错误提示条，面板保持            | 提交时间并关闭            |
| Select      | 选中选项                 | 禁用选择                   | 值回退，emit `action-error`     | 新值生效                  |
| DatePicker  | 选择日期                 | 禁用选择                   | 值回退，emit `action-error`     | 新值生效                  |
| ColorPicker | 确认颜色                 | 禁用选择                   | 值回退，emit `action-error`     | 新值生效                  |
| Transfer    | 穿梭                     | 禁用穿梭                   | 值回退，emit `action-error`     | 新值生效                  |
| Rate        | 评分                     | 禁用评分                   | 值回退，emit `action-error`     | 新值生效                  |
| Segmented   | 切换分段                 | 禁用切换                   | 值回退，emit `action-error`     | 新值生效                  |
| Tabs        | 切换面板                 | 禁用切换                   | 停留原面板，emit `action-error` | 切换到目标面板            |
| Checkbox    | 勾选                     | 禁用勾选                   | 值回退，emit `action-error`     | 新值生效                  |
| RadioGroup  | 组内选择                 | 禁用选择                   | 值回退，emit `action-error`     | 新值生效                  |
| Slider      | 拖动结束                 | 禁用拖动                   | 值回退，emit `action-error`     | 新值生效                  |
| Cascader    | 选择节点                 | 禁用选择                   | 值回退，emit `action-error`     | 新值生效                  |
| Tree        | 勾选节点                 | 禁用勾选                   | 勾选回退，emit `action-error`   | 新勾选生效                |

> 说明：Tabs 属于确认型切换（先确认再切换）；Cascader 的失败回退只回退选中值，面板展开状态不受影响；ColorPicker 的拖拽调色为连续预览不触发 action，确认点（选预设色、输入 Hex、关闭面板）才提交动作。

## 组合函数

- `useActionState(action, options)`：确认型动作消费，维护 `pending / disabled / error`，支持 `onSuccess / onError / onFinally` 回调
- `useActionValue()`：切换型乐观更新消费，`commit({ execute, revert })` 失败自动回退
- `extractActionFailure(result)`：归一 action 返回值，导出错误时返回失败信息
- `actionErrorText(error, fallback?)`：把动作错误归一为可展示文案

<script setup>
import { ref } from 'vue';

const dialogCode = ref(`
  <div class="flex flex-col gap-3">
    <Button type="primary" @click="open = true">打开对话框</Button>
    <Dialog v-model:open="open" title="异步确认" :action="confirmAction" @action-error="onError">
      <p class="text-sm text-cumquat-text-muted">确认动作将调用一个会随机失败的函数，观察失败时的错误条与按钮状态。</p>
    </Dialog>
    <p v-if="lastError" class="text-xs text-cumquat-danger">最近一次错误：{{ lastError }}</p>
  </div>
`);

const dialogScope = {
  open: ref(false),
  lastError: ref(''),
  confirmAction: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (Math.random() < 0.5) {
      return { status: 'error', error: '服务器繁忙，请稍后重试' };
    }
  },
  onError: (err) => {
    dialogScope.lastError.value = typeof err === 'string' ? err : (err?.message ?? '操作失败');
  },
};

const buttonCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Button type="primary" :action="save">保存配置</Button>
    <Popconfirm text="确认删除这条记录吗？" :action="remove">
      <Button type="danger">删除</Button>
    </Popconfirm>
  </div>
`);

const buttonScope = {
  save: async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
  },
  remove: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { status: 'error', error: '存在关联数据，无法删除' };
  },
};

const selectCode = ref(`
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-3">
      <Select v-model="value" :options="options" :action="persist" class="w-56" @action-error="onError" />
      <span class="text-sm text-cumquat-text-muted">已选：{{ value ?? '无' }}</span>
    </div>
    <p v-if="error" class="text-xs text-cumquat-danger">{{ error }}</p>
  </div>
`);

const selectScope = {
  value: ref('apple'),
  error: ref(''),
  options: [
    { value: 'apple', label: '苹果' },
    { value: 'banana', label: '香蕉' },
    { value: 'cherry', label: '樱桃' },
  ],
  persist: async (value) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (value === 'cherry') {
      return { status: 'error', error: '樱桃库存不足' };
    }
  },
  onError: (err) => {
    selectScope.error.value = typeof err === 'string' ? err : (err?.message ?? '操作失败');
  },
};
</script>
