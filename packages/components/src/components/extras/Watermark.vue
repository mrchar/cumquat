<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { subscribeErrorText, useResizeObserver, useSubscribe } from '@cumquat/composables';
import type { SubscribeHandler } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** 水印文字 */
    content?: string | string[];
    /** 旋转角度（deg） */
    rotate?: number;
    /** 平铺间隔（px） */
    gap?: number;
    /** 水印颜色 */
    color?: string;
    /** 字号（px） */
    fontSize?: number;
    /** 水印图片（优先于文字，传图片地址） */
    image?: string;
    /** 水印层级 */
    zIndex?: number;
    /** 订阅水印内容：挂载时调用，resolve 出的内容用于渲染，优先级高于 content */
    subscribe?: SubscribeHandler<string | string[]>;
    /** 订阅失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    content: '',
    rotate: -22,
    gap: 96,
    color: 'rgba(23,23,23,0.16)',
    fontSize: 14,
    image: undefined,
    zIndex: 9,
    subscribe: undefined,
    errorText: undefined,
  },
);

const {
  state: subState,
  loading: subLoading,
  error: subError,
} = useSubscribe<string | string[]>(() => props.subscribe);

const effectiveContent = computed<string | string[]>(() =>
  subState.value.status === 'success'
    ? (subState.value.data as string | string[])
    : (props.content ?? ''),
);
const errorText = computed(() =>
  subError.value != null ? subscribeErrorText(subError.value, props.errorText) : null,
);

/** 归一为字符串，供 canvas 绘制 */
const contentText = computed(() =>
  Array.isArray(effectiveContent.value) ? effectiveContent.value.join(' ') : effectiveContent.value,
);

const rootRef = ref<HTMLElement | null>(null);
const layerRef = ref<HTMLElement | null>(null);
const dataUrl = ref('');
const rebuildTick = ref(0);

const { width, height } = useResizeObserver(rootRef);

/** 单元尺寸 */
const cellSize = computed(() => ({
  width: Math.max(props.gap * 2, 160),
  height: Math.max(props.gap + 24, 80),
}));

/** canvas 是否可用（jsdom 下无 canvas 实现，走文本降级） */
const canvasSupported =
  typeof document !== 'undefined' &&
  typeof document.createElement('canvas').getContext === 'function';

function drawWatermark() {
  if (!canvasSupported) {
    dataUrl.value = '';
    return;
  }
  const { width: cellWidth, height: cellHeight } = cellSize.value;
  const canvas = document.createElement('canvas');
  const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  canvas.width = cellWidth * ratio;
  canvas.height = cellHeight * ratio;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    dataUrl.value = '';
    return;
  }
  ctx.scale(ratio, ratio);
  ctx.translate(cellWidth / 2, cellHeight / 2);
  ctx.rotate((Math.PI / 180) * props.rotate);
  if (props.image) {
    // 图片绘制依赖资源加载完成，失败时静默降级为文字
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, -cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight);
      dataUrl.value = canvas.toDataURL();
    };
    img.src = props.image;
  }
  ctx.fillStyle = props.color;
  ctx.font = `${props.fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(contentText.value, 0, 0);
  dataUrl.value = canvas.toDataURL();
}

/** 降级模式下的固定平铺数量 */
const items = computed(() => {
  const cols = Math.max(1, Math.ceil(width.value / cellSize.value.width));
  const rows = Math.max(1, Math.ceil(height.value / cellSize.value.height));
  // jsdom 无布局时给一个固定网格，保证水印可见
  const safeCols = width.value === 0 ? 6 : cols;
  const safeRows = height.value === 0 ? 4 : rows;
  return Array.from({ length: safeCols * safeRows }, (_, index) => ({
    key: index,
    left: (index % safeCols) * cellSize.value.width,
    top: Math.floor(index / safeCols) * cellSize.value.height,
  }));
});

watch(
  () => [
    effectiveContent.value,
    props.rotate,
    props.gap,
    props.color,
    props.fontSize,
    props.image,
    width.value,
    height.value,
    rebuildTick.value,
  ],
  () => drawWatermark(),
  { immediate: true },
);

/* ---------- MutationObserver：节点被删/属性被篡改时自动重建 ---------- */
let observer: MutationObserver | null = null;

function setupObserver() {
  if (typeof MutationObserver === 'undefined' || !rootRef.value) return;
  observer?.disconnect();
  observer = new MutationObserver((mutations) => {
    const tampered = mutations.some((mutation) => {
      if (mutation.type === 'childList') {
        return Array.from(mutation.removedNodes).some(
          (node) => node === layerRef.value || (node as HTMLElement).contains?.(layerRef.value),
        );
      }
      if (mutation.type === 'attributes' && mutation.target === layerRef.value) return true;
      return false;
    });
    if (tampered) {
      observer?.disconnect();
      rebuildTick.value += 1;
      requestAnimationFrame(setupObserver);
    }
  });
  observer.observe(rootRef.value, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'aria-hidden'],
  });
}

watch(rootRef, () => setupObserver(), { immediate: true });

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div ref="rootRef" class="cumquat-watermark">
    <slot />
    <div ref="layerRef" class="cumquat-watermark__layer" :style="{ zIndex }" aria-hidden="true">
      <!-- canvas 可用：背景图平铺 -->
      <div
        v-if="dataUrl"
        class="cumquat-watermark__canvas"
        :style="{
          backgroundImage: `url(${dataUrl})`,
          backgroundSize: `${cellSize.width}px ${cellSize.height}px`,
        }"
      />
      <!-- 降级（无 canvas / SSR）：文本节点平铺 -->
      <template v-else>
        <span
          v-for="entry in items"
          :key="entry.key"
          class="cumquat-watermark__item"
          :style="{
            left: `${entry.left}px`,
            top: `${entry.top}px`,
            color,
            fontSize: `${fontSize}px`,
            transform: `rotate(${rotate}deg)`,
          }"
        >
          {{ contentText }}
        </span>
      </template>
    </div>

    <p v-if="errorText" class="cumquat-watermark__error cq-state--error" role="alert">
      {{ errorText }}
    </p>
  </div>
</template>
