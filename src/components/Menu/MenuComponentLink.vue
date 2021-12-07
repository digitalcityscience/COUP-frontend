<template>
  <div class="component_link">
    <v-tooltip left>
      <template v-slot:activator="{ on, attrs }">
        <v-icon v-bind="attrs" v-on="on">{{ menuLink.icon }}</v-icon>
      </template>
      <span>{{ menuLink.title }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { MenuLink } from "@/models";
@Component
export default class MenuComponentLink extends Vue {
  @Prop()
  menuLink!: MenuLink;
}
</script>

<style lang="scss" scoped>
.component_link {
  .v-icon {
    width: 37px;
    height: 40px;
    filter: invert(1);
  }
}
</style>
