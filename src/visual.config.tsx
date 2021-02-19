import {ElButton, ElInput} from 'element-plus'
import { createEditorColorProp, createEditorInputProp, createEditorSelectProp } from './packages/utils/visual-editor-props';

import { createVisualEditorConfig } from "./packages/visual-editor.utils";

export const visualConfig = createVisualEditorConfig()

visualConfig.registry('text',{
    label: '文本',
    preview: () => '文本',
    render: () => '渲染',
    props: {
      text: createEditorInputProp('显示文本'),
      color: createEditorColorProp('字体颜色'),
      size: createEditorSelectProp('字体大小', [
        {label: '14px', val: '14px'},
        {label: '18px', val: '18px'},
        {label: '24px', val: '24px'}
      ])
    }
})

visualConfig.registry('button',{
    label:'按钮',
    preview:() => <ElButton>按钮</ElButton>,
    render: () => <ElButton>渲染按钮</ElButton>,
    props: {
      text: createEditorInputProp('显示文本'),
      type: createEditorSelectProp('字体大小', [
        {label: '基础', val: 'primary'},
        {label: '成功', val: 'success'},
        {label: '警告', val: 'warning'},
        {label: '危险', val: 'danger'},
        {label: '提示', val: 'info'},
        {label: '文本', val: 'text'}
      ]),
      size: createEditorSelectProp('按钮大小', [
        {label: '默认', val: ''},
        {label: '中等', val: 'medium'},
        {label: '小', val: 'small'},
        {label: '极小', val: 'mini'},
      ])
    }
})

visualConfig.registry('input',{
    label:'输入框',
    preview:() => <ElInput/>,
    render: () => <ElInput/>,
})
