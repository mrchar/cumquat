<script setup lang="ts">
import { ref } from 'vue';
import { Button, CodeCard, QRCode, Tour, Watermark } from '@cumquat/components';

const tourOpen = ref(false);

const tourSteps = [
  { key: '1', title: '第一步', content: '这里是引导说明的第一步。' },
  { key: '2', title: '第二步', content: '这是引导说明的最后一步。' },
];

const watermarkCode = `
  <Watermark content="机密文件">
    <div
      class="flex h-40 items-center justify-center rounded bg-cumquat-surface-2 text-cumquat-text-muted"
    >
      被水印覆盖的内容区域
    </div>
  </Watermark>
`;

const tourCode = `
  <Button type="primary" @click="tourOpen = true">开始引导</Button>
  <Tour v-model:open="tourOpen" :steps="tourSteps" />
`;

const qrCode = `
  <QRCode value="https://cumquat.dev" />
`;
</script>

<template>
  <div class="flex flex-col gap-10">
    <section id="watermark" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Watermark 水印</h2>
      <CodeCard title="文字水印" :code="watermarkCode">
        <div>
          <Watermark content="机密文件">
            <div
              class="flex h-40 items-center justify-center rounded bg-cumquat-surface-2 text-cumquat-text-muted"
            >
              被水印覆盖的内容区域
            </div>
          </Watermark>
        </div>
      </CodeCard>
    </section>

    <section id="tour" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Tour 漫游引导</h2>
      <CodeCard title="分步引导" :code="tourCode">
        <div>
          <Button type="primary" @click="tourOpen = true">开始引导</Button>
          <Tour v-model:open="tourOpen" :steps="tourSteps" />
        </div>
      </CodeCard>
    </section>

    <section id="qrcode" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">QRCode 二维码</h2>
      <CodeCard title="二维码" :code="qrCode">
        <div>
          <QRCode value="https://cumquat.dev" />
        </div>
      </CodeCard>
    </section>
  </div>
</template>
