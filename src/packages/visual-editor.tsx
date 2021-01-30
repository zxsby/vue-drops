import './visual-editor.scss'

import { PropType, computed, defineComponent, ref, reactive } from "vue";
import { VisualEditorBlockData, VisualEditorComponent, VisualEditorConfig, VisualEditorModelValue, createNewBlock, VisualEditorMarkLines } from "./visual-editor.utils";

import { VisualEditorBlock } from "./visual-editor-block";
import { createEvent } from "@/packages/plugins/event";
import { useModel } from "./utils/useModel";
import { useVisualCommand } from './utils/visual.command';
import { $$dialog } from './utils/dialog-service';
import { ElMessageBox } from 'element-plus';
import { $$dropdown, DropdownOption } from './utils/dropdown-service';

export const VisualEditor = defineComponent({
  props: {
    modelValue: {
      type: Object as PropType<VisualEditorModelValue>,
      require: true
    },
    config: {
      type: Object as PropType<VisualEditorConfig>,
      require: true
    }
  },
  emits: {
    'update:modelValue': (val?: VisualEditorModelValue) => true
  },
  setup(props, ctx) {
    //双向绑定容器中的组件数据
    const dataModel = useModel(() => props.modelValue, val => ctx.emit('update:modelValue', val))
    // console.log(dataModel)
    //containerRef节点dom对象的引用
    const containerRef = ref({} as HTMLDivElement)
    //containerRef节点的style样式对象
    const containerStyles = computed(() => ({
      width: `${dataModel.value?.container.width}px`,
      height: `${dataModel.value?.container.height}px`
    }))
    //计算选中与未选中的block数据
    const focusData = computed(() => {
      let focus: VisualEditorBlockData[] = [];
      let unFocus: VisualEditorBlockData[] = [];
      (dataModel.value?.blocks || []).forEach(block => (block.focus ? focus : unFocus).push(block))
      return {
        focus,     //此时选中的数据
        unFocus,   //此时未选中的数据
      }
    })

    const state = reactive({
      selectBlock: null as null |  VisualEditorBlockData
    })

    const dragstart = createEvent()
    const dragend = createEvent()
    // dragstart.on(() => console.log('dragstart'))
    // dragend.on(() => console.log('dragend'))

    //对外暴露的一些方法
    const methods = {
      //清空所有选中的block
      clearFocus: (block?: VisualEditorBlockData) => {
        let blocks = (dataModel.value!.blocks || []);
        if (blocks.length === 0) return
        if (!!block) {
          blocks = blocks.filter(item => item !== block)
        }
        blocks.forEach(block => block.focus = false)
      },
      updateBlocks: (blocks: VisualEditorBlockData[]) => {
        dataModel.value = {
          ...dataModel.value!,
          blocks
        }
      },
      showBlockData: (block: VisualEditorBlockData) => {
        $$dialog.textarea(JSON.stringify(block), '节点数据', {editReadonly: true})
      },
      importBlockData:async (block: VisualEditorBlockData) => {
        const text = await $$dialog.textarea('', '请输入')
        try {
          const data = JSON.parse(text || '')
          commander.updateBlock(data, block)
          dataModel.value = data
        } catch (e) {
          console.error(e)
          ElMessageBox.alert('解析json字符串出错')
        }
      }
    }
    // 处理从菜单拖拽组件到容器的相关动作处理
    const menuDraggier = (() => {
      let component = null as null | VisualEditorComponent
      const blockHandler = {
        //处理菜单组件开始动作
        dragstart: (e: DragEvent, current: VisualEditorComponent) => {
          containerRef.value.addEventListener('dragenter', containerHandler.dragenter)
          containerRef.value.addEventListener('dragover', containerHandler.dragover)
          containerRef.value.addEventListener('dragleave', containerHandler.dragleave)
          containerRef.value.addEventListener('drop', containerHandler.drop)
          component = current
          dragstart.emit()
        },
        //处理菜单组件结束动作
        dragend: (e: DragEvent) => {
          containerRef.value.removeEventListener('dragenter', containerHandler.dragenter)
          containerRef.value.removeEventListener('dragover', containerHandler.dragover)
          containerRef.value.removeEventListener('dragleave', containerHandler.dragleave)
          containerRef.value.removeEventListener('drop', containerHandler.drop)
          component = null
        },
      }
      const containerHandler = {
        //拖拽菜单组件进入容器的时候，设置鼠标可放置状态
        dragenter: (e: DragEvent) => { e.dataTransfer!.dropEffect = 'move' },
        //拖拽菜单组件，鼠标在容器中移动的时候，禁用默认事件
        dragover: (e: DragEvent) => { e.preventDefault() },
        //如果拖拽过程重，鼠标离开了容器，设置鼠标为补课放置的状态
        dragleave: (e: DragEvent) => { e.dataTransfer!.dropEffect = 'none' },
        //在容器中放置的时候，获取事件对象的offsetX,和offsetY添加一条组件数据
        drop: (e: DragEvent) => {
          const blocks = dataModel.value?.blocks || []
          blocks.push(createNewBlock(e, component!))
          methods.updateBlocks(blocks)
          dragend.emit()
        },
      }
      return blockHandler
    })()
    //处理block在container中拖拽移动的相关动作
    const blockDraggier = (() => {
      const mark = reactive({
          x: null as null | number,
          y: null as null | number
      })
      let dragState = {
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
        startPos: [] as { left: number, top: number }[],
        dragging: false,
        markLines: {} as VisualEditorMarkLines
      }
      const mousedown = (e: MouseEvent) => {
        dragState = {
          startX: e.clientX,
          startY: e.clientY,
          startLeft: state.selectBlock!.left,
          startTop: state.selectBlock!.top,
          startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
          dragging: false,
          markLines: (() => {
            const {focus, unFocus} = focusData.value
            const {top, left, width ,height} = state.selectBlock!
            let lines: VisualEditorMarkLines = {
              x: [],
              y: []
            }
            unFocus.forEach(block => {
              const {top: t, left: l, width: w, height: h} = block;
              lines.y.push({top: t, showTop: t})                              //顶部对其顶部
              lines.y.push({top: t + h, showTop: t + h})                      //顶部对其底部
              lines.y.push({top: t + h / 2 - height / 2, showTop: t + h / 2})  //中间对其中间（垂直）
              lines.y.push({top: t - height, showTop: t})                     //底部对其顶部
              lines.y.push({top: t + h - height, showTop: t + h})             //底部对其底部

              // todo 还需要计算x的表现位置
              lines.x.push({left: l, showLeft: l})                              //头部对其头部
              lines.x.push({left: l + w, showLeft: l + w})                      //头部对其尾部
              lines.x.push({left: l + w / 2 - width / 2, showLeft: l + w / 2})  //中间对其中间（垂直）
              lines.x.push({left: l - width, showLeft: l})                     //尾部对其头部
              lines.x.push({left: l + w - width, showLeft: l + w})             //尾部对其尾部
            })
            return lines
          })()
        }
        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup)
      }
      const mousemove = (e: MouseEvent) => {
        
        if (!dragState.dragging) {
          dragstart.emit()
          dragState.dragging = true
        }
        let {clientX: moveX, clientY: moveY} = e
        const {startX, startY} = dragState
        if (e.shiftKey) {
          if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) {
            moveX = startX
          } else {
            moveY = startY
          }
        }
        const currentLeft = dragState.startLeft + moveX - startX
        const currentTop = dragState.startTop + moveY - startY
        const currentMark = {
          x: null as null | number,
          y: null as null | number
        }

        for(let i =0; i < dragState.markLines.y.length; i++){
          const {top, showTop} = dragState.markLines.y[i];
          if(Math.abs(top - currentTop) < 5){
            moveY = top + startY -dragState.startTop
            currentMark.y = showTop
          }
        }
        for(let i =0; i < dragState.markLines.x.length; i++){
          const {left, showLeft} = dragState.markLines.x[i];
          if(Math.abs(left - currentLeft) < 5){
            moveX = left + startX -dragState.startLeft
            currentMark.x = showLeft
          }
        }
        
        mark.x = currentMark.x
        mark.y = currentMark.y
        
        let durY = moveY - startY
        let durX = moveX - startX
        
        focusData.value.focus.forEach((block, index) => {
          block.top = dragState.startPos[index].top + durY
          block.left = dragState.startPos[index].left + durX
        })
      }
      const mouseup = (e: MouseEvent) => {
        document.removeEventListener('mousemove', mousemove)
        document.removeEventListener('mouseup', mouseup)
        mark.x = null
        mark.y = null
        if (dragState.dragging) {
          dragend.emit()
        }
      }
      return {
        mark,
        mousedown
      }
    })()
    // 处理blick选中的相关动作
    const focusHandler = (() => {
      return {
        container: {
          onMousedown: (e: MouseEvent) => {
            e.preventDefault();
            methods.clearFocus()
            state.selectBlock = null
          }
        },
        block: {
          onMousedown: (e: MouseEvent, block: VisualEditorBlockData) => {
            e.preventDefault()
            e.stopPropagation()
            if (e.shiftKey) {//shift键
              // 如果按住了shiift建，如果此时没有选中的block，就选中这个block，否则将这个block的状态取反
              if (focusData.value.focus.length <= 1) {
                block.focus = true
              } else {
                block.focus = !block.focus
              }
            } else {
              //如果这个block没有被选中，才晴空处这个之外其他选中的block，否则不做任何事情
              if (!block.focus) {//防止拖拽多个也会取消其它选中问题
                block.focus = true
                methods.clearFocus(block)
              }
            }
            state.selectBlock = block
            blockDraggier.mousedown(e)
          }
        }
      }
    })()

    //其它的一些事件
    const handler = {
      onContextmenuBlock: (e: MouseEvent, block: VisualEditorBlockData) => {
        console.log(111111)
        e.preventDefault()
        $$dropdown({
          reference: e,
          content: () =>(
            <div>
              <DropdownOption label="置顶节点" icon="icon-place-top" {...{onClick: commander.placeTop}}/>
              <DropdownOption label="置底节点" icon="icon-place-bottom" {...{onClick: commander.placeBottom}}/>
              <DropdownOption label="删除节点" icon="icon-delete" {...{onClick: commander.delete}}/>
              <DropdownOption label="查看数据" icon="icon-browse" {...{onClick: () => methods.showBlockData(block)}}/>
              <DropdownOption label="导入节点" icon="icon-import" {...{onClick: () => methods.importBlockData(block)}}/>
            </div>
          )
        })
      }
    }

    const commander = useVisualCommand({ focusData, updateBlocks: methods.updateBlocks, dataModel, dragstart, dragend })
    //按钮数据
    const buttons = [
      { label: '撤销', icon: 'icon-back', handler: commander.undo, tip: 'ctrl+z' },
      { label: '重做', icon: 'icon-forward', handler: commander.redo, tip: 'ctrl+y,ctrl+shift+z' },
      {
        label: '导入', icon: 'icon-import', handler: async () => {
          const text = await $$dialog.textarea('', '请输入倒入的JSON字符串')
          try {
            const data = JSON.parse(text || '')
            dataModel.value = data
          } catch (e) {
            console.error(e)
            ElMessageBox.alert('解析json字符串出错')
          }
        }
      },
      {
        label: '导出',
        icon: 'icon-export',
        handler: () => $$dialog.textarea(JSON.stringify(dataModel.value), '导出的JSON数据', { editReadonly: true })
      },
      { label: '置顶', icon: 'icon-place-top', handler: () => commander.placeTop(), tip: 'ctrl+up' },
      { label: '置底', icon: 'icon-place-bottom', handler: () => commander.placeBottom(), tip: 'ctrl+down' },
      { label: '删除', icon: 'icon-delete', handler: () => commander.delete(), tip: 'ctrl+d,backspace,delete' },
      { label: '清空', icon: 'icon-reset', handler: () => commander.clear() },

    ]
    return () => (
      <div class='visual-editor'>
        <div class='visual-editor-menu'>
          {
            props.config?.componentList.map(component => (
              <div class='visual-editor-menu-item'
                draggable
                onDragend={menuDraggier.dragend}
                onDragstart={(e) => { menuDraggier.dragstart(e, component) }}>
                <span class='visual-editor-menu--item-label'>{component.label}</span>
                <div class='visual-editor-menu-item-content'>
                  {component.preview()}
                </div>
              </div>
            ))
          }
        </div>
        <div class='visual-editor-head'>
          {buttons.map((btn, index) => {
            const content = (<div onClick={btn.handler} class='visual-editor-head-button' key={index}>
              <i class={`iconfont ${btn.icon}`}></i>
              <span>{btn.label}</span>
            </div>)
            return !btn.tip ? content : <el-tooltip effect='dark' content={btn.tip} placement='bottom'>
              {content}
            </el-tooltip>
          })}
        </div>
        <div class='visual-editor-operator'>
          operator
        </div>
        <div class='visual-editor-body'>
          <div class='visual-editor-content'>
            <div
              ref={containerRef}
              class='visual-editor-container'
              style={containerStyles.value}
              {...focusHandler.container}
            >
              {
                (dataModel.value?.blocks || []).map((block, index) => {
                  return <VisualEditorBlock
                    config={props.config}
                    block={block}
                    key={index}
                    {
                    ...{
                      onContextmenu: (e: MouseEvent) => handler.onContextmenuBlock(e, block),
                      onMousedown: (e: MouseEvent) => focusHandler.block.onMousedown(e, block)
                    }
                    }
                  />
                })
              }
              {blockDraggier.mark.y !== null && (<div class='visual-editor-mark-line-y' style={{top:`${blockDraggier.mark.y}px`}}></div>) }
              {blockDraggier.mark.x !== null && (<div class='visual-editor-mark-line-x' style={{left:`${blockDraggier.mark.x}px`}}></div>) }              
            </div>
          </div>
        </div>
      </div>
    )
  }
})
