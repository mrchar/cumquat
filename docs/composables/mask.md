---
title: 数据遮罩 useMask
---

# 数据遮罩

按规则从对象或数组中移除指定属性 / 成员，产出脱敏后的新数据，**原数据保持不变**。常用于接口出参裁剪（去掉 `password`、`token` 等敏感字段）、列表过滤等场景。

## useMask

```ts
function useMask<T>(source: Ref<T> | (() => T), ...rules: Array<MaskRule | Ref<MaskRule>>): ComputedRef<T>;
function useMask<T>(source: T, ...rules: Array<MaskRule | Ref<MaskRule>>): T;
```

返回形式由第一个参数决定：

- 传入**原始对象 / 数组**：立即执行一次，直接返回裁剪后的新值
- 传入 `ref` 或 getter：返回 `ComputedRef`，随源数据与规则响应式更新

```ts
// 原始数据：一次性裁剪
const masked = useMask(user, 'password');

// 响应式数据：返回 ComputedRef，源变化自动重算
const safeList = useMask(userListRef, 'token');
safeList.value; // 读取裁剪结果
```

## 遮罩规则 MaskRule

```ts
type MaskRule =
  | string
  | { prop: string; value: unknown }
  | ((value: unknown, key: string | number) => boolean);
```

遮罩语义统一为「移除匹配项」，三种规则按数据形状分别生效：

| 规则 | 对对象 | 对数组 |
| --- | --- | --- |
| `string`（属性名） | 移除同名属性 | 移除每个对象成员的同名属性；非对象成员原样保留 |
| `{ prop, value }` | 无意义，原样返回 | 移除 `item[prop] === value` 的成员 |
| 函数 `(value, key) => boolean` | 返回 `true` 的属性被移除（入参为属性值、键名） | 返回 `true` 的成员被移除（入参为成员、下标） |

### 属性名遮罩

```ts
useMask({ name: '甲', password: 'secret', age: 30 }, 'password');
// { name: '甲', age: 30 }

useMask(
  [
    { id: 1, token: 'x' },
    { id: 2, token: 'y' },
  ],
  'token',
);
// [{ id: 1 }, { id: 2 }]
```

### 成员匹配遮罩

`{ prop, value }` 只对数组生效，按成员属性等值过滤：

```ts
const list = [
  { id: 1, role: 'admin' },
  { id: 2, role: 'user' },
  { id: 3, role: 'admin' },
];

useMask(list, { prop: 'role', value: 'admin' });
// [{ id: 2, role: 'user' }]
```

### 函数规则

对象按属性判定、数组按成员判定，返回 `true` 即移除：

```ts
// 对象：移除所有数值属性
useMask({ name: '甲', password: 'secret', age: 30 }, (value) => typeof value === 'number');
// { name: '甲', password: 'secret' }

// 数组：移除偶数成员
useMask([1, 2, 3, 4, 5], (n) => n % 2 === 0);
// [1, 3, 5]
```

## 多规则叠加

后续规则依次作用在前一条规则的产出上，适合同时裁剪敏感字段与过滤成员：

```ts
const list = [
  { id: 1, token: 'x', hidden: false },
  { id: 2, token: 'y', hidden: true },
];

useMask(list, 'token', { prop: 'hidden', value: true });
// 先移除每个成员的 token，再移除 hidden 为 true 的成员
// [{ id: 1, hidden: false }]
```

## 响应式规则

规则支持直接传值或 `ref<MaskRule>`，切换规则时计算结果自动更新：

```ts
const rule = ref<MaskRule>('password');
const masked = useMask(userRef, rule);

rule.value = 'token'; // 裁剪目标切换，masked 自动重算
```

函数规则与 getter 在运行时无法区分，因此规则**不支持 getter 形式**；需要响应式切换时请使用 `ref` 包裹。注意：仅当源数据也是响应式（ref / getter）时规则 ref 才会驱动重算，原始源数据只会在调用时执行一次。

## 行为说明

- **不可变**：始终返回新对象 / 新数组，绝不修改源数据
- **空值透传**：源为 `null` / `undefined` 时原样返回
- **非对象透传**：属性名与函数规则遇到基本类型源时不做处理，原样返回
- 类型 `MaskRule` 与 `UseMaskReturn<T>` 随组合函数一并从主包 `@mrchar/cumquat` 导出
