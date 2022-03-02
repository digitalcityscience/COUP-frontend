// https://docs.cypress.io/api/introduction/api.html

const getStore = () => cy.window().its("$store");

const layersByTopic = {
  "sun_exposure": ["sun_exposure"],
  "noise": ["noise", "trafficCounts"],
  "wind": ["wind"],
  "stormwater": ["stormwater"],
  "abm": ["abmAmenities", "abmTrips", "abmHeat"],
}

describe("Test layer switching", () => {
  // Log in first
  it("Allow access with correct credentials", () => {
    cy.visit("/");
    cy.get("input#input_field_user").type(Cypress.env("USERNAME"), {
      log: false,
    });
    cy.get("input#input_field_pw").type(Cypress.env("PASSWORD"), {
      log: false,
    });
    cy.get("button[type='submit']").click();
    cy.get(".mapboxgl-map").should("be.visible");
  });

  // needed to see all layers
  it("zooms in ", () => {
    cy.wait(1000);
    const map = cy.get("#map");
    map.should("exist");
    map
      .trigger("mouseenter", 250, 250)
      .trigger("wheel", { deltaY: -5000.666666 }); // scroll to zoom in
  });


  // Load a sun_exposure scenario
  it("Load a result for each module", () => {
    for (const topic in layersByTopic) {
      // click on menu button
      let buttonSelector = "[data-cy=" + topic + "-menu-button]";
      cy.get(buttonSelector).click();
      // load result
      cy.get("[data-cy=run-scenario-button]").click({ force: true });
    }

    // wait for all results to load
    cy.wait(20000);
  });


  // Check if all layers added to map state
  it("Check if all layers added to map state", () => {
    for (const topic in layersByTopic) {
      for (layer of layersByTopic[topic]) {
        getStore()
          .its("state")
          .its("map")
          .its("style")
          .its("_layers")
          .should("have.property", layer);
      }
    }
  });


  // Check if all layers visible
  it("Check if all layers per topic visible/invisible", () => {
    for (const topic in layersByTopic) {
      // switch menu to topic
      let buttonSelector = "[data-cy=" + topic + "-menu-button]";
      cy.get(buttonSelector).click();
      cy.wait(5000);

      const layersToBeVisible = layersByTopic[topic]
      const layersToBeHidden = Object.keys(layersByTopic).reduce((acc, iterTopic) => {
        if (iterTopic != topic) {
          acc.push(...layersByTopic[iterTopic])
        }
        return acc
      }, []
      )

      // check that layers are visible
      for (layerName of layersToBeVisible) {
        getStore()
        .its("state")
        .its("map")
        .its("style")
        .invoke("getLayer", layerName)
        .then((yielded) => {
          // ATTENTION: this only works if layer visibility was explicitly set once. E.g. layer hidden or recalled. 
          // Does not work on newly added layers, returns undefined. That's why it is not used in other tests.
          expect(yielded.visibility).to.be.equal("visible");
        })
      }
      
      // check that layers are hidden
      for (layerName of layersToBeHidden) {
        getStore()
        .its("state")
        .its("map")
        .its("style")
        .invoke("getLayer", layerName)
        .then((yielded) => {
          // ATTENTION: this only works if layer visibility was explicitly set once. E.g. layer hidden or recalled. 
          // Does not work on newly added layers, returns undefined. That's why it is not used in other tests.
          expect(yielded.visibility).to.be.equal("none");
        })
      }
    }
  })
})