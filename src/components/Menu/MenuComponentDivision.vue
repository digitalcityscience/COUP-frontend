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

<style lang="scss" scoped>
@import "@/style/mixins.scss";
@import "@/style/colors.scss";

.component_divisions {
  position: absolute;
  top: 22%;
  left: calc(0% - 40px);

  ul {
    display: flex;
    flex-flow: row wrap;
    width: 40px;
    height: auto;
    padding: 0;
    list-style: none;

    li {
      width: 40px;
      height: 40px;
      transform: scale(0.9);
      background: rgba(0, 0, 0, 0.7);
      //border:1px solid #888;
      margin-bottom: 2px;

      &:hover {
        cursor: pointer;
      }

      &.highlight {
        transform: scale(1.03);
        width: 40px;
        transform-origin: right;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid $bright1;
        border-right: 1px solid black;
        @include drop_shadow;

        &.hidden {
          opacity: 1;
          transform: scale(1.03);
        }
      }

      &.hidden {
        transform: translateX(50px) scale(0.5);
        opacity: 0;
        transition: 0.3s;
      }
    }
  }

  @media (max-device-width: 1023px) {
    left: 0;
    position: relative;
    width: calc(100% - 20px);
    height: 50px;
    margin: 5px 10px;
    background: rgba(255, 255, 255, 0.12);

    ul {
      display: flex;
      flex-flow: row wrap;
      width: 100%;
      height: 50px;
      margin: auto;
      padding: 5px;
      box-sizing: border-box;

      li {
        border: 1px solid #888;

        &.highlight {
          transform: scale(1.03);
          background: $reversed;
          border: 1px solid whitesmoke;

          .v-icon {
            color: black;
          }
        }
      }
    }
  }
}
</style>
