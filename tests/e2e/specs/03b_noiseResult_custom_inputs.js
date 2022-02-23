// https://docs.cypress.io/api/introduction/api.html

const getStore = () => cy.window().its("$store");

// TODO wait for results to load

describe("Log in", () => {
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

  // Load a noise scenario
  it("Load a saved noise scenario", () => {
    // navigate to noise tab
    cy.get("[data-cy=noise-menu-button]").click();
    // load noise result
    cy.get("[data-cy=run-scenario-button]").click();

    // loader should be visible
    cy.get("[data-cy=big-loader-screen]").should("be.visible");

    // error should not be visible
    cy.get("[data-cy=result-loading-error]").should("not.be.visible");

    // wait for noise result to load
    cy.wait(3000);

    // map.style._layers should include noise and trafficCounts layers
    getStore()
      .its("state")
      .its("map")
      .its("style")
      .its("_layers")
      .should("have.property", "noise");
    getStore()
      .its("state")
      .its("map")
      .its("style")
      .its("_layers")
      .should("have.property", "trafficCounts");
  });

  it("Is noise layer visible?", () => {
    // filter all rendered features for the noise layer
    getStore()
      .its("state")
      .its("map")
      .invoke("queryRenderedFeatures")
      .then((yielded) => {
        let containsNoiseLayer = (renderedFeature) =>
          renderedFeature.layer.id === "noise";
        expect(yielded.some(containsNoiseLayer)).to.equal(true);
      });
  });

  it("Is legend visible?", () => {
    // filter all rendered features for the noise layer
    cy.get("[data-cy=legend-bottom]").should("be.visible");
  });
});
