import { ref } from 'vue';
import type { Ref } from 'vue';

export interface ToggleReturn {
  value: Ref<boolean>;
  toggle: (next?: boolean) => void;
  setTrue: () => void;
  setFalse: () => void;
}

/**
 * 布尔状态及取反操作。
 *
 * @param initial 初始值，默认 false
 * @internal 消费组件：Switch、Layout、FloatButton
 */
export function useToggle(initial = false): ToggleReturn {
  const value = ref(initial);
  const toggle = (next?: boolean) => {
    value.value = typeof next === 'boolean' ? next : !value.value;
  };
  const setTrue = () => {
    value.value = true;
  };
  const setFalse = () => {
    value.value = false;
  };
  return { value, toggle, setTrue, setFalse };
}
