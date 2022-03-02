// https://docs.cypress.io/api/introduction/api.html

const getStore = () => cy.window().its("$store");

const layersByTopic = {
  "sun_exposure": ["sun_exposure"],
  "noise": ["noise", "trafficCounts"],
  "wind": ["wind"],
  "stormwater": ["stormwater"],
  "abm": ["abmTrips", "abmHeat", "abmAmenities"],
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
        // map.style._layers should include sun_exposure layer
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
  it("Check if all layers visible", () => {
    for (const topic in layersByTopic) {
      for (layer of layersByTopic[topic]) {
        console.warn("checking if layer rendered", layer)
        // filter all rendered features for the sun_exposure layer
        getStore()
        .its("state")
        .its("map")
        .invoke("queryRenderedFeatures")
        .then((yielded) => {
          let containsLayer = (renderedFeature) =>
            renderedFeature.layer.id === layer;
          expect(yielded.some(containsLayer)).to.equal(true);
        });
      }
    }
  })})