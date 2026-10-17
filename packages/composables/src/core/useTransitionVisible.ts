import { nextTick, ref, watch } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { toValue } from 'vue';

export interface TransitionVisibleReturn {
  /** 是否应将浮层挂载到 DOM（离场动画结束后才卸载） */
  rendered: Ref<boolean>;
  /** 是否处于可见态（驱动进出场 class） */
  visible: Ref<boolean>;
  /** 绑定到 <Transition> 的 after-leave 事件 */
  onAfterLeave: () => void;
}

/**
 * 进出场过渡的挂载状态机：
 * - 打开时先 rendered=true（挂载），下一帧 visible=true（触发进入过渡）；
 * - 关闭时 visible=false（触发离开过渡），after-leave 后 rendered=false（卸载）。
 *
 * 组件模板用法：
 * `<Transition @after-leave="onAfterLeave"><div v-if="rendered" v-show="visible" />`
 *
 * @param isOpen 开合来源（ref / getter）
 */
export function useTransitionVisible(isOpen: MaybeRefOrGetter<boolean>): TransitionVisibleReturn {
  const rendered = ref(toValue(isOpen));
  const visible = ref(false);

  watch(
    () => toValue(isOpen),
    (open) => {
      if (open) {
        rendered.value = true;
        nextTick(() => {
          visible.value = true;
        });
      } else {
        visible.value = false;
        // 卸载时机由 <Transition @after-leave="onAfterLeave"> 决定，
        // 保证离场动画完整播放
      }
    },
    { immediate: true, flush: 'sync' },
  );

  const onAfterLeave = () => {
    rendered.value = false;
  };

  return { rendered, visible, onAfterLeave };
}
