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

  // Load a wind scenario
  it("Load a saved wind scenario", () => {
    // navigate to wind tab
    cy.get("[data-cy=wind-menu-button]").click();
    // load wind result
    cy.get("[data-cy=run-scenario-button]").click();

    // loader should be visible
    cy.get("[data-cy=big-loader-screen]").should("be.visible");

    // error should not be visible
    cy.get("[data-cy=result-loading-error]").should("not.be.visible");

    // wait for wind result to load
    cy.wait(5000);

    // map.style._layers should include wind layer
    getStore()
      .its("state")
      .its("map")
      .its("style")
      .its("_layers")
      .should("have.property", "wind");
  });

  it("Is wind layer visible?", () => {
    // filter all rendered features for the wind layer
    getStore()
      .its("state")
      .its("map")
      .invoke("queryRenderedFeatures")
      .then((yielded) => {
        let containsWindLayer = (renderedFeature) =>
          renderedFeature.layer.id === "wind";
        expect(yielded.some(containsWindLayer)).to.equal(true);
      });
  });

  it("Is legend visible?", () => {
    // filter all rendered features for the wind layer
    cy.get("[data-cy=legend-bottom]").should("be.visible");
  });
});
