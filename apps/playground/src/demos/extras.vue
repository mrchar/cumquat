<script setup lang="ts">
import { ref } from 'vue';
import { Button, QRCode, Tour, Watermark } from '@cumquat/components';

const tourOpen = ref(false);

const tourSteps = [
  { key: '1', title: '第一步', content: '这里是引导说明的第一步。' },
  { key: '2', title: '第二步', content: '这是引导说明的最后一步。' },
];
</script>

<template>
  <div class="flex flex-col gap-10">
    <section id="watermark" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Watermark 水印</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Watermark content="机密文件">
          <div
            class="flex h-40 items-center justify-center rounded bg-cumquat-surface-2 text-cumquat-text-muted"
          >
            被水印覆盖的内容区域
          </div>
        </Watermark>
      </div>
    </section>

    <section id="tour" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Tour 漫游引导</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Button type="primary" @click="tourOpen = true">开始引导</Button>
        <Tour v-model:open="tourOpen" :steps="tourSteps" />
      </div>
    </section>

    <section id="qrcode" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">QRCode 二维码</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <QRCode value="https://cumquat.dev" />
      </div>
    </section>
  </div>
</template>
