<script setup lang="ts">
import { computed } from 'vue';
import { useScroll } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** 是否启用（显式开关） */
    visible?: boolean;
    /** 滚动超过该高度（px）才出现，默认 0 即恒显 */
    visibilityHeight?: number;
    /** 距视口右侧（px） */
    right?: number;
    /** 距视口底部（px） */
    bottom?: number;
    /** 回到顶部的动画时长（ms），0 为瞬时 */
    duration?: number;
  }>(),
  { visible: true, visibilityHeight: 0, right: 32, bottom: 32, duration: 300 },
);

const emit = defineEmits<{
  click: [];
}>();

const { y: scrollY } = useScroll();

const shown = computed(() => props.visible && scrollY.value >= props.visibilityHeight);

function scrollToTop() {
  if (typeof window === 'undefined') return;
  if (props.duration > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
  else window.scrollTo(0, 0);
  emit('click');
}
</script>

<template>
  <Transition name="cumquat-fade">
    <button
      v-if="shown"
      type="button"
      aria-label="回到顶部"
      class="cumquat-back-top"
      :style="{ right: `${right}px`, bottom: `${bottom}px` }"
      @click="scrollToTop"
    >
      <svg
        class="cumquat-back-top__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 19V5m-7 7 7-7 7 7" />
      </svg>
    </button>
  </Transition>
</template>
