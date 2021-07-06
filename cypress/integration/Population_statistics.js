/// <reference types="Cypress" />

const setPopStatsUntil = (until, includeSettings = []) => {
  cy.contains("Advanced settings")
    .siblings()
    .get("[data-cy=advanced-toggle]")
    .click();
  includeSettings.forEach((setting) => {
    cy.contains("Advanced settings")
      .parent()
      .siblings()
      .contains(setting)
      .click();
  });
  cy.get(".adv-stats-until > .form-control").click().clear().type(until);
  cy.contains("Fetch population with new settings").click();
  cy.contains("Advanced settings");
};

describe("Population Statistics tests", () => {
  beforeEach(() => {
    cy.init();
  });

  const checkAmountOfStudents = (assertion) => {
    let students = 0;
    cy.contains("Credit accumulation")
      .click()
      .invoke("text")
      .then((text) => {
        students = Number(text.match(/\d+/g)[0]);
        expect(students).to.equal(assertion);
      });
  };

  it("Population statistics search form is usable", () => {
    cy.cs("navbar-studyProgramme").click();
    cy.cs("navbar-class").click();
    cy.contains("See population").should("be.disabled");
    cy.url().should("include", "/populations");
    cy.contains("Search for population");
    cy.contains("Class of")
      .parent()
      .within(() => {
        cy.get(".form-control").as("enrollmentSelect");
      });

    cy.get("@enrollmentSelect")
      .its(`${[0]}.value`)
      .then((beforeVal) => {
        cy.get("@enrollmentSelect").click();
        cy.get(".yearSelectInput .rdtPrev").click({ force: true });
        cy.get(".yearSelectInput table")
          .contains("2018-2019")
          .click({ force: true });
        cy.get("@enrollmentSelect").should("not.have.value", beforeVal);
      });

    cy.contains("Select study programme")
      .click()
      .siblings()
      .contains("Tietojenkäsittelytieteen maisteriohjelma")
      .click();
  });

  it("Population statistics is usable on general level", () => {
    cy.selectStudyProgramme("Tietojenkäsittelytieteen kandiohjelma");
    setPopStatsUntil("toukokuu 2020");

    cy.get(".card").within(() => {
      cy.contains("Tietojenkäsittelytieteen kandiohjelma");
      cy.contains("Sample size: 40 students");
      cy.contains("Excludes exchange students");
      cy.contains("Excludes students who haven't enrolled present nor absent");
      cy.contains("Excludes students with non-degree study right");
      cy.contains("Excludes students who have transferred out of this programme");

    });
    cy.contains("Courses of population").click({ force: true });

    cy.route("/api/v3/courseyearlystats**").as("coursePage");
    cy.wait(1500); // a bit hacky way, wait until ui is ready
    cy.cs("expand-TKT1").click();
    cy.cs("coursestats-link-TKT10002").click();
    cy.wait("@coursePage");
    cy.url().should("include", "/coursestatistics");
    cy.contains("TKT10002, 581325 Ohjelmoinnin perusteet");
  });

  it("Student list checking works as intended", () => {
    const existing = "010113437"
    const nonExisting = "66666666"
    cy.selectStudyProgramme("Tietojenkäsittelytieteen kandiohjelma");
    cy.contains("Students (40)").click();
    cy.contains(existing);
    cy.contains(nonExisting).should("not.exist");
    cy.contains("button", "Check studentnumbers").click();
    cy.contains("Check for studentnumbers");
    cy.get("textarea").type(existing).type("{enter}").type(nonExisting);
    cy.contains("button", "check students").click();
    cy.contains("#checkstudentsresults", "Results").within((e) => {
      cy.contains("Student numbers in list and in oodi").click();
      cy.contains("#found", existing);
      cy.contains("Student numbers in list but not in oodi").click();
      cy.contains("#notfound", nonExisting);
      cy.contains("Student numbers in oodi but not in list").click();
      cy.contains("#notsearched", "010614509");
    });
  });

  it("Empty 'tags' tab has a link to the page where tags can be created", () => {
    cy.cs("navbar-studyProgramme").click();
    cy.cs("navbar-class").click();
    cy.contains("See population").should("be.disabled");
    cy.url().should("include", "/populations");
    cy.contains("Search for population");
    cy.contains("Class of")
      .parent()
      .within(() => {
        cy.get(".form-control").as("enrollmentSelect");
      });

    cy.get("@enrollmentSelect")
      .its(`${[0]}.value`)
      .then((beforeVal) => {
        cy.get("@enrollmentSelect").click();
        cy.get(".yearSelectInput .rdtPrev").click({ force: true });
        cy.get(".yearSelectInput table")
          .contains("2019-2020")
          .click({ force: true });
        cy.get("@enrollmentSelect").should("not.have.value", beforeVal);
      });
    cy.selectStudyProgramme("Datatieteen maisteriohjelma");
    cy.contains("Students (5)").click();
    cy.get("[data-cy=student-table-tabs]").contains("Tags").click();
    cy.contains("No tags defined. You can define them here.").find("a").click();
    cy.contains("Tags").click();
    cy.contains("Datatieteen maisteriohjelma");
    cy.contains("Create new tag");
  });

  it.skip("Advanced settings work", () => {
    cy.selectStudyProgramme("Tietojenkäsittelytieteen kandiohjelma");
    cy.get("[data-cy=advanced-toggle]").click();
    cy.contains("Statistics until");
    // only spring
    cy.cs("toggle-fall").click();
    cy.contains("Fetch population").click();

    cy.contains("Credit accumulation (for 0 students)");

    // only fall
    cy.get("[data-cy=advanced-toggle]").click();
    cy.cs("toggle-fall").click();
    cy.cs("toggle-spring").click();

    cy.contains("Fetch population").click();

    // FIXME: This fails randomly both locally and on CI.
    cy.contains("Credit accumulation (for 194 students)");

    // spring + fall and include cancelled
    cy.get("[data-cy=advanced-toggle]").click();
    cy.cs("toggle-spring").click();
    cy.cs("toggle-cancelled").click();
    cy.contains("Fetch population").click();

    cy.contains("Credit accumulation (for 202 students)");
  });

  it("Credit Statistics, Statistics pane works", () => {
    cy.selectStudyProgramme("Tietojenkäsittelytieteen kandiohjelma");
    cy.contains("Credit statistics").click();
    cy.get("[data-cy='credit-stats-tab'] > .menu > :nth-child(2)").click();

    cy.get("[data-cy='credit-stats-table-name-header']").should(
      "contain",
      "Statistic for n = 40 Students"
    );
    cy.get("[data-cy='credit-stats-mean']").should("contain", "123.11");
    cy.get("[data-cy='credit-stats-stdev']").should("contain", "57.16");
    cy.get("[data-cy='credit-stats-min']").should("contain", "23");
    cy.get("[data-cy='credit-stats-q1']").should("contain", "81");
    cy.get("[data-cy='credit-stats-q2']").should("contain", "129");
    cy.get("[data-cy='credit-stats-q3']").should("contain", "151");
    cy.get("[data-cy='credit-stats-max']").should("contain", "314");
  });
});
