// https://docs.cypress.io/api/introduction/api.html


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

  // Load the architectural design layers 
  it("Check if architectural design layers are loaded and visible", () => {
    // map.style._layers should include noise and trafficCounts layers
    const getStore = () => cy.window().its('$store')

    // test if all design layers are loaded & visible
    for (layerName of ['spaces', 'groundfloor', 'upperfloor', 'rooftops']) {
      // is layer loaded?
      getStore().its('state').its('map').its('style').its('_layers').should('have.property', layerName)
      // is layer visible?
      getStore().its('state').its('map').invoke('queryRenderedFeatures').then((yielded) => {
        let containsLayer = (renderedFeature) => renderedFeature.layer.id === layerName;
        expect(yielded.some(containsLayer)).to.equal(true)
      })
    }

    // focus areas should be loaded but invisible
    getStore().its('state').its('map').its('style').its('_layers').should('have.property', 'focusAreas')
    getStore().its('state').its('map').invoke('getLayoutProperty', 'focusAreas', 'visibility').should('eq', 'none')
  });

});
