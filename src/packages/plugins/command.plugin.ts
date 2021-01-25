import { reactive } from "vue"

export interface CommandExecute {
  undo?: () => void;
  redo: () => void
}

export interface Command{
  name: string;                                       //命令唯一标识
  keyboard?: string | string[];                       //命令监听的快捷键
  execute: (...args: any[]) => CommandExecute         //命令被执行的时候，所做的内容
  followQueue?: boolean                               //命令执行完毕之后，是否需要将命令的undo和redo存入命令队列
}

export function useCommander() {
  const state = reactive({
    current:1,
    queue:[] as CommandExecute[],
    commands: {} as Record<string, (...args: any[]) => void>
  })

  const registry = (command: Command) => {
    state.commands[command.name] = (...args)=>{
      const {undo, redo} =  command.execute(...args)
      if(command.followQueue) {
        state.queue.push({undo, redo})
        state.current += 1
      }
      redo()
    }
  }

  registry({
    name: 'undo',
    keyboard: 'ctrl+z',
    followQueue:false,
    execute:() =>{
      // 命令被执行的时候，要做的事情
      return {
        // undo: () => {
        //   // 将做的事情还原
        // },
        redo: () => {
          // 重新做一遍，要做的事情
          let {current} = state
          if (current === -1) return
          const {undo} = state.queue[current]
          !!undo && undo()
          state.current -= 1
        }
      }
    }
  })

  registry({
    name: 'redo',
    keyboard: [
      'ctrl+y',
      'ctrl+shift+z'
    ],
    followQueue:false,
    execute: () => {
      return {
        redo: () => {
          let {current} = state
          if(!state.queue[current]) return
          const {redo} = state.queue[current]
          redo()
          state.current += 1
        }
      }
    }
  })

  return {
    state,
    registry
  }
}
