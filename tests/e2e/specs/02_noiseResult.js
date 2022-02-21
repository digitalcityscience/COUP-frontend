// https://docs.cypress.io/api/introduction/api.html

describe("Login page test", () => {
  it("Load a saved noise scenario", () => {
    // navigate to noise tab
    cy.get("menu .component_switch .component_list").find("li").get('p*="noise"]').click();
    
    // loader should be visible
    cy.get("div.big_loader").should("be.visible");

  });

/*   it("No access with wrong credentials", () => {
    cy.get("p#error").should("not.be.visible");

    cy.get("input#input_field_user").type("FakeUser");
    cy.get("input#input_field_pw").type("FakePassword");
    cy.get("button[type='submit']").click();

    cy.get("p#error").should("be.visible");
  });

  it("Allow access with correct credentials", () => {
    cy.visit("/");
    cy.get("p#error").should("not.be.visible");

    cy.get("input#input_field_user").type(Cypress.env("USERNAME"), {
      log: false,
    });
    cy.get("input#input_field_pw").type(Cypress.env("PASSWORD"), {
      log: false,
    });
    cy.get("button[type='submit']").click();
    cy.get("p#error").should("not.be.visible");
    cy.get(".mapboxgl-map").should("be.visible");
  }); */
});
