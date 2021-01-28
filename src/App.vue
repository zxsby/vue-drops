<template>
    <div>
      哈哈哈
      <VisualEditor :config='visualConfig' v-model='jsonData'/>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'; 
import {VisualEditor} from '@/packages/visual-editor'
import {visualConfig} from '@/visual.config'
export default defineComponent({
  name: 'App',
  components: {
    VisualEditor
  },
  data(){
    return{
      visualConfig,
      jsonData: {
        container: {
          height: 600,
          width: 1200
        },
        blocks: [
        ]
      }
    }
  }
});
</script>

<style lang="scss">
html,body{
  margin:0;
  padding:0
}
</style>
