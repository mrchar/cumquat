<script setup lang="ts">
export interface UploadFile {
  name: string;
  size?: string;
  status?: 'uploading' | 'done' | 'error';
}

withDefaults(
  defineProps<{
    fileList?: UploadFile[];
    accept?: string;
    multiple?: boolean;
    /** 拖拽高亮态（由宿主控制或演示用） */
    dragging?: boolean;
  }>(),
  { fileList: () => [], accept: '', multiple: false, dragging: false },
);

const emit = defineEmits<{
  remove: [file: UploadFile];
}>();
</script>

<template>
  <div class="cumquat-upload flex flex-col gap-3">
    <div
      class="cumquat-upload__dragger flex flex-col items-center justify-center gap-2 rounded-cumquat border-2 border-dashed px-6 py-8 text-center transition-colors"
      :class="
        dragging
          ? 'border-cumquat-accent bg-cumquat-accent-soft'
          : 'border-cumquat-border-strong hover:border-cumquat-accent'
      "
    >
      <svg
        class="cumquat-upload__icon size-8 text-cumquat-text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m17 8-5-5-5 5M12 3v12" />
      </svg>
      <p class="cumquat-upload__hint text-sm text-cumquat-text">
        将文件拖到此处，或 <span class="font-medium text-cumquat-accent">点击上传</span>
      </p>
      <slot name="hint" />
    </div>

    <ul v-if="fileList.length > 0" class="cumquat-upload__list flex flex-col gap-1.5">
      <li
        v-for="(file, index) in fileList"
        :key="`${file.name}-${index}`"
        class="cumquat-upload__item flex items-center gap-2 rounded-cumquat bg-cumquat-surface-2 px-3 py-2 text-sm"
      >
        <svg
          class="size-4 shrink-0 text-cumquat-text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
        <span class="cumquat-upload__name flex-1 truncate text-cumquat-text">{{ file.name }}</span>
        <span v-if="file.size" class="cumquat-upload__size text-xs text-cumquat-text-muted">{{
          file.size
        }}</span>
        <span
          v-if="file.status === 'uploading'"
          class="cumquat-upload__progressing inline-block size-3.5 animate-spin rounded-full border-2 border-cumquat-border border-t-cumquat-accent"
        />
        <button
          type="button"
          aria-label="删除文件"
          class="cumquat-upload__remove cursor-pointer text-cumquat-text-muted transition-colors hover:text-cumquat-danger"
          @click="emit('remove', file)"
        >
          <svg
            class="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </li>
    </ul>
  </div>
</template>
