/// <reference types="Cypress" />

const baseUrl = Cypress.config().baseUrl

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
  const pathToCSBach2018 = "/populations?months=36&semesters=FALL&semesters=SPRING&studyRights={%22programme%22%3A%22KH50_005%22}&tag&year=2018"
  const defaultAmountOfStudents = 148
  const runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(defaultAmountOfStudents)

  before(() => {
    cy.init();
    cy.visit(baseUrl.concat(pathToCSBach2018));
  });

  it("Transfer filter is on not transferred by default", () => {
    cy.contains("By default only students who have not transferred to this study programme are shown.")
    cy.cs("transferredToProgrammeFilter-havenot").find("input").should("be.checked");
  })

  it("Graduation filter works", () => {
    runTestStepWithPreAndPostParts("graduatedFromProgrammeFilter-header", () => {
      const graduated = 11
      cy.cs("graduatedFromProgrammeFilter-graduated-true").click()
      checkFilteringResult(graduated);
      cy.cs("graduatedFromProgrammeFilter-graduated-false").click()
      checkFilteringResult(defaultAmountOfStudents-graduated);
      cy.cs("graduatedFromProgrammeFilter-all").click()
    })
  });

  it("Transfer filter works", () => {
    runTestStepWithPreAndPostParts("transferredToProgrammeFilter-header", () => {
      const transferred = 1
      cy.cs("transferredToProgrammeFilter-have").click();
      checkFilteringResult(transferred);
      cy.cs("transferredToProgrammeFilter-all").click();
      checkFilteringResult(defaultAmountOfStudents + transferred);
      cy.cs("transferredToProgrammeFilter-havenot").click();
    })
  });

  it("Enrollment filter works", () => {
    runTestStepWithPreAndPostParts("enrollmentStatusFilter-header", () => {
      cy.selectFromDropdown("enrollmentStatusFilter-status", 0);
      cy.selectFromDropdown("enrollmentStatusFilter-semesters", [0]);
      checkFilteringResult(137);
      clearSemanticUIMultipleDropDownSelection("enrollmentStatusFilter-semesters")
    });
  });

  it("Credit filter works", () => {
    runTestStepWithPreAndPostParts("credit-filter-header", () => {
        cy.cs("credit-filter-min").type("50");
        cy.cs("credit-filter-max").type("150");
        checkFilteringResult(116);
        cy.cs("credit-filter-min").find("input").clear();
        cy.cs("credit-filter-max").find("input").clear();
    });
  });

  it("Age filter works", () => {
    runTestStepWithPreAndPostParts("ageFilter-header", () => {
      cy.cs("ageFilter-min").type("20");
      cy.cs("ageFilter-max").type("40");
      checkFilteringResult(43);
      cy.cs("ageFilter-min").find("input").clear();
      cy.cs("ageFilter-max").find("input").clear();
    })
  });

  it("Gender filter works", () => {
    runTestStepWithPreAndPostParts("genderFilter-header", () => {
      cy.selectFromDropdown("genderFilter-dropdown", 0);
      checkFilteringResult(666);
      cy.selectFromDropdown("genderFilter-dropdown", 1);
      checkFilteringResult(666);
      cy.selectFromDropdown("genderFilter-dropdown", 2);
      checkFilteringResult(666);
      cy.selectFromDropdown("genderFilter-dropdown", 3);
      checkFilteringResult(666);
      clearSemanticUIMultipleDropDownSelection("genderFilter-dropdown")
    })
  });

  it("Starting year filter works", () => {
    runTestStepWithPreAndPostParts("startYearAtUni-header", () => {
      cy.selectFromDropdown("startYearAtUni-dropdown", 0);
      checkFilteringResult(1);
      clearSemanticUIMultipleDropDownSelection("startYearAtUni-dropdown")
      cy.selectFromDropdown("startYearAtUni-dropdown", 14);
      checkFilteringResult(121);
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

  it("Filter combinations work", () => {
    runTestStepWithPreAndPostParts("graduatedFromProgrammeFilter-header", () => {
      runTestStepWithPreAndPostParts("ageFilter-header", () => {
        cy.cs("graduatedFromProgrammeFilter-graduated-true").click()
        cy.cs("ageFilter-min").type("20");
        cy.cs("ageFilter-max").type("30");
        checkFilteringResult(11);
        cy.cs("ageFilter-min").find("input").clear();
        cy.cs("ageFilter-max").find("input").clear();
      cy.cs("graduatedFromProgrammeFilter-all").click()
      });
    });
  });
});

describe("Course Statistics", () => {
  const pathToDSAndAlgoSpring2019 = "/coursepopulation?coursecodes=%5B%22TKT20001%22%2C%2258131%22%5D&from=138&separate=true&to=138&years=Kev%C3%A4t%202019"
  const defaultAmountOfStudents = 118
  const runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(defaultAmountOfStudents)

  before(() => {
    cy.init();
    cy.visit(baseUrl.concat(pathToDSAndAlgoSpring2019));
  });

  it("Grade filter works", () => {
    runTestStepWithPreAndPostParts("gradeFilter-header", () => {
      cy.cs("gradeFilter-5").click();
      checkFilteringResult(20);
      cy.cs("gradeFilter-3").click();
      checkFilteringResult(38);
      cy.cs("gradeFilter-3").click();
      cy.cs("gradeFilter-5").click();
    });
  });

  it("Age filter works", () => {
    runTestStepWithPreAndPostParts("ageFilter-header", () => {
      cy.cs("ageFilter-min").type("20");
      cy.cs("ageFilter-max").type("40");
      checkFilteringResult(33);
      cy.cs("ageFilter-min").find("input").clear();
      cy.cs("ageFilter-max").find("input").clear();
    })
  });

  it("Gender filter works", () => {
    runTestStepWithPreAndPostParts("genderFilter-header", () => {
      cy.selectFromDropdown("genderFilter-dropdown", 0);
      checkFilteringResult(666);
      cy.selectFromDropdown("genderFilter-dropdown", 1);
      checkFilteringResult(666);
      cy.selectFromDropdown("genderFilter-dropdown", 2);
      checkFilteringResult(666);
      cy.selectFromDropdown("genderFilter-dropdown", 3);
      checkFilteringResult(666);
      clearSemanticUIMultipleDropDownSelection("genderFilter-dropdown")
    })
  });

  it("Starting year filter works", () => {
    runTestStepWithPreAndPostParts("startYearAtUni-header", () => {
      cy.selectFromDropdown("startYearAtUni-dropdown", [0]);
      checkFilteringResult(1);
      clearSemanticUIMultipleDropDownSelection("startYearAtUni-dropdown")
      cy.selectFromDropdown("startYearAtUni-dropdown", 12);
      checkFilteringResult(29);
      clearSemanticUIMultipleDropDownSelection("startYearAtUni-dropdown")
    })
  });

  it.only("Filter combinations work", () => {
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
  it.skip("Courses filter works", () => {
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
