import { ref } from 'vue';
import { message, notification } from '@cumquat/composables';
import type { Sample } from '../samples';

/** 反馈 */
export const feedbackSamples: Sample[] = [
  {
    key: 'message',
    title: 'Message 消息提示',
    code: `
  <div class="flex flex-col gap-3">
    <Message type="info">这是一条信息提示</Message>
    <Message v-model="visible" type="success" closable>操作成功，点击关闭</Message>
    <Button size="sm" @click="visible = true">重新显示</Button>
  </div>
`,
    scope: () => ({ visible: ref(true) }),
  },
  {
    key: 'message-container',
    title: 'MessageContainer 命令式消息',
    code: `
  <MessageContainer />
  <div class="flex flex-wrap items-center gap-3">
    <Button @click="notify('success')">成功</Button>
    <Button @click="notify('error')">失败</Button>
    <Button @click="notify('loading')">加载中</Button>
  </div>
`,
    scope: () => ({
      notify: (type: 'success' | 'error' | 'loading') => {
        if (type === 'success') message.success('操作成功');
        else if (type === 'error') message.error('操作失败，请重试');
        else {
          const id = message.loading('处理中…');
          setTimeout(() => message.remove(id), 1500);
        }
      },
    }),
  },
  {
    key: 'alert',
    title: 'Alert 警告提示',
    code: `
  <div class="flex max-w-xl flex-col gap-3">
    <Alert type="info" title="提示" message="系统将于今晚例行维护。" show-icon />
    <Alert type="success" title="成功" message="数据已同步完成。" show-icon closable />
    <Alert type="warning" title="注意" message="剩余存储空间不足 10%。" show-icon />
    <Alert type="danger" title="错误" message="提交失败：网络连接超时。" show-icon />
  </div>
`,
  },
  {
    key: 'notification',
    title: 'Notification 通知',
    code: `
  <div class="max-w-sm">
    <Notification v-model:visible="visible" title="新版本发布" type="info">
      v2.0 已上线，点击查看更新日志。
    </Notification>
    <Button size="sm" @click="visible = true">再次显示</Button>
  </div>
`,
    scope: () => ({ visible: ref(true) }),
  },
  {
    key: 'notification-container',
    title: 'NotificationContainer 命令式通知',
    code: `
  <NotificationContainer />
  <div class="flex flex-wrap items-center gap-3">
    <Button @click="push('info')">信息</Button>
    <Button @click="push('warning')">警告</Button>
  </div>
`,
    scope: () => ({
      push: (type: 'info' | 'warning') => {
        notification[type](
          type === 'info' ? '系统通知' : '风险提醒',
          '这是一条来自命令式 API 的通知。',
        );
      },
    }),
  },
  {
    key: 'loading',
    title: 'Loading 加载',
    code: `
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-6">
      <Loading size="sm" />
      <Loading />
      <Loading size="lg" text="加载中" />
    </div>
    <Button @click="showFull">全屏加载 1.5s</Button>
    <Loading fullscreen />
  </div>
`,
    scope: () => ({
      showFull: async () => {
        const { useLoadingService } = await import('@cumquat/composables');
        const stop = useLoadingService().start();
        setTimeout(stop, 1500);
      },
    }),
  },
  {
    key: 'skeleton',
    title: 'Skeleton 骨架屏',
    code: `
  <div class="max-w-md">
    <Skeleton avatar :rows="3" />
  </div>
`,
  },
  {
    key: 'result',
    title: 'Result 结果页',
    code: `
  <div class="max-w-md">
    <Result status="success" title="提交成功" sub-title="我们将在 1-3 个工作日内完成审核。" />
  </div>
`,
  },
  {
    key: 'upload',
    title: 'Upload 上传',
    code: `
  <div class="max-w-md">
    <Upload v-model:file-list="files" accept="image/*" :max-count="3" :action="upload" />
    <p class="mt-2 text-sm text-cumquat-text-muted">已选择 {{ files.length }} 个文件</p>
  </div>
`,
    scope: () => ({
      files: ref([]),
      upload: async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
      },
    }),
  },
];
