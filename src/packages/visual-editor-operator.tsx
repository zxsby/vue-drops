import { ElButton, ElColorPicker, ElForm, ElFormItem, ElInput, ElInputNumber, ElOption, ElSelect } from 'element-plus'
import {PropType, defineComponent, reactive, watch} from 'vue'
import { VisualEditorBlockData, VisualEditorConfig, VisualEditorModelValue } from './visual-editor.utils'
import { VisualEditorProps, VisualEditorPropsType } from './utils/visual-editor-props'

import deepcopy from 'deepcopy'

export const VisualOperatorEditor = defineComponent({
  props: {
    block: {
      type: Object as PropType<VisualEditorBlockData | null>,
    },
    config: {
      type: Object as PropType<VisualEditorConfig>,
      required: true
    },
    dataModel: {
      type: Object as  PropType<{ value: VisualEditorModelValue | undefined}>,
      required: true
    },
    updateBlock: {
      type: Function as PropType<((newBlock: VisualEditorBlockData,oldBlock: VisualEditorBlockData) => void)>,
      required: true
    },
    updateModelValue: {
      type: Function as PropType<((val: VisualEditorModelValue) => void)>,
      required: true
    }
  },
  setup(props) {
    const state = reactive({
      editData: '' as any
    })
    const methods = {
      apply: () => {
        console.log(1)
        if(!props.block){
          //当前是编辑容器属性
          props.updateModelValue({
            ...props.dataModel.value!,
            container: state.editData
          })
        }else{
          //当前编辑block数据的属性
          props.updateBlock({
            ...props.block,
            props: state.editData
          }, props.block)
        }

      },
      reset: () => {
        if(!props.block) {
          state.editData = deepcopy(props.dataModel.value!.container)
        }else{
          state.editData = deepcopy(props.block.props || {})
        }
      }
    }
    watch(() => props.block, () => {
      methods.reset()
    },{immediate: true})

    const renderEditor = (propName: string, propsConfig: VisualEditorProps) => {
      return {
        [VisualEditorPropsType.input]: () => (<ElInput v-model={state.editData[propName]}/>),
        [VisualEditorPropsType.color]: () => (<ElColorPicker v-model={state.editData[propName]}/>),
        [VisualEditorPropsType.select]: () => (<ElSelect v-model={state.editData[propName]}>
          {propsConfig.options!.map(opt => (
            <ElOption label={opt.label} value ={opt.val}/>
          ))}
        </ElSelect>),
      }[propsConfig.type]()
    }

    return () => {
      let content: JSX.Element
      if (!props.block) {
        content = <>
          <ElFormItem label='容器宽度'>
            <ElInputNumber v-model={state.editData.width}/>
          </ElFormItem>
          <ElFormItem label='容器高度'>
            <ElInputNumber v-model={state.editData.height}/>
          </ElFormItem>
        </>
      } else {
        const {componentKey} = props.block
        const component = props.config!.componentMap[componentKey]
        if(!!component && !!component.props) {
          content = <>
            {Object.entries(component.props).map(([propName, propsConfig]) => {
                return <ElFormItem label={propsConfig.label}>
                  {
                    renderEditor(propName, propsConfig)
                  }
                </ElFormItem>
            })}
          </>
        }else{
          content = <></>
        }
      }
     return (
      <div class='visual-editor-operator'>
        <ElForm labelPosition='top'>
          {content}
          <ElFormItem>
            <ElButton type='primary' {...{onClick: methods.apply} as any}>应用</ElButton>
            <ElButton {...{onClick: methods.reset} as any}>重置</ElButton>
          </ElFormItem>
        </ElForm>
      </div>
     )
    }
  }
})
