/// <reference types="Cypress" />

const deleteTag = (name) => {
  cy.contains(name).siblings().contains("Delete").click();
  cy.contains("Are you sure you want to delete tag");
  cy.contains("Confirm").click();
  cy.contains(name).should("not.exist");
};

describe("Studyprogramme overview", () => {
  beforeEach(() => {
    cy.init();
    cy.contains("Study programme")
      .click()
      .siblings()
      .contains("Overview")
      .click();
    cy.contains("Study Programme", { timeout: 100000 });
  });
  // Return this when anon data has some kasvatustieteiden kandi
  it.skip("can view course groups", () => {
    cy.contains("Kasvatustieteiden kandiohjelma").click();
    cy.contains("Course Groups").click();

    cy.contains("tr", "Test course group").get("i.edit").click();
    cy.contains("Edit group");
    cy.get(".prompt").type("Professori Pekka");
    cy.contains("Add teacher").parent().contains("000960").click();
    cy.contains("Teachers in group").parent().contains("000960");

    cy.get("i.reply.link.icon").click();
    cy.contains("tr a", "Test course group").click();
    cy.contains("Total teachers");
    cy.get("i.reply.icon").click();
  });


  it("progress should not be recalculating when opened for the first time", () => {
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click();
    cy.wait(1000)
    cy.contains("Recalculating").should("not.exist")
  })

  // Taken from https://docs.cypress.io/api/commands/should#Compare-text-values-of-two-elements
  const normalizeText = (s) => s.replace(/\s/g, '').toLowerCase()
  let originalProgressCalculatedText;
  let originalProductivityCalculatedText;

  // Used by two tests
  const testProgressAndProductivity = () => {
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click();
    cy.contains("Admin").click();
    cy.contains("productivity").click();
    cy.contains("throughput").click();

    cy.wait(1000);
    cy.get(".attached > :nth-child(1)").click();
    cy.get("table").should("have.length", 3);
    cy.contains("Population progress");
    cy.contains("Yearly productivity");

    // These are the values if user has dev rights, since graduation feature is shown for only for devs
    //const populationprogress2017IfUserHasDev = ["43", "32 (74%)", "11 (25%)", "42 (97%)", "43", "3", "10", "10", "33 months", "0", "0", 
    // "38", "34", "26", "22", "10"]
    const populationprogress2017 = ["43", "32 (74%)", "11 (25%)", "42 (97%)", "43", "3", "10", "0", "0", "38", "34", "26", "22", "10"]
    cy.contains("2017-2018")
      .siblings()
      .each((elem, index) => {
        cy.wrap(elem).contains(populationprogress2017[index])
      })

    cy.get("table")
      .eq(1)
      .contains("2018")
      .siblings()
      .contains("1378.00")
      .siblings()
      .contains("55.00");

    cy.get("table")
      .eq(1)
      .contains("2017")
      .siblings()
      .contains("555.00")
      .siblings()
      .contains("9.00");
  }

  it("renders progress and productivity tables with calculated status", () => {
    testProgressAndProductivity()
    // Wait to "recalculating" to disappear
    cy.wait(1000);
    // Grab update dates to be compared later
    cy.cs("throughputUpdateStatus").invoke("text").then((text) => {
      originalProgressCalculatedText =  normalizeText(text)
      expect(originalProgressCalculatedText).not.to.contain("recalculating")
      expect(originalProgressCalculatedText).not.to.contain("refresh")
    })

    cy.cs("productivityUpdateStatus").invoke("text").then((text) => {
      originalProductivityCalculatedText = normalizeText(text)
      expect(originalProductivityCalculatedText).not.to.contain("recalculating")
      expect(originalProgressCalculatedText).not.to.contain("refresh")
    })
  });

  it("can open Thesis page", () => {
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click();
    cy.contains("Thesis Courses").click();
    cy.contains("Add thesis course").click();
    cy.contains("No results");
  });

  it("can move to Population statistics page by clickin", () => {
    cy.contains("Tietojenkäsittelytieteen maisteriohjelma").click();
    cy.get("i.level.up.alternate.icon").eq(0).click();
    cy.contains("Students (4)");
  });

  it("can create and delete tags for population", () => {
    const name = `tag-${new Date().getTime()}`;
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click();
    cy.get(".attached").contains("Tags").click();
    cy.get(".tagNameSelectInput > .ui > input").type(name);
    cy.get(".yearSelectInput").type("2018");
    cy.contains("Create new tag").click();
    cy.contains(name);
    cy.contains("2018");
    deleteTag(name);
  });

  it("can create personal tags", () => {
    const name = `tag-${new Date().getTime()}`;
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click();
    cy.get(".attached").contains("Tags").click();
    cy.get(".tagNameSelectInput > .ui > input").type(name);
    cy.get(".yearSelectInput").type("2018");

    cy.get(".ui > label").click();
    cy.contains("Create new tag").click();
    cy.get(".purple");
    cy.contains(name);
    deleteTag(name);
  });

  it("can add tags to students", () => {
    const name = `tag-${new Date().getTime()}`;

    const student = "010113437"

    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click();
    cy.get(".attached").contains("Tags").click();
    cy.get(".tagNameSelectInput > .ui > input").type(name);
    cy.get(".yearSelectInput").type("2018");
    cy.contains("Create new tag").click();
    cy.contains(name);

    cy.contains("Add tags to students").click();
    cy.get(".form > .field > .dropdown")
      .click()
      .get(".ui > .search")
      .type(name)
      .click();

    cy.get(".form > .field > .dropdown > .visible").contains(name).click();

    cy.get("textarea").type("010113437");
    cy.get(".positive").click();

    cy.contains("Student statistics").click();
    cy.get(".prompt").type(student);
    cy.contains(student).click();
    cy.contains(name);

    cy.go("back");
    cy.go("back");

    deleteTag(name);

    cy.contains("Student statistics").click();
    cy.get(".prompt").type(student);
    cy.contains(student).click();
    cy.contains(name).should("not.exist");
  });

  it("renders progress and productivity tables with calculated status after recalculating stats again", () => {
    testProgressAndProductivity()

    // Wait to "recalculating" to disappear
    cy.wait(1000);
    // Check new calculation statuses are reported
    const newProgressCalculatedTextElement = cy.cs("throughputUpdateStatus").invoke("text")
    const newProductivityCalculatedTextElement = cy.cs("productivityUpdateStatus").invoke("text")

    newProgressCalculatedTextElement.should((text) => {
      const newProgressCalculatedText = normalizeText(text)
      expect(newProgressCalculatedText).not.to.contain("recalculating")
      expect(newProgressCalculatedText).not.to.contain("refresh")
      expect(newProgressCalculatedText).not.to.contain(originalProgressCalculatedText)
    })

    newProductivityCalculatedTextElement.should((text) => {
      const newProductivityCalculatedText = normalizeText(text)
      expect(newProductivityCalculatedText).not.to.contain("recalculating")
      expect(newProductivityCalculatedText).not.to.contain("refresh")
      expect(newProductivityCalculatedText).not.to.contain(originalProgressCalculatedText)
    })
  });
});
