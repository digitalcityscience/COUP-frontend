// https://docs.cypress.io/api/introduction/api.html

const getStore = () => cy.window().its('$store')

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

  // Load a stormwater scenario  
  it("Init loading of a saved stormwater scenario", () => {
    // navigate to stormwater tab
    cy.get('[data-cy=stormwater-menu-button]').click()
    // load stormwater result
    cy.get('[data-cy=run-scenario-button]').scrollIntoView()
    cy.get('[data-cy=run-scenario-button]').click({"force": true})
    
    // loader should be visible
    cy.get('[data-cy=big-loader-screen]').should("be.visible")

    // error should not be visible
    cy.get('[data-cy=result-loading-error]').should("not.be.visible")
  });

  // is stormwater layer loaded?
  it("Is stormwater layer loaded?", () => {
     // map.style._layers should include stormwater layer
     getStore().its('state').its('map').its('style').its('_layers').should('have.property', 'stormwater')
  }) 
  
  // is stormwater layer visible?
  it("Is stormwater layer visible?", () => {
    // Stormwater is a DeckLayer. These are only accessible like this.
    getStore().its('state').its('map').its('style').its('_layers').its('stormwater').its('implementation').its('props').its('visible').should('eq', true)
  })

  // is timesheet visible?
  it("Is time sheet visible?", () => {
    // filter all rendered features for the stormwater layer
    cy.get('[data-cy=stormwater-time-sheet]').should("be.visible");
  });
});
