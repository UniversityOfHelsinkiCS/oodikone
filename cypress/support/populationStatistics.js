/// <reference types="Cypress" />

Cypress.Commands.add("selectStudyProgramme", (name) => {
  cy.cs("navbar-studyProgramme").click();
  cy.cs("navbar-class").click();
  cy.cs("select-study-programme").click().children().contains(name).click();
  cy.contains("See population").click();
});
