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
  <div class="cumquat-upload">
    <div
      class="cumquat-upload__dragger"
      :class="dragging ? 'cumquat-upload__dragger--dragging' : ''"
    >
      <svg
        class="cumquat-upload__icon"
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
      <p class="cumquat-upload__hint">
        将文件拖到此处，或 <span class="cumquat-upload__hint-action">点击上传</span>
      </p>
      <slot name="hint" />
    </div>

    <ul v-if="fileList.length > 0" class="cumquat-upload__list">
      <li
        v-for="(file, index) in fileList"
        :key="`${file.name}-${index}`"
        class="cumquat-upload__item"
      >
        <svg
          class="cumquat-upload__file-icon"
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
        <span class="cumquat-upload__name">{{ file.name }}</span>
        <span v-if="file.size" class="cumquat-upload__size">{{ file.size }}</span>
        <span v-if="file.status === 'uploading'" class="cumquat-upload__progressing" />
        <button
          type="button"
          aria-label="删除文件"
          class="cumquat-upload__remove"
          @click="emit('remove', file)"
        >
          <svg
            class="cumquat-upload__remove-icon"
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
