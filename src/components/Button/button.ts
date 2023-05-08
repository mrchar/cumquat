import {ref} from "vue"

export function useButton(callback: (...arg: any) => Promise<any>) {
    const loading = ref(false)

    async function onClick() {
        if (callback) {
            loading.value = true
            await callback()
            loading.value = false
        }
    }

    return {
        loading,
        onClick,
    }
}