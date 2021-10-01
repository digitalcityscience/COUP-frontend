<template>
  <div class="component_divisions">
    <ul>
      <li
        v-for="menuLink in menuLinks"
        :key="menuLink.title"
        @click="activate(menuLink)"
        :class="{
          highlight: highlighted === menuLink.title,
          hidden: menuLink.hidden,
        }"
      >
        <MenuComponentLink :menuLink="menuLink" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import MenuComponentLink from "@/components/Menu/MenuComponentLink.vue";
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import { MenuLink } from "@/models";
@Component({
  components: { MenuComponentLink },
})
export default class MenuComponentDivision extends Vue {
  @Prop()
  menuLinks!: MenuLink[];
  @Prop()
  highlighted!: string;
  @Emit("active")
  activate(activeDivision: MenuLink): string {
    return activeDivision.title;
  }

  mounted(): void {
    const defaultActive = this.menuLinks.find((link) => link.default);
    if (defaultActive) {
      this.activate(defaultActive);
    }
  }
}
</script>

<style lang="scss" scoped></style>
