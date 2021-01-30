import { computed, createApp, defineComponent, getCurrentInstance, inject, onBeforeUnmount, onMounted, PropType, provide, reactive, ref } from "vue";
import { defer } from "./defer";
import './dropdown-service.scss'

interface DropdownServiceOption {
    reference: MouseEvent | HTMLElement,
    content: () => JSX.Element,

}

const DropdownServiceProviceOption = (() => {
    const DROPDOWN_SERVICE_PROVIDER = '@@DROPDOWN_SERVICE_PROVIDER'
    return {
        provide: (handler: {onClick: () => void}) => {
            provide(DROPDOWN_SERVICE_PROVIDER, handler)
        },
        inject: () => {
            return inject(DROPDOWN_SERVICE_PROVIDER) as {onClick: () => void}
        }
    }
})()

const ServiceComponent = defineComponent({
    props:{
        option: {
            type: Object as PropType<DropdownServiceOption>,
            require: true
        }
    },
    setup(props){
        const el = ref({} as HTMLDivElement)
        const ctx = getCurrentInstance()!
        const state = reactive({
            option: props.option,
            showFlag: false,
            top: 0,
            left: 0,
            mounted: (() => {
                const dfd = defer()
                onMounted(() => {
                    setTimeout(() => dfd.resolve(), 0)
                })
                return dfd.promise
            })()
        })

        const methods = {
            show: async () => {
                await state.mounted
                state.showFlag = true
            },
            hide: () => {
                state.showFlag = false
            }
        }

        const service = (option: DropdownServiceOption) => {
            state.option = option
            

            if('addEventListener' in option.reference) {
                const {top, left, height} = option.reference.getBoundingClientRect()!
                state.top = top
                state.left = left
            } else {
                const {clientX, clientY} = option.reference
                state.left = clientX
                state.top = clientY
            }

            methods.show()
        }

        const classes = computed(() => [
            'dropdown-service',
            {
                'dropdown-service-show': state.showFlag
            }
        ])

        const styles = computed(() => ({
            top: `${state.top}px`,
            left: `${state.left}px`
        }))

        Object.assign(ctx.proxy, {service})

        const onMousedownDocument = (e: MouseEvent) => {
            if(!(el.value).contains(e.target as HTMLDivElement)){
                methods.hide()
            }
        }

        onMounted(() => document.body.addEventListener('mousedown', onMousedownDocument, true))
        onBeforeUnmount(() => document.body.removeEventListener('mousedown', onMousedownDocument, true))
        DropdownServiceProviceOption.provide({
            onClick:methods.hide
        })
        return () => (
            <div class={classes.value} style={styles.value} ref={el}>
                {state.option?.content()}
            </div>
        )
    }
})

export const DropdownOption = defineComponent({
    props:{
        label: {type: String},
        icon: {type: String}
    },
    setup(props, ctx){
        const {onClick: dropdownClickHandler} = DropdownServiceProviceOption.inject()
        const handler = {
            onClick: (e: MouseEvent) => {
                ctx.emit('click', e)
                dropdownClickHandler()
            }
        }
        return () => (
            <div class='dropdown-option' onClick={handler.onClick}>
                <i class={`iconfont ${props.icon}`}></i>
                <span>{props.label}</span>
            </div>
        )
    }
})

export const $$dropdown = (() => {
    let ins: any;
    return (option: DropdownServiceOption) => {
        if(!ins){
            let el = document.createElement('div')
            document.body.appendChild(el)
            const app = createApp(ServiceComponent, {option})
            // app.component('dropdown-option',DropdownOption)
            ins = app.mount(el)
        }
        ins.service(option)
    }
})()