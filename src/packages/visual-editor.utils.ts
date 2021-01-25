

export interface VisualEditorBlockData{
    componentKey: string;       // 映射 VisualEditorConfig 中componentMap 的 component对象
    top: number;                //组件top定位
    left: number;               //组件left定位
    adjustPosition: boolean;    // 是否需要调整位置
    focus: boolean;             //是否为选中状态
}

export function createNewBlock(e: DragEvent, component: VisualEditorComponent): VisualEditorBlockData {
  return{
    componentKey: component.key,
    top: e.offsetY,
    left: e.offsetX,
    adjustPosition: true,
    focus: false,
  }
}

export interface VisualEditorModelValue{
    container: {
        width: number;
        height: number;
    },
    blocks: VisualEditorBlockData[],
}

export interface VisualEditorComponent {
    key: string,
    label: string,
    preview: () => JSX.Element,
    render: () => JSX.Element
}

export function createVisualEditorConfig() {
    const componentList: VisualEditorComponent[] = []
    const componentMap: Record<string, VisualEditorComponent> = {}
    return {
        componentList,
        componentMap,
        registry: (key: string,component: Omit<VisualEditorComponent, 'key'>) => {
            let comp = {...component, key}
            componentList.push(comp)
            componentMap[key] = comp
        }
    }
}

export type VisualEditorConfig = ReturnType<typeof createVisualEditorConfig>
