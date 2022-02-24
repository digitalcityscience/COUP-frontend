// https://docs.cypress.io/api/introduction/api.html

const getStore = () => cy.window().its("$store");
const abmDeckLayers = ["abmTrips", "abmHeat"];

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

  // Load a abm scenario
  it("Init loading of a saved abm scenario", () => {
    // navigate to abm tab
    cy.get("[data-cy=abm-menu-button]").click();
    // load abm result
    cy.get("[data-cy=run-scenario-button]").scrollIntoView();
    cy.get("[data-cy=run-scenario-button]").click({ force: true });

    // loader should be visible
    cy.get("[data-cy=big-loader-screen]").should("be.visible");

    // wait for result
    //cy.wait(5000);

    // TODO add error handling for ABM
    // error should not be visible
    // cy.get('[data-cy=result-loading-error]').should("not.be.visible")
  });

  // check amenities layer
  it("Is amenities layer loaded and visible?", () => {
    // is layer loaded?
    getStore()
      .its("state")
      .its("map")
      .its("style")
      .its("_layers")
      .should("have.property", "abmAmenities");
    // is layer visible?
    getStore()
      .its("state")
      .its("map")
      .invoke("queryRenderedFeatures")
      .then((yielded) => {
        let containsLayer = (renderedFeature) =>
          renderedFeature.layer.id == "abmAmenities";
        expect(yielded.some(containsLayer)).to.equal(true);
      });
  });

  // is abm layer loaded?
  it("Are abm deck layers loaded?", () => {
    // map.style._layers should include abmDeck Layers
    for (const layerName of abmDeckLayers) {
      getStore()
        .its("state")
        .its("map")
        .its("style")
        .its("_layers")
        .should("have.property", layerName);
    }
  });

  // is abm trips layer visible?
  it("Are abm trips visible?", () => {
    // abm is a DeckLayer. These are only accessible like this.
    getStore()
      .its("state")
      .its("map")
      .its("style")
      .its("_layers")
      .its("abmTrips")
      .its("implementation")
      .its("props")
      .its("visible")
      .should("eq", true);
  });

  // is timesheet visible?
  it("Is time sheet visible?", () => {
    // filter all rendered features for the abm layer
    cy.get("[data-cy=abm-time-sheet]").should("be.visible");
  });
});
