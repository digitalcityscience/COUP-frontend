<template>
  <div class="division" :data-title="tooltip" :data-pic="icon">
    <div v-if="active" class="component_content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
@Component
export default class MenuDivision extends Vue {
  @Prop()
  active!: boolean;
  @Prop()
  icon!: string;
  @Prop()
  tooltip!: string;
}
</script>

<style lang="scss" scoped></style>
