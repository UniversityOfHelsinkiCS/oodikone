/// <reference types="Cypress" />

describe("Student Statistics tests", () => {
  beforeEach(() => {
    cy.init();
    cy.contains("Student statistics").click();
    cy.contains("Show student names");
  });

  it("Student statistics search form is usable", () => {
    cy.contains("Show student names");
    cy.url().should("include", "/students");
    cy.get(".prompt").type("Oinonen");
    cy.contains("Student number");
    cy.contains("Started");
    cy.contains("Credits");
    cy.contains("Heidi Eeva").should("not.exist");

    cy.get("label").click();
    cy.contains("Heidi Eeva");

    cy.get("label").click();
    cy.contains("Heidi Eeva").should("not.exist");
  });
  it("Can get student specific page by clicking student", () => {
    cy.url().should("include", "/students");
    cy.get(".prompt").type("Oinonen");
    cy.contains("014473717").click();
    cy.contains("Updated at 02.10.2019");
    cy.contains("Musiikin didaktiikka (EDUK4212)");
    cy.contains("Oinonen").should("not.exist");

    cy.get("label").click();
    cy.contains("Oinonen");

    cy.get("label").click();
    cy.contains("Oinonen").should("not.exist");
  });

  it("Can get back to search menu", () => {
    cy.get(".prompt").type("Oinonen");
    cy.contains("014473717").click();
    cy.get(".remove").click();
    cy.contains("Student number").should("not.exist");
    cy.contains("Credits").should("not.exist");
  });

  it("Can jump to course", () => {
    cy.get(".prompt").type("Oinonen");
    cy.contains("014473717").click();
    cy.contains("Musiikin didaktiikka (EDUK4212)")
      .siblings()
      .within(() => {
        cy.get(".level").click();
      });
    cy.url().should("include", "/coursestatistics");
    cy.contains("Musiikin didaktiikka");
  });

  it("Searching with bad inputs doesnt yield results", () => {
    cy.get(".prompt").type("Oin");
    cy.contains("Student number").should("not.exist");

    cy.get(".prompt").clear().type("01114");
    cy.contains("Student number").should("not.exist");
  });

  it("Can jump to population page", () => {
    cy.get(".prompt").type("Veli-Matti");
    cy.contains("014824094").click();
    cy.get("i.level.up.alternate.icon").eq(0).click();
    cy.contains("Population statistics");
    cy.contains("Tietojenkäsittelytieteen maisteriohjelma");
  });
});
