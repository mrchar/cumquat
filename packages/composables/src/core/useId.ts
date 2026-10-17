import { computed, getCurrentInstance, useId as vueUseId } from 'vue';

let fallbackCount = 0;

/**
 * SSR 安全的组件内唯一标识，用于 label/aria 关联。
 *
 * @param prefix 标识前缀，默认 `cq`
 * @returns 形如 `cq-input-0` 的只读字符串引用
 * @internal 消费组件：FormItem、Tooltip 及全部需要 aria 关联的控件
 */
export function useId(prefix = 'cq') {
  // 脱离组件实例（测试 / 独立组合调用）时 vueUseId 返回空串，退化为本地计数
  const raw = getCurrentInstance() ? vueUseId() : `f${fallbackCount++}`;
  return computed(() => `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`);
}
