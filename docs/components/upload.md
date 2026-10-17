---
title: Upload 上传
---

# Upload 上传

文件选择、拖拽上传与列表管理。

`UploadFile` 结构：`{ uid?: string | number; name: string; size?: string; status?: 'uploading' | 'done' | 'error'; percent?: number; raw?: File }`。

| Prop     | 类型                                                                      | 默认值  | 说明                                           |
| -------- | ------------------------------------------------------------------------- | ------- | ---------------------------------------------- |
| fileList | `UploadFile[]`                                                            | `[]`    | 外部文件列表（v-model:fileList）               |
| accept   | `string`                                                                  | `''`    | 接受类型（扩展名 / MIME，逗号分隔）            |
| multiple | `boolean`                                                                 | `false` | 多选                                           |
| maxCount | `number`                                                                  | -       | 最多文件数                                     |
| maxSize  | `number`                                                                  | -       | 单文件大小上限（字节）                         |
| uploader | `(file: File, onProgress: (percent: number) => void) => Promise<unknown>` | -       | 实际上传动作；不提供时入队即标记成功（演示态） |
| dragging | `boolean`                                                                 | `false` | 外部强制拖拽高亮态（默认组件自管）             |
| disabled | `boolean`                                                                 | `false` | 禁用                                           |

| 事件            | 参数                                   | 说明                    |
| --------------- | -------------------------------------- | ----------------------- |
| update:fileList | `files: UploadFile[]`                  | 文件列表更新            |
| change          | `files: UploadFile[]`                  | 文件列表变化            |
| success         | `file: UploadFile`                     | 单文件上传成功          |
| error           | `{ file: UploadFile, error: unknown }` | 单文件上传失败          |
| remove          | `file: UploadFile`                     | 删除文件                |
| exceed          | `files: File[]`                        | 超出 maxCount 的部分    |
| reject          | `files: File[]`                        | accept 校验未通过的部分 |

| 插槽 | 说明           |
| ---- | -------------- |
| hint | 拖拽区附加提示 |

```vue
<Upload
  v-model:file-list="files"
  accept=".png,.jpg"
  multiple
  :max-count="5"
  :max-size="2 * 1024 * 1024"
  :uploader="uploadToServer"
  @error="onUploadError"
/>
```

---

## 交互演示

### 文件列表

<CodeCard v-model:code="uploadCode" editable title="文件列表">
  <LiveDemo :code="uploadCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

interface DemoFile {
  name: string;
  size: string;
  status: string;
}

const files = ref<DemoFile[]>([
  { name: '设计稿.pdf', size: '2.1 MB', status: 'done' },
  { name: '需求文档.docx', size: '640 KB', status: 'done' },
]);

function removeFile(file: DemoFile) {
  files.value = files.value.filter((item) => item !== file);
}

const uploadCode = ref(`
  <div class="flex flex-col gap-2">
    <Upload :file-list="files" @remove="removeFile" />
    <p class="text-sm text-cumquat-text-muted">点击文件后的删除按钮可移除。</p>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { files, removeFile, uploadCode };
</script>

