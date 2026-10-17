import { computed, isRef, ref, toValue } from 'vue';
import type { MaybeRefOrGetter, Ref, WritableComputedRef } from 'vue';
import type { ControlledProps } from '../types';

export interface ControllableModelOptions<T> {
  /** 受控值（可直接传值、ref 或 getter；SFC 中传 `() => props.modelValue` 保持响应式） */
  modelValue?: MaybeRefOrGetter<T>;
  /** 非受控初始值 */
  defaultValue?: T;
  /** 受控回调（通常直接传 props['onUpdate:modelValue']） */
  onChange?: (value: T) => void;
  /** 无任何值时使用的兜底初始值 */
  fallback?: T;
  /** 值比较器，默认 Object.is */
  equals?: (a: T, b: T) => boolean;
}

export interface ControllableModelReturn<T> {
  /** 统一读写入口：受控时读 props，非受控时读内部状态 */
  value: WritableComputedRef<T>;
  /** 主动写入（等价于 value.value = next） */
  setValue: (next: T) => void;
  /** 是否处于受控模式 */
  isControlled: Ref<boolean>;
}

/**
 * 受控 / 非受控统一封装。
 *
 * - 传入 `modelValue` 时为受控：读外部值，写入时通过 onChange 回发事件；
 * - 仅传入 `defaultValue` 时为非受控：内部自持状态，写入同样回发事件以便宿主监听。
 *
 * `v-model` 永远是纯同步的，本函数不做任何异步编排。
 */
export function useControllableModel<T>(
  options: ControllableModelOptions<T> = {},
): ControllableModelReturn<T> {
  const { modelValue, defaultValue, onChange, fallback, equals = Object.is } = options;

  // 传入 ref/getter 视为受控；裸值则以"非 undefined"判定
  const controlledInput = typeof modelValue === 'function' || isRef(modelValue);
  const isControlled = ref(controlledInput || modelValue !== undefined);
  const initial = toValue(modelValue as MaybeRefOrGetter<T>);
  const inner = ref<T>(
    (initial !== undefined ? initial : defaultValue !== undefined ? defaultValue : fallback) as T,
  ) as Ref<T>;

  const value = computed<T>({
    get: () =>
      isControlled.value ? (toValue(modelValue as MaybeRefOrGetter<T>) as T) : inner.value,
    set: (next) => {
      const current = isControlled.value
        ? (toValue(modelValue as MaybeRefOrGetter<T>) as T)
        : inner.value;
      if (current !== undefined && equals(current as T, next)) return;
      if (!isControlled.value) inner.value = next;
      onChange?.(next);
    },
  });

  const setValue = (next: T) => {
    value.value = next;
  };

  return { value, setValue, isControlled };
}

/** 从标准 props 形态构造受控模型的便捷方法 */
export function createControllableModel<T>(
  props: ControlledProps<T>,
  fallback?: T,
): ControllableModelReturn<T> {
  return useControllableModel({
    modelValue: props.modelValue,
    defaultValue: props.defaultValue,
    fallback,
    onChange: props['onUpdate:modelValue'],
  });
}
