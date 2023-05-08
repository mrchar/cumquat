<template>
    <div class="w-screen h-screen flex gap-4">
        <div class="p-4 border">
            <router-link to="/button">Button</router-link>
        </div>
        <div class="p-4">
            <router-view/>
        </div>
    </div>
</template>