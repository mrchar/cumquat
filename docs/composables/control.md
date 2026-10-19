---
title: 受控与动作
---

# 受控与动作

受控值统一、布尔状态、动作协议的宿主侧工具。

## useControllableModel / createControllableModel

受控 / 非受控统一封装：传入 `modelValue` 即受控（变化经回调同步出去），否则内部自持初始值。

```ts
const { value, setValue } = useControllableModel<string>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  onChange: (v) => emit('update:modelValue', v),
  fallback: '',
});

value.value; // 读取（受控时即 props.modelValue）
setValue('next'); // 写入（受控时只触发 onChange，由外部回写）
```

`createControllableModel` 为同一能力的工厂形态，供非 setup 场景使用。

## useToggle

布尔状态及取反。

```ts
const { value, toggle, setTrue, setFalse } = useToggle(false);
toggle(); // 取反
toggle(true); // 显式设置
```

## useActionState

action 协议的宿主侧原语：消费 `ActionLike`，执行期间派生 `pending / disabled`，错误归一。Button、Form、Popconfirm 等确认型组件内部使用。

```ts
const { pending, disabled, error, run } = useActionState(() => api.save(form), {
  disableOnPending: true,
  onSuccess: () => message.success('已保存'),
  onError: (e) => message.error('保存失败'),
});

await run();
```

## useActionValue

切换型组件（Select、Switch、Tabs 等）的乐观更新原语：先更新视图并执行动作，失败自动回退旧值并暴露错误。

```ts
const { pending, error, commit } = useActionValue();

await commit({
  execute: () => api.updateStatus(next), // 乐观值已由组件先行应用
  revert: () => applyValue(prev), // 失败回退
});
```

## useId

SSR 安全的组件内唯一标识，用于 aria 关联（label / field / error）。

```ts
const id = useId('field'); // ComputedRef<string>，如 field-7
```
