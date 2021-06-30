/// <reference types="Cypress" />

const checkFilteringResult = (studentCount) => {
  cy.contains(`Students (${studentCount})`);
};

// Semantic UI doesn't allow injection of data-cy:s for single multiple dropdown selection.
// This function tries to click "x" on all selections inside dropdown matching given attribute
const clearSemanticUIMultipleDropDownSelection = dataCyAttribute => {
  cy.cs(dataCyAttribute).find("i.delete").click();
}

// Helper tool to create pre and post steps for each filter step. Created to avoid copypasting clicking and checking
// to every it-function. Reason behind using test function wrapper is that Cypresses internal beforeEach / afterEach
// functions don't take any parameters and using global object for matching test step name seemed overcomplicated.
const createRunTestStepWithPreAndPostPartsFunction = amountWithoutFiltering => {
  return (dataCyAttributeOfHeaderToClick, testStepFunctionToRun) => {
    cy.cs(dataCyAttributeOfHeaderToClick).click();
    checkFilteringResult(amountWithoutFiltering);
    testStepFunctionToRun();
    checkFilteringResult(amountWithoutFiltering);
    cy.cs(dataCyAttributeOfHeaderToClick).click();
  }
}

describe("Population Statistics", () => {

  const runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(40)
  before(() => {
    cy.init();
    cy.selectStudyProgramme("Tietojenkäsittelytieteen kandiohjelma");
  });

  it("Graduation filter works", () => {
    runTestStepWithPreAndPostParts("graduatedFromProgrammeFilter-header", () => {
      cy.cs("graduatedFromProgrammeFilter-graduated-true").click()
      checkFilteringResult(10);
      cy.cs("graduatedFromProgrammeFilter-graduated-false").click()
      checkFilteringResult(30);
      cy.cs("graduatedFromProgrammeFilter-all").click()
    })
  });

  // Can't be tested yet, since anon data doesn't provide enough information for this, fix
  it.skip("Transfer filter works", () => {
    cy.cs("transferredToProgrammeFilter-header").click();
    cy.cs("transferredToProgrammeFilter-have").click();
    checkFilteringResult(25);
    cy.cs("transferredToProgrammeFilter-havenot").click();
    checkFilteringResult(194);
    cy.cs("transferredToProgrammeFilter-clear").click();
    checkFilteringResult(219, true);
  });

  it("Enrollment filter works", () => {
    runTestStepWithPreAndPostParts("enrollmentStatusFilter-header", () => {
      cy.selectFromDropdown("enrollmentStatusFilter-status", 0);
      cy.selectFromDropdown("enrollmentStatusFilter-semesters", [0]);
      checkFilteringResult(36);
      clearSemanticUIMultipleDropDownSelection("enrollmentStatusFilter-semesters")
    });
  });

  it("Credit filter works", () => {
    runTestStepWithPreAndPostParts("credit-filter-header", () => {
        cy.cs("credit-filter-min").type("50");
        cy.cs("credit-filter-max").type("150");
        checkFilteringResult(26);
        cy.cs("credit-filter-min").find("input").clear();
        cy.cs("credit-filter-max").find("input").clear();
    });
  });

  it("Age filter works", () => {
    runTestStepWithPreAndPostParts("ageFilter-header", () => {
      cy.cs("ageFilter-min").type("20");
      cy.cs("ageFilter-max").type("40");
      checkFilteringResult(13);
      cy.cs("ageFilter-min").find("input").clear();
      cy.cs("ageFilter-max").find("input").clear();
    })
  });

  // Can't be tested yet, since anon data doesn't provide enough information for this, fix
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

  it("Starting year filter works", () => {
    runTestStepWithPreAndPostParts("startYearAtUni-header", () => {
      cy.selectFromDropdown("startYearAtUni-dropdown", [0]);
      checkFilteringResult(1);
      clearSemanticUIMultipleDropDownSelection("startYearAtUni-dropdown")
    })
  });

  it("Courses filter works", () => {
    runTestStepWithPreAndPostParts("courseFilter-header", () => {
      const courses = ["DATA15001", "MAT11003"]
      cy.cs("courseFilter-course-dropdown").click().contains(courses[0]).click();
      checkFilteringResult(15);
      cy.selectFromDropdown(`courseFilter-${courses[0]}-dropdown`, 1);
      checkFilteringResult(13);
      cy.cs("courseFilter-course-dropdown").click().contains(courses[1]).click();
      checkFilteringResult(9);
      cy.selectFromDropdown(`courseFilter-${courses[1]}-dropdown`, 3);
      checkFilteringResult(1);
      courses.forEach(course => cy.cs(`courseFilter-${course}-clear`).click())
    })
  });
});

describe("Course Statistics", () => {

  const runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(27)
  before(() => {
    cy.init();
    cy.cs("navbar-courseStatistics").click();
    cy.get("input[placeholder='Search by a course code']").type("TKT20001");
    // Click uni course, not avoin
    cy.contains("td", /^TKT20001/).click();
    cy.contains("Fetch statistics").should("be.enabled").click();
    cy.get(":nth-child(2) > :nth-child(1) > div > .item > .level").click();
  });

  it("Grade filter works", () => {
    runTestStepWithPreAndPostParts("gradeFilter-header", () => {
      cy.cs("gradeFilter-5").click();
      checkFilteringResult(4);
      cy.cs("gradeFilter-5").click();
    });
  });

  it("Age filter works", () => {
    runTestStepWithPreAndPostParts("ageFilter-header", () => {
      cy.cs("ageFilter-min").type("20");
      cy.cs("ageFilter-max").type("40");
      checkFilteringResult(10);
      cy.cs("ageFilter-min").find("input").clear();
      cy.cs("ageFilter-max").find("input").clear();
    })
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
    runTestStepWithPreAndPostParts("startYearAtUni-header", () => {
      cy.selectFromDropdown("startYearAtUni-dropdown", [0]);
      checkFilteringResult(1);
      clearSemanticUIMultipleDropDownSelection("startYearAtUni-dropdown")
    })
  });

  it("Filter combinations work", () => {
    runTestStepWithPreAndPostParts("gradeFilter-header", () => {
      runTestStepWithPreAndPostParts("ageFilter-header", () => {
        cy.cs("gradeFilter-3").click();
        cy.cs("ageFilter-min").type("20");
        cy.cs("ageFilter-max").type("30");
        checkFilteringResult(1);
        cy.cs("ageFilter-min").find("input").clear();
        cy.cs("ageFilter-max").find("input").clear();
        cy.cs("gradeFilter-3").click();
      });
    });
  });
});

describe("Custom Population Statistics", () => {
  let runTestStepWithPreAndPostParts;
  before(() => {
    cy.init("/custompopulation");
    cy.cs("custom-pop-search-button").click();
    cy.fixture('customPopulations').then(({studentNumbersForCSStudentsSet1, studentNumbersForCSStudentsSet2}) => {
      const students = [...studentNumbersForCSStudentsSet1, ...studentNumbersForCSStudentsSet2]
      runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(students.length)
      cy.cs("student-no-input").click().type(students.join("/n"));
    })
    cy.cs("search-button").click();
  });


  it("Age filter works", () => {
    runTestStepWithPreAndPostParts("ageFilter-header", () => {
      cy.cs("ageFilter-min").type("20");
      cy.cs("ageFilter-max").type("30");
      checkFilteringResult(1);
      cy.cs("ageFilter-min").find("input").clear();
      cy.cs("ageFilter-max").find("input").clear();
    })
  });

  // Can't be tested yet, since anon data doesn't provide enough information for this, fix
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

  it("Starting year filter works", () => {
    runTestStepWithPreAndPostParts("startYearAtUni-header", () => {
      cy.selectFromDropdown("startYearAtUni-dropdown", [0]);
      checkFilteringResult(1);
      clearSemanticUIMultipleDropDownSelection("startYearAtUni-dropdown")
    })
  });

  // Can't be tested yet, since feature doesn't work correctly
  it.only("Courses filter works", () => {
    runTestStepWithPreAndPostParts("courseFilter-header", () => {
      const courses = ["MAT11001", "TKT20004"]
      cy.cs("courseFilter-course-dropdown").click().contains(courses[0]).click();
      checkFilteringResult(5);
      cy.selectFromDropdown(`courseFilter-${courses[0]}-dropdown`, 1);
      checkFilteringResult(5);
      cy.cs("courseFilter-course-dropdown").click().contains(courses[1]).click();
      checkFilteringResult(3);
      cy.selectFromDropdown(`courseFilter-${courses[1]}-dropdown`, 3);
      checkFilteringResult(1);
      courses.forEach(course => cy.cs(`courseFilter-${course}-clear`).click())
    })
  });
});
