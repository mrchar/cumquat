<script setup lang="ts">
import { computed, ref } from 'vue';
import { useActionState } from '@cumquat/composables';

export interface UploadFile {
  /** 内部唯一标识（外部传入数据可缺省） */
  uid?: string | number;
  name: string;
  size?: string;
  status?: 'uploading' | 'done' | 'error';
  /** 0-100 上传进度 */
  percent?: number;
  /** 原始浏览器文件（内部入队项携带） */
  raw?: File;
}

const props = withDefaults(
  defineProps<{
    fileList?: UploadFile[];
    accept?: string;
    multiple?: boolean;
    /** 最多文件数 */
    maxCount?: number;
    /** 单文件大小上限（字节） */
    maxSize?: number;
    /** 实际上传动作；不提供时入队即标记成功（演示态） */
    uploader?: (file: File, onProgress: (percent: number) => void) => Promise<unknown>;
    /** 拖拽高亮态（外部强制；默认组件自管） */
    dragging?: boolean;
    disabled?: boolean;
  }>(),
  {
    fileList: () => [],
    accept: '',
    multiple: false,
    maxCount: undefined,
    maxSize: undefined,
    uploader: undefined,
    dragging: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:fileList': [files: UploadFile[]];
  remove: [file: UploadFile];
  change: [files: UploadFile[]];
  success: [file: UploadFile];
  error: [payload: { file: UploadFile; error: unknown }];
  exceed: [files: File[]];
  reject: [files: File[]];
}>();

let uidSeed = 0;
const inputRef = ref<HTMLInputElement | null>(null);
const internalDrag = ref(false);
/** 组件内部入队的文件（外部 fileList 之外） */
const queue = ref<UploadFile[]>([]);

const isDragging = computed(() => props.dragging || internalDrag.value);
const displayList = computed(() => [...props.fileList, ...queue.value]);

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function notifyChange() {
  emit('update:fileList', displayList.value);
  emit('change', displayList.value);
}

/** accept 校验：扩展名或 MIME 命中其一即可 */
function acceptMatch(file: File): boolean {
  if (!props.accept) return true;
  const tokens = props.accept.split(',').map((token) => token.trim().toLowerCase());
  return tokens.some((token) => {
    if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token);
    if (token.endsWith('/*')) return file.type.toLowerCase().startsWith(token.slice(0, -1));
    return file.type.toLowerCase() === token;
  });
}

const action = useActionState(
  async (files: File[]) => {
    await Promise.all(files.map((raw) => runUpload(raw)));
  },
  { disableOnPending: false },
);

async function runUpload(raw: File) {
  const entry: UploadFile = {
    uid: ++uidSeed,
    name: raw.name,
    size: formatSize(raw.size),
    status: 'uploading',
    percent: 0,
    raw,
  };
  queue.value = [...queue.value, entry];
  notifyChange();
  try {
    if (props.uploader) {
      await props.uploader(raw, (percent) => {
        entry.percent = percent;
        queue.value = [...queue.value];
      });
    }
    entry.status = 'done';
    entry.percent = 100;
    queue.value = [...queue.value];
    emit('success', entry);
  } catch (error) {
    entry.status = 'error';
    queue.value = [...queue.value];
    emit('error', { file: entry, error });
  } finally {
    notifyChange();
  }
}

function intake(fileListInput: FileList | File[]) {
  if (props.disabled) return;
  const incoming = Array.from(fileListInput);
  const accepted = incoming.filter(acceptMatch);
  const rejected = incoming.filter((file) => !acceptMatch(file));
  if (rejected.length > 0) emit('reject', rejected);

  const remain = (props.maxCount ?? Number.POSITIVE_INFINITY) - displayList.value.length;
  let valid = accepted.filter((file) => props.maxSize === undefined || file.size <= props.maxSize);
  if (valid.length > remain) {
    emit('exceed', valid.slice(remain));
    valid = valid.slice(0, remain);
  }
  if (valid.length > 0) void action.run(valid);
}

function triggerPick() {
  if (props.disabled) return;
  inputRef.value?.click();
}

function onInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) intake(input.files);
  input.value = '';
}

function onDrop(event: DragEvent) {
  internalDrag.value = false;
  if (props.disabled) return;
  event.preventDefault();
  if (event.dataTransfer?.files) intake(event.dataTransfer.files);
}

function onDragOver(event: DragEvent) {
  if (props.disabled) return;
  event.preventDefault();
  internalDrag.value = true;
}

function onDragLeave() {
  internalDrag.value = false;
}

function removeFile(file: UploadFile) {
  const index = queue.value.findIndex((item) => item.uid === file.uid);
  if (index >= 0) queue.value = queue.value.filter((item) => item.uid !== file.uid);
  emit('remove', file);
  notifyChange();
}

function retry(file: UploadFile) {
  if (!file.raw || file.status !== 'error') return;
  const index = queue.value.findIndex((item) => item.uid === file.uid);
  if (index >= 0) queue.value = queue.value.filter((item) => item.uid !== file.uid);
  void runUpload(file.raw);
}
</script>

<template>
  <div class="cumquat-upload">
    <input
      ref="inputRef"
      type="file"
      class="cumquat-upload__input"
      :accept="accept"
      :multiple="multiple"
      hidden
      @change="onInputChange"
    />
    <div
      class="cumquat-upload__dragger"
      :class="[
        isDragging ? 'cumquat-upload__dragger--dragging' : '',
        disabled ? 'cumquat-upload__dragger--disabled' : '',
      ]"
      role="button"
      tabindex="0"
      @click="triggerPick"
      @keydown.enter="triggerPick"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
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

    <ul v-if="displayList.length > 0" class="cumquat-upload__list">
      <li
        v-for="(file, index) in displayList"
        :key="file.uid ?? `${file.name}-${index}`"
        class="cumquat-upload__item"
        :class="file.status ? `cumquat-upload__item--${file.status}` : ''"
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
        <span v-if="file.status === 'uploading'" class="cumquat-upload__progressing">
          <i class="cumquat-upload__progress-bar" :style="{ width: `${file.percent ?? 0}%` }" />
        </span>
        <button
          v-if="file.status === 'error'"
          type="button"
          aria-label="重试"
          class="cumquat-upload__retry"
          @click="retry(file)"
        >
          重试
        </button>
        <button
          type="button"
          aria-label="删除文件"
          class="cumquat-upload__remove"
          @click="removeFile(file)"
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
