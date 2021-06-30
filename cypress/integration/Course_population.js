/// <reference types="Cypress" />

describe("Course population tests", () => {
  beforeEach(() => {
    cy.init();
    cy.contains("Course statistics").click();
    cy.contains("Search for courses");
  });

  it("Can find course population", () => {
    cy.url().should("include", "/coursestatistics");
    cy.contains("Search for courses");
    cy.get("input[placeholder='Search by a course code']").type("TKT20003");
    cy.contains("tr", "TKT20003").click();
    cy.contains("Fetch statistics").should("be.enabled").click();

    cy.contains("Käyttöjärjestelmät");
    cy.contains("TKT20003");

    cy.get(":nth-child(3) > :nth-child(1) > div > .item > .level").click();
    cy.contains("Population of course Käyttöjärjestelmät 2019-2020");
    cy.contains("TKT20003");
    cy.contains("Students (all=24)");

    cy.contains("Students (24)").click();
    cy.contains("010135486");
    cy.contains("010431753");
  });
});
