import { ref, watch } from "vue";


export function useModel<T>(getter: () => T,emitter: (val: T) => void) {
    const state = ref(getter()) as {value: T} 

    watch(getter,val=>{
        if(val !== state.value){
            state.value = val
        }
    })

    return {
        get value(){
            return state.value
        },
        set value(val: T){
            if(state.value !==val){
                state.value =val
                emitter(val)
            }
        } 
    }
}