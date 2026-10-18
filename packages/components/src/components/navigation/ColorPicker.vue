<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useActionValue, useDraggable, useFloating, useOpen } from '@cumquat/composables';
import type { ActionLike } from '@cumquat/composables';

interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    /** 预设色板 */
    presets?: string[];
    disabled?: boolean;
    showAlpha?: boolean;
    /** 颜色确认动作：确认点（选预设 / 输入 hex / 关闭面板）先乐观应用，动作失败自动回退旧色 */
    action?: ActionLike;
  }>(),
  {
    modelValue: '#4f46e5',
    presets: () => [
      '#4f46e5',
      '#0284c7',
      '#16a34a',
      '#d97706',
      '#dc2626',
      '#7c3aed',
      '#db2777',
      '#0d9488',
      '#525252',
      '#171717',
    ],
    disabled: false,
    showAlpha: false,
    action: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [color: string];
  change: [color: string];
  /** 颜色确认动作失败（reject 或返回值导出错误）时触发，颜色已回退 */
  actionError: [error: unknown];
}>();

/* ---------- 颜色转换纯函数 ---------- */
function clampByte(n: number) {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function hsvToRgb({ h, s, v }: Pick<Hsva, 'h' | 's' | 'v'>) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: clampByte((r + m) * 255),
    g: clampByte((g + m) * 255),
    b: clampByte((b + m) * 255),
  };
}

function rgbToHsv(r: number, g: number, b: number): Pick<Hsva, 'h' | 's' | 'v'> {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function toHex2(n: number) {
  return clampByte(n).toString(16).padStart(2, '0');
}

function hsvaToHex({ h, s, v, a }: Hsva) {
  const { r, g, b } = hsvToRgb({ h, s, v });
  const base = `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
  return a < 1 ? `${base}${toHex2(a * 255)}` : base;
}

function parseColor(input: string): Hsva {
  const fallback: Hsva = { h: 239, s: 0.84, v: 0.9, a: 1 };
  const value = input.trim().toLowerCase();
  const hexMatch = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3)
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { ...rgbToHsv(r, g, b), a };
  }
  const rgbMatch = /rgba?\(([^)]+)\)/.exec(value);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((part) => Number(part.trim()));
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => !Number.isNaN(n))) {
      return {
        ...rgbToHsv(parts[0], parts[1], parts[2]),
        a: parts[3] === undefined ? 1 : Math.min(1, Math.max(0, parts[3])),
      };
    }
  }
  return fallback;
}

/** 十六进制合法性 */
function isValidHex(input: string) {
  return /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(input.trim());
}

/* ---------- 状态 ---------- */
const color = ref<Hsva>(parseColor(props.modelValue));

/* ---------------- action 颜色确认动作：乐观应用，失败回退 ---------------- */
const { pending: actionPending, error: actionError, commit: commitAction } = useActionValue();

/** 最近一次确认对外提交的颜色（revert 依据；拖拽预览值不算确认） */
const lastConfirmed = ref(props.modelValue);

const hexInput = ref(hsvaToHex(color.value));

watch(
  () => props.modelValue,
  (next) => {
    if (next && next !== hsvaToHex(color.value)) color.value = parseColor(next);
  },
);

function emitColor(hex: string) {
  emit('update:modelValue', hex);
  emit('change', hex);
  hexInput.value = hex;
}

/** 拖拽等连续预览的即时提交（不触发 action） */
function commit() {
  const hex = hsvaToHex(color.value);
  emitColor(hex);
}

/** 用户确认统一入口：选预设 / 输入 hex / 关闭面板。乐观应用，action 失败回退上一确认色 */
function confirmColor(hex: string) {
  if (actionPending.value) return;
  const changed = hex !== lastConfirmed.value;
  const previous = lastConfirmed.value;
  lastConfirmed.value = hex;
  emitColor(hex);
  if (!props.action || !changed) return;
  void commitAction({
    execute: () => props.action?.(hex),
    revert: () => {
      color.value = parseColor(previous);
      lastConfirmed.value = previous;
      emitColor(previous);
    },
  }).then((ok) => {
    if (!ok && actionError.value != null) emit('actionError', actionError.value);
  });
}

const hueColor = computed(() => hsvaToHex({ ...color.value, s: 1, v: 1, a: 1 }));

/* ---------- 开合与浮层 ---------- */
const { isOpen, toggle, close } = useOpen({
  onChange: (next) => {
    // 关闭面板即最终确认当前颜色
    if (!next) confirmColor(hsvaToHex(color.value));
  },
});
const { referenceRef, floatingRef, floatingStyles } = useFloating({
  placement: 'bottom-start',
  open: isOpen,
});

/* ---------- 面板取色拖拽 ---------- */
const areaRef = ref<HTMLElement | null>(null);
const hueRef = ref<HTMLElement | null>(null);
const alphaRef = ref<HTMLElement | null>(null);

useDraggable(areaRef, {
  disabled: () => actionPending.value,
  onStart: (pos) => {
    color.value = { ...color.value, s: pos.ratioX, v: 1 - pos.ratioY };
    commit();
  },
  onMove: (pos) => {
    color.value = { ...color.value, s: pos.ratioX, v: 1 - pos.ratioY };
    commit();
  },
});

useDraggable(hueRef, {
  axis: 'x',
  disabled: () => actionPending.value,
  onStart: (pos) => {
    color.value = { ...color.value, h: pos.ratioX * 360 };
    commit();
  },
  onMove: (pos) => {
    color.value = { ...color.value, h: pos.ratioX * 360 };
    commit();
  },
});

useDraggable(alphaRef, {
  axis: 'x',
  disabled: () => actionPending.value,
  onStart: (pos) => {
    color.value = { ...color.value, a: pos.ratioX };
    commit();
  },
  onMove: (pos) => {
    color.value = { ...color.value, a: pos.ratioX };
    commit();
  },
});

function pickPreset(preset: string) {
  color.value = parseColor(preset);
  confirmColor(hsvaToHex(color.value));
  close();
}

function onHexInput() {
  const value = hexInput.value.startsWith('#') ? hexInput.value : `#${hexInput.value}`;
  if (isValidHex(value)) {
    color.value = parseColor(value);
    confirmColor(hsvaToHex(color.value));
  }
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggle();
  } else if (event.key === 'Escape') {
    close();
  }
}
</script>

<template>
  <div ref="referenceRef" class="cumquat-color-picker">
    <button
      type="button"
      class="cumquat-color-picker__trigger"
      :class="isOpen ? 'cumquat-color-picker__trigger--open' : ''"
      :disabled="disabled || actionPending"
      @click="toggle()"
      @keydown="onTriggerKeydown"
    >
      <span class="cumquat-color-picker__swatch" :style="{ backgroundColor: hsvaToHex(color) }" />
      <span class="cumquat-color-picker__value">{{ hsvaToHex(color) }}</span>
    </button>

    <Transition name="cumquat-fade">
      <div
        v-if="isOpen"
        ref="floatingRef"
        class="cumquat-color-picker__panel"
        :style="floatingStyles"
      >
        <!-- 饱和度 / 明度面板 -->
        <div
          ref="areaRef"
          class="cumquat-color-picker__area"
          :style="{ backgroundColor: hueColor }"
        >
          <span class="cumquat-color-picker__gradient-dark" />
          <span class="cumquat-color-picker__gradient-light" />
          <span
            class="cumquat-color-picker__thumb"
            :style="{ left: `${color.s * 100}%`, top: `${(1 - color.v) * 100}%` }"
          />
        </div>

        <!-- 色相条 -->
        <div ref="hueRef" class="cumquat-color-picker__hue">
          <span
            class="cumquat-color-picker__hue-thumb"
            :style="{ left: `${(color.h / 360) * 100}%` }"
          />
        </div>

        <!-- 透明度条 -->
        <div
          v-if="showAlpha"
          ref="alphaRef"
          class="cumquat-color-picker__alpha"
          :style="{
            backgroundImage: `linear-gradient(90deg, ${hueColor}00, ${hueColor})`,
          }"
        >
          <span class="cumquat-color-picker__alpha-thumb" :style="{ left: `${color.a * 100}%` }" />
        </div>

        <input
          v-model="hexInput"
          class="cumquat-color-picker__hex"
          aria-label="十六进制颜色"
          @change="onHexInput"
          @keydown.enter="onHexInput"
        />

        <!-- 预设色板 -->
        <div class="cumquat-color-picker__presets">
          <button
            v-for="preset in presets"
            :key="preset"
            type="button"
            :aria-label="`选择颜色 ${preset}`"
            class="cumquat-color-picker__preset"
            :class="
              preset.toLowerCase() === hsvaToHex(color)
                ? 'cumquat-color-picker__preset--selected'
                : 'cumquat-color-picker__preset--default'
            "
            :style="{ backgroundColor: preset }"
            @click="pickPreset(preset)"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>
