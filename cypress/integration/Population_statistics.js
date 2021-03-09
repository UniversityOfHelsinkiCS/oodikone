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
        // go back to 2010-2019
        cy.get(".yearSelectInput .rdtPrev").click({ force: true });
        cy.get(".yearSelectInput table")
          .contains("2014-2015")
          .click({ force: true });
        cy.get("@enrollmentSelect").should("not.have.value", beforeVal);
      });

    cy.contains("Select study programme")
      .click()
      .siblings()
      .contains("Tietojenkäsittelytieteen koulutusohjelma")
      .click();
    cy.contains("Select degree")
      .click()
      .siblings()
      .contains("Luonnontieteiden kandidaatti");
  });

  // FIXME: re-enable when CI has mandatory courses in the db
  it.skip("Population statistics is usable on general level", () => {
    cy.selectStudyProgramme("Tietojenkäsittelytieteen maisteriohjelma");
    setPopStatsUntil("September 2019");

    cy.get(".card").within(() => {
      cy.contains("Tietojenkäsittelytieteen maisteriohjelma");
      cy.contains("Sample size: 29 students");
      cy.contains("Excludes exchange students");
      cy.contains("Excludes students who haven't enrolled present nor absent");
    });
    cy.contains("Courses of population").click({ force: true });

    cy.route("/api/v3/courseyearlystats**").as("coursePage");
    cy.wait(150);
    cy.cs("expand-CSM10000").click();
    cy.cs("coursestats-link-CSM12101").click();
    cy.wait("@coursePage");
    cy.url().should("include", "/coursestatistics");
    cy.contains("CSM12101");
  });

  it.skip("Student list checking works as intended", () => {
    cy.selectStudyProgramme("Tietojenkäsittelytieteen maisteriohjelma");
    cy.contains("Students (16)").click();
    cy.contains("010429464");
    cy.contains("666666666").should("not.exist");
    cy.contains("button", "Check studentnumbers").click();
    cy.contains("Check for studentnumbers");
    cy.get("textarea").type("010429464").type("{enter}").type("666666666");
    cy.contains("button", "check students").click();
    cy.contains("#checkstudentsresults", "Results").within((e) => {
      cy.contains("Student numbers in list and in oodi").click();
      cy.contains("#found", "010429464");
      cy.contains("Student numbers in list but not in oodi").click();
      cy.contains("#notfound", "666666666");
      cy.contains("Student numbers in oodi but not in list").click();
      cy.contains("#notsearched", "010533091");
    });
  });

  it.skip("Empty 'tags' tab has a link to the page where tags can be created", () => {
    cy.selectStudyProgramme("Kielten kandiohjelma");
    cy.contains("Students (5)").click();
    cy.get("[data-cy=student-table-tabs]").contains("Tags").click();
    cy.contains("No tags defined. You can define them here.").find("a").click();
    cy.contains("Kielten kandiohjelma");
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

  it.skip("Credit Statistics, Statistics pane works", () => {
    cy.selectStudyProgramme("Tietojenkäsittelytieteen kandiohjelma");
    cy.contains("Credit statistics").click();
    cy.get("[data-cy='credit-stats-tab'] > .menu > :nth-child(2)").click();

    cy.get("[data-cy='credit-stats-table-name-header']").should(
      "contain",
      "Statistic for n = 194 Students"
    );
    cy.get("[data-cy='credit-stats-mean']").should("contain", "45.10");
    cy.get("[data-cy='credit-stats-stdev']").should("contain", "30.61");
    cy.get("[data-cy='credit-stats-min']").should("contain", "0");
    cy.get("[data-cy='credit-stats-q1']").should("contain", "19");
    cy.get("[data-cy='credit-stats-q2']").should("contain", "47");
    cy.get("[data-cy='credit-stats-q3']").should("contain", "66");
    cy.get("[data-cy='credit-stats-max']").should("contain", "137");
  });
});
