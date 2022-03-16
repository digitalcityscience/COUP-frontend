// https://docs.cypress.io/api/introduction/api.html

const getStore = () => cy.window().its("$store");

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

  // Load a sun_exposure scenario
  it("Load a saved sun_exposure scenario", () => {
    // navigate to sun_exposure tab
    cy.get("[data-cy=sun_exposure-menu-button]").click();
    // load sun_exposure result
    cy.get("[data-cy=run-scenario-button]").click();

    // loader should be visible
    cy.get("[data-cy=big-loader-screen]").should("be.visible");

    // error should not be visible
    cy.get("[data-cy=result-loading-error]").should("not.be.visible");

    // wait for sun_exposure result to load
    cy.wait(5000);

    // map.style._layers should include sun_exposure layer
    getStore()
      .its("state")
      .its("map")
      .its("style")
      .its("_layers")
      .should("have.property", "sun_exposure");
  });

  it("Is sun_exposure layer visible?", () => {
    // filter all rendered features for the sun_exposure layer
    getStore()
      .its("state")
      .its("map")
      .invoke("queryRenderedFeatures")
      .then((yielded) => {
        let containsSunExposureLayer = (renderedFeature) =>
          renderedFeature.layer.id === "sun_exposure";
        expect(yielded.some(containsSunExposureLayer)).to.equal(true);
      });
  });

  it("Is legend visible?", () => {
    // filter all rendered features for the sun_exposure layer
    cy.get("[data-cy=legend-bottom]").should("be.visible");
  });
});
