<template>
    <button class="px-4 py-2 border-2 rounded-lg" @click.stop="onClick()">
        <div v-show="loading">Loading</div>
        <div v-show="!loading">
            <slot/>
        </div>
    </button>
</template>

<script lang="ts" setup>
import {ref} from "vue"

const props = defineProps(["onClick"])

const loading = ref(false)

async function onClick() {
    if (props.onClick) {
        loading.value = true
        await props.onClick()
        loading.value = false
    }
}
</script>