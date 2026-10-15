<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    /** @ 候选成员 */
    members?: string[];
    placeholder?: string;
  }>(),
  { members: () => ['Amber', 'Bolt', 'Cedar', 'Dawn'], placeholder: '输入 @ 唤起提及' },
);

const model = defineModel<string>({ default: '' });

const open = ref(false);
const query = ref('');

/** 正在输入 @ 之后的片段 */
const suggestions = computed(() =>
  props.members.filter((m) => m.toLowerCase().includes(query.value.toLowerCase())),
);

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  const at = value.lastIndexOf('@');
  if (at >= 0) {
    query.value = value.slice(at + 1);
    open.value = true;
  } else {
    open.value = false;
    query.value = '';
  }
}

function pick(member: string) {
  const at = model.value.lastIndexOf('@');
  model.value = at >= 0 ? `${model.value.slice(0, at + 1)}${member} ` : `${member} `;
  open.value = false;
  query.value = '';
}
</script>

<template>
  <div class="cumquat-mention relative inline-block w-full">
    <input
      v-model="model"
      type="text"
      :placeholder="placeholder"
      class="cumquat-mention__input h-10 w-full rounded-cumquat border border-cumquat-border bg-cumquat-surface px-3 text-sm text-cumquat-text transition-colors placeholder:text-cumquat-text-muted focus:border-cumquat-accent focus:outline-none focus:ring-2 focus:ring-cumquat-accent/20"
      @input="onInput"
    />
    <Transition name="cumquat-fade">
      <ul
        v-if="open && suggestions.length > 0"
        class="cumquat-mention__dropdown absolute z-20 mt-1.5 max-h-44 w-full overflow-auto rounded-cumquat border border-cumquat-border bg-cumquat-surface py-1 shadow-cumquat-overlay"
      >
        <li
          v-for="member in suggestions"
          :key="member"
          class="cumquat-mention__option cursor-pointer px-3 py-2 text-sm text-cumquat-text transition-colors hover:bg-cumquat-surface-2"
          @mousedown.prevent="pick(member)"
        >
          <span class="font-medium text-cumquat-accent">@</span>{{ member }}
        </li>
      </ul>
    </Transition>
  </div>
</template>
