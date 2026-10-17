import { ref } from 'vue';
import type { Ref } from 'vue';

const BASE_Z_INDEX = 2000;

// 全局浮层计数器：所有浮层共享同一递增序列，后开者居上
let globalZIndex = BASE_Z_INDEX;

export interface ZIndexReturn {
  /** 当前分配到的层级 */
  currentZIndex: Ref<number>;
  /** 取下一个层级（浮层每次打开时调用） */
  nextZIndex: () => number;
  /** 当前全局最大值（供初始化样式参考） */
  getGlobalZIndex: () => number;
}

/**
 * 全局浮层层级递增管理。Dialog/Drawer/Popover/Message/Notification
 * 共用同一序列，组件卸载无需回收（仅单调递增）。
 */
export function useZIndex(initial?: number): ZIndexReturn {
  const currentZIndex = ref(initial ?? globalZIndex);

  const nextZIndex = () => {
    globalZIndex += 1;
    currentZIndex.value = globalZIndex;
    return globalZIndex;
  };

  return {
    currentZIndex,
    nextZIndex,
    getGlobalZIndex: () => globalZIndex,
  };
}

/** 重置全局层级（仅供测试使用） */
export function resetGlobalZIndex(value = BASE_Z_INDEX): void {
  globalZIndex = value;
}
