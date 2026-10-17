<script setup lang="ts">
import { ref } from 'vue';
import {
  Alert,
  Button,
  CodeCard,
  Loading,
  Message,
  Notification,
  Result,
  Skeleton,
  Upload,
} from '@cumquat/components';

interface DemoFile {
  name: string;
  size: string;
  status: string;
}

const messageVisible = ref(true);
const alertVisible = ref(true);
const notifyVisible = ref(true);

const files = ref<DemoFile[]>([
  { name: '设计稿.pdf', size: '2.1 MB', status: 'done' },
  { name: '需求文档.docx', size: '640 KB', status: 'done' },
]);

function removeFile(file: DemoFile) {
  files.value = files.value.filter((item) => item !== file);
}

const messageCode = `
  <Message type="info">这是一条信息提示</Message>
  <Message type="success">保存成功</Message>
  <Message type="warning">磁盘空间不足</Message>
  <Message type="danger">网络连接失败</Message>
  <div class="flex items-center gap-3">
    <Message v-model="messageVisible" type="success" closable>可关闭提示</Message>
    <Button size="sm" @click="messageVisible = true">重新显示</Button>
  </div>
`;

const alertCode = `
  <Alert type="info" title="信息提示">这是一条信息提示的内容。</Alert>
  <Alert type="success" title="操作成功">数据已保存。</Alert>
  <Alert v-model="alertVisible" type="warning" title="警告" closable
    >这是一条可关闭的警告。</Alert
  >
  <Alert type="danger" title="错误">操作失败，请重试。</Alert>
`;

const notificationCode = `
  <Notification v-model:visible="notifyVisible" title="系统通知" type="success">
    您的任务已完成。
  </Notification>
  <Button size="sm" :disabled="notifyVisible" @click="notifyVisible = true"
    >重新显示通知</Button
  >
`;

const loadingCode = `
  <Loading text="加载中..." />
  <Loading />
`;

const skeletonCode = `
  <Skeleton :rows="3" :avatar="true" />
`;

const resultCode = `
  <Result status="success" title="操作成功" sub-title="数据已提交至服务器" />
  <Result status="danger" title="操作失败" sub-title="请检查网络后重试" />
`;

const uploadCode = `
  <Upload :file-list="files" @remove="removeFile" />
`;
</script>

<template>
  <div class="flex flex-col gap-10">
    <section id="message" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Message 全局提示</h2>
      <CodeCard title="消息类型" :code="messageCode">
        <div class="flex flex-col gap-3">
          <Message type="info">这是一条信息提示</Message>
          <Message type="success">保存成功</Message>
          <Message type="warning">磁盘空间不足</Message>
          <Message type="danger">网络连接失败</Message>
          <div class="flex items-center gap-3">
            <Message v-model="messageVisible" type="success" closable>可关闭提示</Message>
            <Button size="sm" @click="messageVisible = true">重新显示</Button>
          </div>
        </div>
      </CodeCard>
    </section>

    <section id="alert" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Alert 警告提示</h2>
      <CodeCard title="警告类型" :code="alertCode">
        <div class="flex flex-col gap-3">
          <Alert type="info" title="信息提示">这是一条信息提示的内容。</Alert>
          <Alert type="success" title="操作成功">数据已保存。</Alert>
          <Alert v-model="alertVisible" type="warning" title="警告" closable
            >这是一条可关闭的警告。</Alert
          >
          <Alert type="danger" title="错误">操作失败，请重试。</Alert>
        </div>
      </CodeCard>
    </section>

    <section id="notification" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Notification 通知提醒</h2>
      <CodeCard title="通知提醒" :code="notificationCode">
        <div class="flex flex-wrap items-center gap-3">
          <Notification v-model:visible="notifyVisible" title="系统通知" type="success">
            您的任务已完成。
          </Notification>
          <Button size="sm" :disabled="notifyVisible" @click="notifyVisible = true"
            >重新显示通知</Button
          >
        </div>
      </CodeCard>
    </section>

    <section id="loading" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Loading 加载中</h2>
      <CodeCard title="加载指示" :code="loadingCode">
        <div class="flex flex-wrap items-center justify-center gap-10">
          <Loading text="加载中..." />
          <Loading />
        </div>
      </CodeCard>
    </section>

    <section id="skeleton" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Skeleton 骨架屏</h2>
      <CodeCard title="骨架屏" :code="skeletonCode">
        <div>
          <Skeleton :rows="3" :avatar="true" />
        </div>
      </CodeCard>
    </section>

    <section id="result" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Result 结果页</h2>
      <CodeCard title="结果状态" :code="resultCode">
        <div class="grid grid-cols-2 gap-4">
          <Result status="success" title="操作成功" sub-title="数据已提交至服务器" />
          <Result status="danger" title="操作失败" sub-title="请检查网络后重试" />
        </div>
      </CodeCard>
    </section>

    <section id="upload" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Upload 上传</h2>
      <CodeCard title="文件列表" :code="uploadCode">
        <div>
          <Upload :file-list="files" @remove="removeFile" />
          <p class="mt-2 text-sm text-cumquat-text-muted">点击文件后的删除按钮可移除。</p>
        </div>
      </CodeCard>
    </section>
  </div>
</template>
