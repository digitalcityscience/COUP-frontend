import { shallowMount, createLocalVue } from "@vue/test-utils";
import StormwaterScenario from "@/components/Scenario/StormwaterScenario.vue";
import Vuex from "vuex";
import stormwater, { defaultStormwaterConfiguration } from "@/store/stormwater";

const localVue = createLocalVue();
localVue.use(Vuex);

describe("StormwaterScenario", () => {
  let wrapper;
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: { stormwater },
    });

    wrapper = shallowMount(StormwaterScenario, {
      localVue,
      store,
    });
  });

  it("scenarioConfiguration is defaulted properly", () => {
    expect(wrapper.vm.scenarioConfiguration).toEqual(
      defaultStormwaterConfiguration
    );
  });
});
