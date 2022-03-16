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

   // Load a abm scenario
   it("Init loading of a saved abm scenario", () => {
    // navigate to abm tab
    cy.get("[data-cy=abm-menu-button]").click();
    // load abm result
    cy.get("[data-cy=run-scenario-button]").scrollIntoView();
    cy.get("[data-cy=run-scenario-button]").click({ force: true });

    // loader should be visible
    cy.get("[data-cy=big-loader-screen]").should("be.visible");

  });

  // No ABM time sheet in stormwater
  it("No ABM time sheet in stormwater", () => {
    // navigate to stormwater tab
    cy.get("[data-cy=stormwater-menu-button]").click();
    
    
    // wait for abm result to come in.
    cy.wait(10000)
    // check that timeSheet for ABM does not appear
    cy.get("[data-cy=abm-time-sheet]").should("not.be.visible");

  });
    
    
  // No stormwater time sheet in ABM
  it("No stormwater time sheet in ABM", () => {
    // load stormwater result
    cy.get("[data-cy=run-scenario-button]").scrollIntoView();
    cy.get("[data-cy=run-scenario-button]").click({ force: true });

    // loader should be visible
    cy.get("[data-cy=big-loader-screen]").should("be.visible");
    // error should not be visible
    cy.get("[data-cy=result-loading-error]").should("not.be.visible");

    // navigate back to abm tab
    cy.get("[data-cy=abm-menu-button]").click();

    // wait for stormwater result to come in.
    cy.wait(10000)
    // check that timeSheet for stormwater does not appear
    cy.get("[data-cy=stormwater-time-sheet]").should("not.be.visible");
  });
});
