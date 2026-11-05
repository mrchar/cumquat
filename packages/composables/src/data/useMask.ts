import { computed, isRef, toValue } from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';

/**
 * 遮罩规则：
 * - `string`：遮罩对象的同名属性；对数组则遮罩每个成员的同名属性
 * - `{ prop, value }`：对数组，遮罩 `item[prop] === value` 的成员（对对象无意义，原样返回）
 * - `(value, key) => boolean`：对数组按 `(item, index)` 判定匹配成员，对对象按 `(value, key)` 判定匹配属性
 *
 * 遮罩语义：移除匹配项，返回不包含匹配项的新对象/数组，原数据保持不变。
 */
export type MaskRule =
  | string
  | { prop: string; value: unknown }
  | ((value: unknown, key: string | number) => boolean);

export interface UseMaskReturn<T = unknown> {
  /** 遮罩后的结果：对象 / 数组（与源数据同形态） */
  masked: ComputedRef<T>;
}

/** 移除对象的指定属性，返回新对象 */
function omit<T extends object>(obj: T, key: string): T {
  const rest: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    if (k !== key) rest[k] = (obj as Record<string, unknown>)[k];
  }
  return rest as T;
}

/** 按规则计算遮罩结果 */
function applyMask(source: unknown, rule: MaskRule): unknown {
  if (source == null) return source;

  // 规则：属性名
  if (typeof rule === 'string') {
    if (Array.isArray(source)) return source.map((item) => (item && typeof item === 'object' ? omit(item as object, rule) : item));
    return source && typeof source === 'object' ? omit(source as object, rule) : source;
  }

  // 规则：{ prop, value } 仅对数组按成员过滤
  if (rule && typeof rule === 'object' && 'prop' in rule) {
    if (!Array.isArray(source)) return source;
    const { prop, value } = rule;
    return source.filter((item) => (item as Record<string, unknown>)?.[prop] !== value);
  }

  // 规则：匹配函数
  if (typeof rule === 'function') {
    if (Array.isArray(source)) return source.filter((item, index) => !rule(item, index));
    if (typeof source === 'object') {
      const rest: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(source as object)) {
        if (!rule(v, k)) rest[k] = v;
      }
      return rest;
    }
    return source;
  }

  return source;
}

/** 解析规则：ref 取 .value，其余（含函数规则）原样返回，不经 toValue 避免误调用函数 */
function resolveRule(rule: MaskRule | Ref<MaskRule>): MaskRule {
  if (isRef(rule)) return rule.value;
  return rule;
}

/**
 * 数据遮罩：第一个参数为源数据（对象或数组，可响应式），后续参数为遮罩规则，
 * 按顺序依次叠加移除匹配的属性或成员，返回不可变的响应式结果。
 *
 * ```ts
 * useMask(list, 'password');                                     // 移除所有成员的 password
 * useMask(list, { prop: 'role', value: 'admin' });               // 移除管理员成员
 * useMask(list, (it) => it.disabled);                             // 移除禁用成员
 * useMask(obj,  (v, k) => typeof v === 'number');                 // 移除数值属性
 * useMask(list, 'token', { prop: 'hidden', value: true });        // 叠加：先去 token 再去隐藏行
 * useMask(refList, ref('password'));                              // 源与规则均可响应式
 * ```
 *
 * 规则可直接传值（含函数形态）或 `ref<MaskRule>`。函数规则与 getter 在运行时无法区分，
 * 因此规则不支持 getter 形式——如需响应式切换，请用 `ref`。
 */
export function useMask<T = unknown>(
  source: MaybeRefOrGetter<T>,
  ...rules: (MaskRule | Ref<MaskRule>)[]
): UseMaskReturn<T> {
  const masked = computed<T>(() => {
    let result: unknown = toValue(source);
    for (const rule of rules) {
      result = applyMask(result, resolveRule(rule));
    }
    return result as T;
  });
  return { masked };
}


