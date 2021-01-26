import { useCommander } from "../plugins/command.plugin";
import { VisualEditorBlockData, VisualEditorModelValue } from "../visual-editor.utils";

export function useVisualCommand(
  {
    focusData,
    updateBlocks,
    dataModel
  }: {
    focusData: {
      value: {focus: VisualEditorBlockData[],unFocus: VisualEditorBlockData[]}
    },
    updateBlocks: (blocks: VisualEditorBlockData[]) => void,
    dataModel: { 
      value: VisualEditorModelValue | undefined
    }
  }
) {
  const commander = useCommander()

  commander.registry({
    name: 'delete',
    keyboard: [
      'backspace',
      'delete',
      'ctrl+d'
    ],
    execute: () => {
      let data = {
        before: dataModel.value!.blocks || [],
        after: focusData.value.unFocus
      }
      return {
        undo: () => {
          console.log('撤回删除命令')
          updateBlocks(data.before)
        },
        redo: () => {
          console.log('重做删除命令')
          updateBlocks(data.after)
        }
      }
    }
  })
  return {
    undo: commander.state.commands.undo,
    redo: commander.state.commands.redo,
    delete: commander.state.commands.delete,
  }
}
