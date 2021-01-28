import { defineComponent, mergeProps, PropType, reactive } from "vue"
import { defer } from "./defer"

enum DialogServiceEditType {
    textarea = 'textarea',
    input = 'input'
}

interface DialogServiceOption {
    editType: DialogServiceEditType,
    editReadonly?: boolean,
    editValue?: string | null,
    onConfirm: (val?: string | null) => void
}
const ServiceComponent = defineComponent({
    props:{
        option:{
            type: Object as PropType<DialogServiceOption>,
            required: true
        }
    },
    setup(props){
        const state = reactive({
            option: props.option,
            showFlag: false
        })
        return () => (
            <el-dialog
                v-model={state.showFlag}
                >
                    {{
                        default: () => (<div>
                            {state.option.editType === DialogServiceEditType.textarea ? (
                                <el-input type='textarea' rows={10}></el-input>
                            ): (
                                <el-input></el-input>
                            )}
                        </div>),
                        footer: () => (
                            <div>
                                <el-button>取消</el-button>
                                <el-button>确认</el-button>
                            </div>
                        )
                    }}
            </el-dialog>
        )
    }
})

const DialogService = (option: DialogServiceOption) => {

}

export const $$dialog = Object.assign(DialogService, {
    input: (initValue?: string, option?: DialogServiceOption) => {
        const dfd = defer<string | null | undefined >()
        const opt: DialogServiceOption = option || {editType: DialogServiceEditType.input, onConfirm: dfd.resolve}
        DialogService(opt)
        return dfd.promise
    }, 
    textarea:(initValue?: string, option?: DialogServiceOption) => {
        const dfd = defer<string | null | undefined >()
        const opt: DialogServiceOption = option || {editType: DialogServiceEditType.textarea, onConfirm: dfd.resolve}
        DialogService(opt)
        return dfd.promise
    }
})