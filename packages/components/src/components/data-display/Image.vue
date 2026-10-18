<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  subscribeErrorText,
  useDraggable,
  useImageState,
  useSubscribe,
} from '@cumquat/composables';
import type { SubscribeHandler } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    /** 圆角 */
    rounded?: boolean;
    /** 进入视口才加载 */
    lazy?: boolean;
    /** 点击进入预览 */
    previewable?: boolean;
    /** 预览图地址（缺省用 src） */
    previewSrc?: string;
    /** 订阅图片地址：挂载时调用，resolve 出的地址用于渲染，优先级高于 src */
    subscribe?: SubscribeHandler<string>;
    /** 订阅失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    src: '',
    alt: '',
    rounded: false,
    lazy: false,
    previewable: false,
    previewSrc: '',
    subscribe: undefined,
    errorText: undefined,
  },
);

const {
  state: subState,
  loading: subLoading,
  error: subError,
} = useSubscribe<string>(() => props.subscribe);

const effectiveSrc = computed<string>(() =>
  subState.value.status === 'success' ? (subState.value.data as string) : (props.src ?? ''),
);
const errorText = computed(() =>
  subError.value != null ? subscribeErrorText(subError.value, props.errorText) : null,
);

const emit = defineEmits<{
  load: [event: Event];
  error: [event: Event];
  close: [];
}>();

const hostRef = ref<HTMLElement | null>(null);

const { isLoading, isError, shouldLoad, onLoad, onError, reload } = useImageState(
  () => effectiveSrc.value,
  {
    lazy: props.lazy,
    target: hostRef,
    onLoad: (event) => emit('load', event),
    onError: (event) => emit('error', event),
  },
);

/* ---------- 预览变换 ---------- */
const previewOpen = ref(false);
const scale = ref(1);
const rotate = ref(0);
const flipX = ref(false);
const flipY = ref(false);

const previewImageRef = ref<HTMLElement | null>(null);

const { x, y, dragging } = useDraggable(previewImageRef, {
  disabled: () => !previewOpen.value,
});

const transform = computed(
  () =>
    `translate(${x.value}px, ${y.value}px) scale(${scale.value}) rotate(${rotate.value}deg) scaleX(${flipX.value ? -1 : 1}) scaleY(${flipY.value ? -1 : 1})`,
);

function openPreview() {
  if (!props.previewable) return;
  previewOpen.value = true;
}

function closePreview() {
  previewOpen.value = false;
  emit('close');
}

function resetTransform() {
  scale.value = 1;
  rotate.value = 0;
  flipX.value = false;
  flipY.value = false;
}

function zoomIn() {
  scale.value = Math.min(5, Number((scale.value + 0.25).toFixed(2)));
}

function zoomOut() {
  scale.value = Math.max(0.25, Number((scale.value - 0.25).toFixed(2)));
}

function rotateLeft() {
  rotate.value -= 90;
}

function rotateRight() {
  rotate.value += 90;
}

function toggleFlipX() {
  flipX.value = !flipX.value;
}

function toggleFlipY() {
  flipY.value = !flipY.value;
}

function onWheel(event: WheelEvent) {
  event.preventDefault();
  if (event.deltaY < 0) zoomIn();
  else zoomOut();
}

function onPreviewKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Escape':
      closePreview();
      break;
    case '+':
    case '=':
      zoomIn();
      break;
    case '-':
      zoomOut();
      break;
    case 'ArrowLeft':
      rotateLeft();
      break;
    case 'ArrowRight':
      rotateRight();
      break;
    default:
      break;
  }
}
</script>

<template>
  <span
    ref="hostRef"
    class="cumquat-image"
    :class="[
      rounded ? 'cumquat-image--rounded' : '',
      previewable ? 'cumquat-image--previewable' : '',
    ]"
  >
    <span v-if="isLoading && shouldLoad" class="cumquat-image__placeholder" aria-hidden="true" />
    <img
      v-if="shouldLoad && !isError && effectiveSrc"
      :src="effectiveSrc"
      :alt="alt"
      class="cumquat-image__img"
      loading="lazy"
      @load="onLoad"
      @error="onError"
      @click="openPreview"
    />
    <button
      v-if="isError"
      type="button"
      class="cumquat-image__fallback cumquat-image__fallback--button"
      @click="reload"
    >
      <svg
        class="cumquat-image__fallback-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-4-4L5 23" />
      </svg>
      <span class="cumquat-image__fallback-text">加载失败，点击重试</span>
    </button>

    <Transition name="cumquat-fade">
      <div
        v-if="previewOpen"
        class="cumquat-image-preview"
        role="dialog"
        aria-modal="true"
        tabindex="0"
        @click.self="closePreview"
        @wheel="onWheel"
        @keydown="onPreviewKeydown"
      >
        <img
          ref="previewImageRef"
          :src="previewSrc || effectiveSrc"
          :alt="alt"
          class="cumquat-image-preview__img"
          :class="dragging ? 'cumquat-image-preview__img--dragging' : ''"
          :style="{ transform }"
          draggable="false"
        />
        <div class="cumquat-image-preview__toolbar">
          <button type="button" aria-label="缩小" @click="zoomOut">−</button>
          <button type="button" aria-label="放大" @click="zoomIn">+</button>
          <button type="button" aria-label="左旋" @click="rotateLeft">⟲</button>
          <button type="button" aria-label="右旋" @click="rotateRight">⟳</button>
          <button type="button" aria-label="水平翻转" @click="toggleFlipX">⇋</button>
          <button type="button" aria-label="垂直翻转" @click="toggleFlipY">⇵</button>
          <button type="button" aria-label="重置" @click="resetTransform">重置</button>
          <button type="button" aria-label="关闭" @click="closePreview">✕</button>
        </div>
      </div>
    </Transition>

    <p v-if="errorText" class="cumquat-image__error cq-state--error" role="alert">
      {{ errorText }}
    </p>
  </span>
</template>
