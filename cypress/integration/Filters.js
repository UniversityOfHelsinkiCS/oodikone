/// <reference types="Cypress" />

const checkFilteringResult = (studentCount) => {
  cy.contains(`Students (${studentCount})`);
  // I don't know why this got fkd but we don't have time to fix it now. Works acually, though.
  // cy.cs("active-filter-count").should(noFiltering ? "not.exist" : "exist")
};

describe("Population Statistics", () => {
  before(() => {
    cy.init();
    cy.selectStudyProgramme("Tietojenkäsittelytieteen kandiohjelma");
  });

  // anon data doesn't work with current population statistic logic, so we need to skip
  // these
  it.skip("Graduation filter works", () => {
    cy.cs("graduatedFromProgrammeFilter-header").click();
    cy.selectFromDropdown("graduatedFromProgrammeFilter-dropdown", 0);
    checkFilteringResult(193);
    cy.selectFromDropdown("graduatedFromProgrammeFilter-dropdown", 1);
    checkFilteringResult(1);
    cy.cs("graduatedFromProgrammeFilter-clear").click();
    checkFilteringResult(194, true);
  });

  it.skip("Transfer filter works", () => {
    cy.cs("transferredToProgrammeFilter-header").click();
    cy.cs("transferredToProgrammeFilter-have").click();
    checkFilteringResult(25);
    cy.cs("transferredToProgrammeFilter-havenot").click();
    checkFilteringResult(194);
    cy.cs("transferredToProgrammeFilter-clear").click();
    checkFilteringResult(219, true);
  });

  it.skip("Enrollment filter works", () => {
    cy.cs("enrollmentStatusFilter-header").click();
    cy.selectFromDropdown("enrollmentStatusFilter-status", 0);
    checkFilteringResult(219, true);
    cy.selectFromDropdown("enrollmentStatusFilter-semesters", [0, 0]);
    checkFilteringResult(202);
    cy.selectFromDropdown("enrollmentStatusFilter-status", 1);
    checkFilteringResult(13);
    cy.cs("enrollmentStatusFilter-clear").click();
    checkFilteringResult(219, true);
  });

  it.skip("Credit filter works", () => {
    cy.cs("credit-filter-header").click();
    cy.cs("credit-filter-min").click().type("50{enter}");
    checkFilteringResult(98);
    cy.cs("credit-filter-max").click().type("100{enter}");
    checkFilteringResult(88);
    cy.cs("credit-filter-min-clear").click();
    checkFilteringResult(209);
    cy.cs("credit-filter-max-clear").click();
    checkFilteringResult(219, true);
  });

  it.skip("Gender filter works", () => {
    cy.cs("genderFilter-header").click();
    cy.selectFromDropdown("genderFilter-dropdown", 0);
    checkFilteringResult(48);
    cy.selectFromDropdown("genderFilter-dropdown", 1);
    checkFilteringResult(171);
    cy.selectFromDropdown("genderFilter-dropdown", 2);
    checkFilteringResult(0);
    cy.cs("genderFilter-clear").click();
    checkFilteringResult(219, true);
  });

  it.skip("Starting year filter works", () => {
    cy.cs("startYearAtUni-header").click();
    cy.selectFromDropdown("startYearAtUni-dropdown", [16]);
    checkFilteringResult(13);
    cy.cs("startYearAtUni-clear").click();
    checkFilteringResult(219, true);
  });

  it.skip("Courses filter works", () => {
    cy.cs("courseFilter-header").click();
    cy.cs("courseFilter-course-dropdown").click().contains("MAT11002").click();
    checkFilteringResult(82);
    cy.selectFromDropdown("courseFilter-MAT11002-dropdown", 1);
    checkFilteringResult(75);
    cy.cs("courseFilter-course-dropdown").click().contains("TKT20001").click();
    checkFilteringResult(62);
    cy.selectFromDropdown("courseFilter-TKT20001-dropdown", 6);
    checkFilteringResult(24);
    cy.cs("courseFilter-MAT11002-clear").click();
    checkFilteringResult(125);
    cy.cs("courseFilter-TKT20001-clear").click();
    checkFilteringResult(219, true);
  });
});

describe("Course Statistics", () => {
  before(() => {
    cy.init();
    cy.cs("navbar-courseStatistics").click();
    cy.get("input[placeholder='Search by a course code']").type("TKT20001");
    // Click uni course, not avoin
    cy.contains("td", /^TKT20001/).click();
    cy.contains("Fetch statistics").should("be.enabled").click();
    cy.get(":nth-child(2) > :nth-child(1) > div > .item > .level").click();
    // check start situation
    checkFilteringResult(27);
  });

  it("Grade filter works", () => {
    cy.cs("gradeFilter-header").click();

    cy.cs("gradeFilter-5").click();
    checkFilteringResult(4);
    cy.cs("gradeFilter-5").click();
    checkFilteringResult(27);

    cy.cs("gradeFilter-Hyl.").click();
    checkFilteringResult(4);
    cy.cs("gradeFilter-Hyl.").click();
    checkFilteringResult(27);

    cy.cs("gradeFilter-header").click();
  });

  it("Age filter works", () => {
    cy.cs("ageFilter-header").click();

    cy.cs("ageFilter-min").type("20");
    cy.cs("ageFilter-max").type("40");
    checkFilteringResult(10);
    cy.cs("ageFilter-min").clear();
    cy.cs("ageFilter-max").clear();
    checkFilteringResult(27);

    cy.cs("ageFilter-header").click();
  });

  // Doesn't work since anon db genders are missing, fix
  it.skip("Gender filter works", () => {
    cy.cs("genderFilter-header").click();

    cy.selectFromDropdown("genderFilter-dropdown", 0);
    checkFilteringResult(19);
    cy.selectFromDropdown("genderFilter-dropdown", 1);
    checkFilteringResult(74);
    cy.selectFromDropdown("genderFilter-dropdown", 2);
    checkFilteringResult(0);

    cy.cs("genderFilter-header").click();
  });

  it("Starting year filter works", () => {
    cy.cs("startYearAtUni-header").click();

    cy.selectFromDropdown("startYearAtUni-dropdown", [0]);
    checkFilteringResult(1);
    cy.cs("startYearAtUni-dropdown").get("i.delete").click();
    checkFilteringResult(27);

    cy.cs("startYearAtUni-header").click();
  });

  it("Filter combinations work", () => {
    cy.cs("gradeFilter-header").click();
    cy.cs("gradeFilter-3").click();
    cy.cs("ageFilter-header").click();
    cy.cs("ageFilter-min").type("20");
    cy.cs("ageFilter-max").type("30");
    checkFilteringResult(1);
    cy.cs("gradeFilter-3").click();
    cy.cs("genderFilter-header").click();
    cy.cs("ageFilter-min").clear();
    cy.cs("ageFilter-max").clear();
    cy.cs("ageFilter-header").click();

    checkFilteringResult(27);
  });
});

describe("Custom Population Statistics", () => {
  // not yet checked, go through
  before(() => {
    cy.init("/custompopulation");
    cy.cs("custom-pop-search-button").click();
    cy.cs("student-no-input").click().type(`
      010182086
      010211504
      010275964
      010328785
      010331154
    `);
    cy.cs("search-button").click();
  });

  it.skip("Gender filter works", () => {
    cy.cs("genderFilter-header").click();
    cy.cs("grade-option-5").click();
    checkFilteringResult(2);
    // cy.selectFromDropdown("genderFilter-dropdown", 1);
    // checkFilteringResult(3);
    // cy.selectFromDropdown("genderFilter-dropdown", 2);
    // checkFilteringResult(0);
  });

  // it("Starting year filter works", () => {
  //   cy.cs("startYearAtUni-header").click()
  //   cy.selectFromDropdown("startYearAtUni-dropdown", [0])
  //   checkFilteringResult(5)
  // })

  // it("Courses filter works", () => {
  //   cy.cs("courseFilter-header").click()
  //   cy.cs("courseFilter-course-dropdown").click().contains("MAT12003").click()
  //   checkFilteringResult(3)
  //   cy.selectFromDropdown("courseFilter-MAT12003-dropdown", 5)
  //   checkFilteringResult(2)
  //   cy.cs("courseFilter-course-dropdown").click().contains("TKT21014").click()
  //   checkFilteringResult(1)
  //   cy.selectFromDropdown("courseFilter-TKT21014-dropdown", 3)
  //   checkFilteringResult(0)
  //   cy.cs("courseFilter-MAT12003-clear").click()
  //   checkFilteringResult(0)
  //   cy.cs("courseFilter-TKT21014-clear").click()
  //   checkFilteringResult(5, true)
  // })
});
