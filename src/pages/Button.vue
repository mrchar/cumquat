<template>
    <Button @click="onClick()">按钮</Button>
</template>
<script lang="ts" setup>
import Button from "../components/Button/Button.vue"

async function onClick() {
    return new Promise(resolve => {
        setTimeout(resolve, 1000)
    })
}
</script>