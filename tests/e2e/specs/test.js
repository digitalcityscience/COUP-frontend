// https://docs.cypress.io/api/introduction/api.html

describe("Login page test", () => {
  it("The page is password protected and a login form is visible", () => {
    cy.visit("/");

    cy.get("div.login_background").should("be.visible");
    cy.get("form").find("input").should("not.have.class", "disabled");
    cy.get("form").find("input#input_field_pw").should("be.visible");
    cy.get("form").find("input#input_field_user").should("be.visible");
    cy.get("button[type='submit']").should("be.visible");
  });

  it("No access with wrong credentials", () => {
    cy.get("p#error").should("not.be.visible");

    cy.get("input#input_field_user").type("FakeUser");
    cy.get("input#input_field_pw").type("FakePassword");
    cy.get("button[type='submit']").click();

    cy.get("p#error").should("be.visible");
  });
});
