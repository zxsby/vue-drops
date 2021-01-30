import { PropType, computed, defineComponent, onMounted, ref } from "vue";
import { VisualEditorBlockData, VisualEditorConfig } from "./visual-editor.utils";

export const VisualEditorBlock = defineComponent({
    props:{
        block:{
          type: Object as PropType<VisualEditorBlockData>,
          require: true
        },
        config:{
          type: Object as PropType<VisualEditorConfig>,
          require: true
        }
    },
    setup(props) {
        const el = ref({} as HTMLDivElement)
        const styles = computed(()=>({
            top:`${props.block?.top}px`,
            left:`${props.block?.left}px`,
            zIndex: props.block?.zIndex,
        }))
        const classes = computed(() => [
          'visual-deitor-block',
          {
            'visual-deitor-block-focus':props.block?.focus
          }
        ])
        onMounted(()=>{
          // 第一次自动剧中显示
          const block = props.block!
          if(block.adjustPosition){
            const {offsetWidth, offsetHeight} = el.value
            block.top = block.top - offsetHeight / 2
            block.left = block.left - offsetWidth / 2
            block.adjustPosition = false
            block.width = offsetWidth
            block.height = offsetHeight
          }
        })
        return ()=>{
          const component = props.config!.componentMap[props.block!.componentKey]
          const Render = component.render()
          return (
            <div ref={el} class={classes.value} style={styles.value}>
                {Render}
            </div>
          )
        }
    }
})
