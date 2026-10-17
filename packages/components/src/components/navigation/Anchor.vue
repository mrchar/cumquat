<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useScroll, useScrollIntoView } from '@cumquat/composables';

export interface AnchorItem {
  href: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    items: AnchorItem[];
    /** 受控激活锚点 */
    active?: string;
    /** 命中判定的顶部偏移（px） */
    offset?: number;
    /** 点击时是否平滑滚动到目标 */
    scrollIntoView?: boolean;
  }>(),
  {
    items: () => [],
    active: undefined,
    offset: 0,
    scrollIntoView: true,
  },
);

const emit = defineEmits<{
  'update:active': [href: string];
  change: [href: string];
  click: [item: AnchorItem];
}>();

const innerActive = ref(props.active ?? '');
watch(
  () => props.active,
  (next) => {
    if (next !== undefined) innerActive.value = next;
  },
);

const { y: scrollY } = useScroll();
const scrollTo = useScrollIntoView();

function targetOf(href: string): HTMLElement | null {
  if (typeof document === 'undefined' || !href.startsWith('#')) return null;
  return document.getElementById(href.slice(1));
}

/** 滚动监听：命中最后一个越过偏移线的 section */
function detectActive() {
  if (props.active !== undefined) return;
  let current = '';
  for (const item of props.items) {
    const el = targetOf(item.href);
    if (!el) continue;
    if (el.getBoundingClientRect().top + scrollY.value <= scrollY.value + props.offset + 1) {
      current = item.href;
    }
  }
  if (current) innerActive.value = current;
}

watch(scrollY, detectActive);
onMounted(detectActive);

function go(item: AnchorItem, event: MouseEvent) {
  event.preventDefault();
  innerActive.value = item.href;
  emit('update:active', item.href);
  emit('change', item.href);
  emit('click', item);
  if (props.scrollIntoView) {
    const el = targetOf(item.href);
    if (el) scrollTo(el, { behavior: 'smooth', block: 'start' });
  }
}
</script>

<template>
  <nav class="cumquat-anchor" aria-label="锚点导航">
    <a
      v-for="item in items"
      :key="item.href"
      :href="item.href"
      :aria-current="innerActive === item.href ? 'true' : undefined"
      class="cumquat-anchor__link"
      :class="
        innerActive === item.href
          ? 'cumquat-anchor__link--active'
          : 'cumquat-anchor__link--inactive'
      "
      @click="go(item, $event)"
    >
      {{ item.label }}
    </a>
  </nav>
</template>
