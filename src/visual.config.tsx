import {ElButton, ElInput} from 'element-plus'

import { createVisualEditorConfig } from "./packages/visual-editor.utils";

export const visualConfig = createVisualEditorConfig()

visualConfig.registry('text',{
    label: '文本',
    preview: () => '文本',
    render: () => '渲染',
})

visualConfig.registry('button',{
    label:'按钮',
    preview:() => <ElButton>按钮</ElButton>,
    render: () => <ElButton>渲染按钮</ElButton>,
})

visualConfig.registry('input',{
    label:'输入框',
    preview:() => <ElInput/>,
    render: () => <ElInput/>,
})
