<template>
  <div class="button_section">
    <div class="btn_wrapper">
      <v-tooltip right>
        <template v-slot:activator="{ on, attrs }">
          <v-btn @click="increaseAnimationSpeed">
            <v-icon v-bind="attrs" v-on="on">mdi-fast-forward</v-icon>
          </v-btn>
        </template>
        <span>Adjust Simulation Speed</span>
      </v-tooltip>
      <div class="indicators">
        <span
          class="indicator"
          v-bind:class="{ marked: animationSpeed >= 7 }"
        ></span>
        <span
          class="indicator"
          v-bind:class="{ marked: animationSpeed >= 14 }"
        ></span>
        <span
          class="indicator"
          v-bind:class="{ marked: animationSpeed >= 21 }"
        ></span>
        <span
          class="indicator"
          v-bind:class="{ marked: animationSpeed >= 28 }"
        ></span>
      </div>
    </div>
    <div class="btn_wrapper">
      <v-tooltip right>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" @click="triggerAnimation">
            <v-icon v-if="animationRunning">mdi-pause</v-icon>
            <v-icon v-else>mdi-play</v-icon>
          </v-btn>
        </template>
        <span v-if="animationRunning">Pause Animation</span>
        <span v-else>Play Animation</span>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { StoreStateWithModules } from "@/models";
import { Component, Emit, Vue, Prop } from "vue-property-decorator";
import { Store } from "vuex";
@Component
export default class TimeSheetControl extends Vue {
  $store: Store<StoreStateWithModules>;

  checkState = false;
  animationSpeed = 21;

  get windowWidth(): number {
    return window.innerWidth;
  }

  @Prop({ default: false })
  animationRunning!: boolean;

  @Emit()
  triggerAnimation(): boolean {
    return true;
  }

  @Emit("animationSpeed")
  animationSpeedChanged(): number {
    return this.animationSpeed;
  }

  increaseAnimationSpeed(): void {
    if (this.animationSpeed <= 21) {
      this.animationSpeed += 7;
    } else {
      this.animationSpeed = 7;
    }
    this.animationSpeedChanged();
    this.$store.commit("scenario/animationSpeed", this.animationSpeed);
  }
}
</script>

<style lang="scss" scoped>
@import "@/style/mixins.scss";
@import "@/style/colors.scss";

.button_section {
  display: flex;
  flex-flow: row wrap;
  align-content: flex-end;
  position: absolute;
  top: 12.5%;
  left: calc(100% + 5px);
  width: 30px;
  height: 70%;

  .btn_wrapper {
    position: relative;

    .looper {
      position: absolute;
      top: 0;
      right: -35px;
      width: 30px;
      height: 30px;
      border-radius: 3px;
      background: whitesmoke;
      @include drop_shadow;

      .v-icon {
        color: #222;
        width: 20px;
        height: 20px;
        margin: 5px;
      }

      &:hover {
        cursor: pointer;
      }

      &.highlight {
        background: $orange;
        filter: invert(1);
        border: 1px solid black;
      }
    }

    ::v-deep.v-btn {
      position: relative;
      padding: 0;
      width: 30px;
      height: 30px;
      min-width: 0;
      filter: invert(1);
      background: $bright1;
      margin: 0 0 4px;
      opacity: 0.8;
      @include drop_shadow;
    }

    &:nth-child(3) {
      ::v-deep.v-btn {
        opacity: 1;
        border: 1px solid $darkred;
      }
    }

    .indicators {
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-content: center;
      position: absolute;
      left: calc(100% + 2px);
      top: 0;
      width: 5px;
      height: 30px;
      opacity: 0;

      .indicator {
        flex: 1 0 100%;
        background: rgba(0, 0, 0, 0.85);

        &.marked {
          display: block;
          margin: 1px auto;
          width: 5px;
          height: 5px;
          background: $opaqueorange;
        }
      }
    }

    .filterMenu {
      opacity: 0;
      pointer-events: none;
      position: absolute;
      top: -35px;
      left: calc(100% + 5px);
      width: 300px;
      padding: 15px 20px;
      box-sizing: border-box;
      background: rgba(0, 0, 0, 0.75);
      @include drop_shadow;
    }

    &.highlight {
      ::v-deep.v-btn {
        border: 1px solid $bright2;
        filter: invert(0) !important;
      }
    }

    &:hover {
      .indicators {
        opacity: 1;
        transition: 0.3s;
      }
    }
  }
}

@media (max-device-width: 720px) {
  .button_section {
    position: fixed;
    bottom: 0;
    left: 0;
    top: auto;
    width: 100%;
    height: 40px;
    background: black;
    display: flex;
    flex-flow: row wrap;
    justify-content: center;

    .btn_wrapper {
      margin: 0 10px;

      &:nth-child(1) {
        order: 1;
      }

      &:nth-child(3) {
        order: 2;

        button {
          border-radius: 0px;
          border: 1px solid black;
          background: #e65449;
        }
      }

      &:nth-child(2) {
        order: 3;
      }

      &:last-child {
        order: 4;
        justify-self: flex-end;
        margin: 0 5px 0 auto;

        .v-btn {
          border-radius: 0px;
          border: none;
        }

        &.highlight {
          .v-btn {
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid white;
          }
        }
      }
    }
  }
}
</style>
