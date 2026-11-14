import { computed, inject, provide } from 'vue';
import type { ComputedRef, InjectionKey } from 'vue';
import type { MountTarget } from '@cumquat/composables';

/** 应用级配置：通过 app.use(Cumquat, config) 传入 */
export interface CumquatConfig {
  overlay?: {
    /** 所有浮层的默认挂载目标 */
    appendTo?: MountTarget;
  };
}

export const cumquatConfigKey: InjectionKey<ComputedRef<CumquatConfig>> = Symbol('cumquat-config');

const emptyConfig = computed<CumquatConfig>(() => ({}));

/** 读取最近的应用级或 ConfigProvider 配置 */
export function useCumquatConfig(): ComputedRef<CumquatConfig> {
  return inject(cumquatConfigKey, emptyConfig);
}

/** 创建应用级响应式配置引用 */
export function createCumquatConfig(config: CumquatConfig = {}): ComputedRef<CumquatConfig> {
  return computed(() => config);
}

/** 合并本级配置并继续向下提供 */
export function provideCumquatConfig(config: ComputedRef<CumquatConfig>): void {
  provide(cumquatConfigKey, config);
}