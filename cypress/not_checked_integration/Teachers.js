/// <reference types="Cypress" />

describe("Teachers page tests", () => {
  beforeEach(() => {
    cy.init();
    cy.contains("Teachers").click();
    cy.contains("Teacher statistics by course providers");
  });

  it("Check Statistics", () => {
    cy.get(":nth-child(1) > .ui > .search").click();
    cy.contains("Autumn 2017").click();
    cy.cs("course-providers").click();
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click();
    cy.cs("course-providers").children(".icon").click();
    cy.get(".form > .fluid").click();
    cy.contains("Name");
    cy.contains("Wu");
    cy.contains("Jämsä");
    cy.contains("Kuusinen");
  });

  it("Teacher search works", () => {
    cy.url().should("include", "/teachers");
    cy.get(".borderless > :nth-child(3)").click();
    cy.get(".prompt").type("Pekka");
    cy.contains("Professori Pekka");
    cy.contains("Saren");
    cy.contains("Jari");
    cy.contains("Lopez");
  });

  it("Can check teacher page", () => {
    cy.url().should("include", "/teachers");
    cy.get(".borderless > :nth-child(3)").click();
    cy.get(".prompt").type("Pekka");
    cy.contains("Leinonen").click();
    cy.contains(
      "Academic and Professional Communication in English 1 & 2 (CEFR B2)"
    );
  });

  it("Can check teacher page if teacher doesn't have courses", () => {
    cy.url().should("include", "/teachers");
    cy.get(".borderless > :nth-child(3)").click();
    cy.get(".prompt").type("Pekka");
    cy.contains("Professori").click();
    cy.contains("Name").should("not.exist");
  });

  // it("Check leaderboad works", () => {
  //   cy.get('.borderless > :nth-child(2)').click({ force: true })
  //   cy.get(':nth-child(1) > .ui > .search').click({ force: true })
  //   cy.get(':nth-child(1) > .ui > .search').click({ force: true })
  //   cy.contains('2017-18').click({ force: true })
  //   cy.contains("Recalculate this year").click({ force: true })
  //   cy.wait(5000)
  //   cy.reload()
  //   cy.get(':nth-child(1) > .ui > .search').click({ force: true })
  //   cy.contains('2017-18').click()
  //   cy.contains("Passed")
  //   cy.contains("Antero")
  //   cy.contains("Sassmannshausen")
  // })
});
