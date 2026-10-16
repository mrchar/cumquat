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
  <div class="cumquat-mention">
    <input
      v-model="model"
      type="text"
      :placeholder="placeholder"
      class="cumquat-mention__input"
      @input="onInput"
    />
    <Transition name="cumquat-fade">
      <ul v-if="open && suggestions.length > 0" class="cumquat-mention__dropdown">
        <li
          v-for="member in suggestions"
          :key="member"
          class="cumquat-mention__option"
          @mousedown.prevent="pick(member)"
        >
          <span class="cumquat-mention__at">@</span>{{ member }}
        </li>
      </ul>
    </Transition>
  </div>
</template>
