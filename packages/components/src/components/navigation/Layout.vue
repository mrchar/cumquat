<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue';
import { useMediaQuery, useToggle } from '@cumquat/composables';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

const BREAKPOINT_WIDTH: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

const props = withDefaults(
  defineProps<{
    /** 布局主轴方向 */
    direction?: 'vertical' | 'horizontal';
    /** 受控侧栏折叠态 */
    collapsed?: boolean;
    defaultCollapsed?: boolean;
    /** 低于该断点时自动折叠侧栏 */
    breakpoint?: Breakpoint;
    /** 是否提供 sider 插槽区域 */
    hasSider?: boolean;
  }>(),
  {
    direction: 'vertical',
    collapsed: undefined,
    defaultCollapsed: false,
    breakpoint: 'md',
    hasSider: false,
  },
);

const emit = defineEmits<{
  'update:collapsed': [collapsed: boolean];
  collapse: [];
  expand: [];
}>();

const manual = useToggle(props.defaultCollapsed);

// 受控值优先：裸 ref 由宿主驱动
const controlledCollapsed = ref(props.collapsed);
watch(
  () => props.collapsed,
  (next) => {
    if (next !== undefined) controlledCollapsed.value = next;
  },
);

/** 窄屏自动折叠：查询"视口宽度 < 断点" */
const isNarrow = useMediaQuery(
  computed(() => `(max-width: ${BREAKPOINT_WIDTH[props.breakpoint] - 1}px)`),
);

const userCollapsed = computed(
  () => props.collapsed ?? controlledCollapsed.value ?? manual.value.value,
);
const collapsed = computed(() => userCollapsed.value || isNarrow.value);

function setCollapsed(next: boolean) {
  if (props.collapsed !== undefined) controlledCollapsed.value = next;
  manual.toggle(next);
  emit('update:collapsed', next);
  if (next) emit('collapse');
  else emit('expand');
}

function toggleCollapsed() {
  setCollapsed(!userCollapsed.value);
}

provide('cumquat-layout', {
  collapsed,
  toggle: toggleCollapsed,
  setCollapsed,
});

defineExpose({
  collapsed,
  toggle: toggleCollapsed,
  collapse: () => setCollapsed(true),
  expand: () => setCollapsed(false),
});
</script>

<template>
  <div
    class="cumquat-layout"
    :class="[
      direction === 'vertical' ? 'cumquat-layout--vertical' : 'cumquat-layout--horizontal',
      collapsed && hasSider ? 'cumquat-layout--collapsed' : '',
    ]"
  >
    <header v-if="$slots.header" class="cumquat-layout__header">
      <slot name="header" :collapsed="collapsed" :toggle="toggleCollapsed" />
    </header>
    <div class="cumquat-layout__middle">
      <aside
        v-if="hasSider || $slots.sider"
        class="cumquat-layout__sider"
        :class="collapsed ? 'cumquat-layout__sider--collapsed' : ''"
      >
        <slot name="sider" :collapsed="collapsed" :toggle="toggleCollapsed" />
      </aside>
      <main class="cumquat-layout__body">
        <slot :collapsed="collapsed" :toggle="toggleCollapsed" />
      </main>
    </div>
    <footer v-if="$slots.footer" class="cumquat-layout__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>
