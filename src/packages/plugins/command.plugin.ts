import { onUnmounted, reactive } from "vue"

export interface CommandExecute {
  undo?: () => void;
  redo: () => void
}

export interface Command{
  name: string;                                       //命令唯一标识
  keyboard?: string | string[];                       //命令监听的快捷键
  execute: (...args: any[]) => CommandExecute;         //命令被执行的时候，所做的内容
  followQueue?: boolean;                               //命令执行完毕之后，是否需要将命令的undo和redo存入命令队列
  init?: () => ((() => void) | undefined);            //命令初始化函数
  data?: any;                                         //命令缓存所需要的数据
}

export function useCommander() {
  const state = reactive({
    current:-1,                                         //队列中的当前命令
    queue:[] as CommandExecute[],                       //命令队列
    commandArray: [] as Command[],                      //命令对象数组
    commands: {} as Record<string, (...args: any[]) => void>, //命令对象,方便通过命令的名称调用命令的execute函数，并且执行额外的命令队列的逻辑
    destroyList: [] as ((() => void) | undefined)[],            // 组件销毁的时候，需要调用的销毁逻辑数组
  })

  const registry = (command: Command) => {
    // console.log(command)
    state.commandArray.push(command)
    state.commands[command.name] = (...args)=>{
      const {undo, redo} =  command.execute(...args)
      redo()
      /*如果命令执行之后，不需要进入命令队列，则直接结束*/
      if (command.followQueue === false) {
          return
      }
      /*否则，将命令队列中剩余的命令去除，保留current及其之前的命令*/
      let {queue, current} = state
      if (queue.length > 0) {
          queue = queue.slice(0, current + 1)
          console.log('queue',queue)
          state.queue = queue
      }
      /*设置命令队列中最后一个命令为当前执行的命令*/
      queue.push({undo, redo})
      /*索引+1，指向队列中的最后一个命令*/
      state.current = current + 1;
    }
  }
//useCommander初始化函数，负责初始化键盘监听事件，调用命令的初始化逻辑
  const init = () => {
    const onKeydown = (e: KeyboardEvent) => {
      console.log('监听到键盘事件')
    }
    window.addEventListener('keydown', onKeydown)
    state.commandArray.forEach(command => !!command.init && state.destroyList.push(command.init()))
    state.destroyList.push(() => window.removeEventListener('keydown', onKeydown))
  }

  // const destroy = () => {}
// 撤销命令
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

  //重做命令
  registry({
    name: 'redo',
    keyboard: [
      'ctrl+y',
      'ctrl+shift+z'
    ],
    followQueue:false,
    execute: () => {
      console.log('重做')
      return {
        redo: () => {
          let {current} = state

          if(!state.queue[current + 1]) return
          console.log('state',state.queue[current + 1])
          const {redo} = state.queue[current+1]
          console.log('redo',redo.toString())
          redo()
          state.current += 1
        }
      }
    }
  })

  onUnmounted(() => state.destroyList.forEach(fn => !!fn && fn()))
  return {
    state,
    registry,
    init,
  }
}

