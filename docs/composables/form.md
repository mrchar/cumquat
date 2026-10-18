---
title: 表单模型
---

# 表单模型

无头表单：字段注册、校验、提交、重置与脏检查。Form / FormItem 组件就是它的默认渲染壳；宿主也可以脱离组件做无头表单。

## useForm

```ts
function useForm<T extends Record<string, unknown>>(options?: UseFormOptions<T>): UseFormReturn<T>;
```

```ts
const { values, errors, validate, submit, reset } = useForm({
  defaultValue: { name: '', email: '' },
  rules: {
    name: [{ required: true, message: '请输入姓名' }],
    email: [{ pattern: /^\S+@\S+$/, message: '邮箱格式不正确' }],
  },
  onSubmit: async (values) => api.saveUser(values),
});

await submit(); // 内部先 validate，通过才调 onSubmit
```

| 参数 | 说明 |
| --- | --- |
| `modelValue` | 受控整表值（`MaybeRefOrGetter<T>`） |
| `defaultValue` | 非受控初始值 |
| `rules` | 字段规则（`FormRules<T>`），支持同步返回 / 异步 Promise |
| `disabled` / `labelPosition` | 整表态，经上下文下发给控件 |
| `onChange` / `onSubmit` / `onInvalid` | 值变化 / 校验通过提交 / 校验失败回调 |

| 返回成员 | 说明 |
| --- | --- |
| `values` / `errors` / `touched` | 整表值、错误、触碰态 |
| `valid` / `dirty` | 派生状态 |
| `validate()` / `validateField(name)` | 整表 / 单字段校验 |
| `setFieldValue` / `resetField` / `reset` | 值操作 |
| `clearValidate(name?)` | 清除错误 |
| `submit()` | 校验通过后执行 onSubmit |
| `registerField` / `context` | 字段注册与上下文（供 FormItem / 控件消费） |

配套 `provideForm(context)` / `injectForm()` / `provideFormField()` / `injectFormField()` 完成跨层级联动。

## useFormField

单字段模型：值、校验信息、touched、blur/change 触发校验、aria 属性注入，自动联动表单上下文。所有表单控件的公共底座。

```ts
const { value, error, touched, fieldId, onBlur, onChange } = useFormField<string>({
  name: 'email',
  rules: [{ required: true, message: '请输入邮箱' }],
});
```

## useCheckableGroup

成组勾选：多选数组 / 单选互斥、全选与半选推导。CheckboxGroup、RadioGroup 使用。

```ts
const { values, isChecked, toggle, checkAll, uncheckAll, isAllChecked, isIndeterminate } =
  useCheckableGroup<number>({ options: () => optionValues });
```

## useSelectModel

单选 / 多选值模型：标签回显、本地过滤、清除、空态。Select、TreeSelect 使用。

```ts
const { selectedValues, selectedOptions, select, clear, isEmpty } = useSelectModel({
  multiple: true,
  options: () => props.options,
});
```

## useTreeModel

树形数据模型：展开集合、勾选集合、半选传播、扁平化可见节点。Tree、TreeSelect 使用。

```ts
const { visibleNodes, expandedKeys, toggleExpand, checkedKeys, check } = useTreeModel({
  data: () => props.data,
  fieldNames: { key: 'id', label: 'name', children: 'children' },
});
```

## useAsyncSuggest

输入防抖 → 调用异步建议源 → loading / 空态管理。AutoComplete、Mention 使用。

```ts
const { suggestions, loading, search } = useAsyncSuggest<User>({
  fetch: (keyword) => api.suggestUsers(keyword),
  debounce: 300,
  minKeywordLength: 1,
});
```
