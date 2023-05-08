<template>
    <button @click.stop="onClick()" :disabled="loading">
        <div v-if="loading">
            <Loading/>
        </div>
        <div v-else>
            <slot/>
        </div>
    </button>
</template>

<script lang="ts" setup>
import {ref} from "vue"
import Loading from "../Loading/Loading.vue"

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

<style scoped>
button {
    @apply w-20 h-12 px-4 py-2;
    @apply border-2 rounded-lg;
    @apply shadow-lg hover:shadow-none;
    @apply bg-blue-500 hover:bg-blue-400 text-white;
    @apply inline-flex justify-center items-center;
}
</style>