/// <reference types="Cypress" />

const deleteTag = (name) => {
  cy.contains("Create tags for study programme");
  cy.contains(name).siblings().contains("Delete").click();
  cy.contains("Are you sure you want to delete tag");
  cy.contains("Confirm").click();
  cy.contains(name).should("not.exist");
};

describe("Tag tests", () => {
  beforeEach(() => {
    cy.init();
    cy.contains("Study programme").click();
    cy.contains("Overview").click();
    cy.contains("Datatieteen maisteriohjelma").click();
    cy.contains("Tags").click();
  });

  it("Tagged population works", () => {
    const name = `tag-${new Date().getTime()}`;
    cy.get(":nth-child(1) > .field > .ui > input").type(name);
    cy.get(".form-control").type("2016");
    cy.contains("Create new tag").click();
    cy.contains(name);
    cy.contains("2016");

    cy.contains("Add tags to students").click();
    cy.get(".form > .field > .dropdown")
      .click()
      .get(".ui > .search")
      .type(name)
      .click();

    cy.get(".form > .field > .dropdown > .visible").contains(name).click();

    cy.get("textarea").type("014022579\n011122249");
    cy.get(".positive").click();
    cy.contains(name).find(".level").click();

    cy.contains("Credit accumulation (for 1 students)");
    cy.contains("Students (1)").click();
    cy.contains("014022579");

    cy.go("back");
    deleteTag(name);
  });
});
