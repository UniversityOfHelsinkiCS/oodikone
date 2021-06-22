/// <reference types="Cypress" />

const openCustomPopupForm = () => {
  cy.get("button")
    .contains("Custom population")
    .click();
};

const fillName = () => {
  const name = `TEST-${new Date().getTime()}`;
  cy.contains("Insert name for this custom population if you wish to save it")
    .siblings()
    .get("input[placeholder=name]")
    .type(name);
  return name;
};

const save = () => {
  cy.get("button")
    .contains("Save")
    .click();
};

const selectSavedPopulation = name => {
   cy.get('[data-cy="history-search"]').children().eq(0).type(name).type("{enter}");
};

const deleteAllSearches = () => {
  cy.get('[data-cy="history-search"]').children().eq(0).click();
  cy.contains("Saved populations")
    .parent()
    .parent()
    .parent()
    .parent()
    .get(".dropdown")
    .then(d => {
      const searchItems = d.find("div[role=option] > span[class=text]");
      for (let i = 0; i < searchItems.length; i++) {
        if (searchItems[i].textContent.includes("TEST-")) {
          cy.get('[data-cy="history-search"]').children().eq(0).type(searchItems[i].textContent).type("{enter}");
          cy.get("button")
            .contains("Delete")
            .click();
        }
      }
    });
};

const fillForm = content => {
  cy.contains("Insert studentnumbers you wish to use for population here")
    .siblings()
    .get("textarea")
    .type(content.join("\n"));
};

const search = () => {
  cy.get("button")
    .contains("Search population")
    .click();
};

const searchFor = studentnumbers => {
  openCustomPopupForm();
  fillForm(studentnumbers);
  search();
};

const hasLanded = () => {
  cy.contains("Credit accumulation");
  cy.contains("Programme distribution");
  cy.contains("Courses of population");
  cy.contains("Students");
};

const containsAmountOfStudents = (amount = 0) => {
  cy.contains(`Credit accumulation (for ${amount} students)`);
};

const containsSpecificStudents = (studentnumbers = []) => {
  cy.contains(`Students (${studentnumbers.length})`).click();

  studentnumbers.forEach(s => cy.contains(s));
};

const loginAs = username => {
  cy.contains("Users").click();
  cy.contains(username)
    .siblings()
    .contains("Edit")
    .click();
  cy.get(".spy").click();
  cy.visit(`${Cypress.config().baseUrl}custompopulation`);
  cy.url().should("include", "/custompopulation");
  cy.contains("Custom population");
};

describe("Custom population tests", () => {
  beforeEach(() => {
    cy.init('custompopulation')
    cy.url().should("include", "/custompopulation");
    cy.contains("Custom population");
  });

  after(() => {
    cy.visit(`${Cypress.config().baseUrl}custompopulation`);
    cy.url().should("include", "/custompopulation");
    cy.contains("Custom population");
    cy.get("button")
      .contains("Custom population")
      .click();
    deleteAllSearches();
  });

  describe("Custom population searching", () => {
    it("Finds a proper population", () => {
      const testStudentNumbers = ["010623419", "010942404", "010484975"];
      searchFor(testStudentNumbers);
      hasLanded();
      containsAmountOfStudents(3);
      containsSpecificStudents(testStudentNumbers);
    });

    it("Doesn't return non-existing students", () => {
      const testStudentNumbers = [
        "010623419",
        "010942404",
        "123",
        "x",
        "-",
        " "
      ];
      searchFor(testStudentNumbers);
      hasLanded();
      containsAmountOfStudents(2);
      containsSpecificStudents(["010623419", "010942404"]);
    });

    it("Doesn't find empty custom population", () => {
      const testStudentNumbers = ["1", "2", "3"];
      searchFor(testStudentNumbers);
      cy.contains("Credit accumulation").should("not.exist");
      cy.contains("Programme distribution").should("not.exist");
      cy.contains("Courses of population").should("not.exist");
      cy.get("button").contains("Custom population");
    });

    it("Doesn't return students to whom the user doesn't have rights to", () => {
      const kasvatusStudents = ["010102273", "010112616", "010116531"];
      const kapistelyStudents = ["010623419", "010942404", "010484975"];
      loginAs("Normaalikäyttäjä");

      searchFor(kasvatusStudents);
      cy.contains("Credit accumulation").should("not.exist");
      cy.contains("Programme distribution").should("not.exist");
      cy.contains("Courses of population").should("not.exist");

      searchFor(kapistelyStudents.concat(kasvatusStudents));
      hasLanded();
      containsAmountOfStudents(3);
      containsSpecificStudents(kapistelyStudents);
    });
  });

  describe("Custom population search saving", () => {
    it("Saves a custom population search", () => {
      const testStudentNumbers = ["010623419", "010942404", "010484975"];
      openCustomPopupForm();
      const name = fillName();
      fillForm(testStudentNumbers);
      save();

      // Round 1
      selectSavedPopulation(name);
      search();
      cy.contains(`Custom population "${name}"`);
      containsAmountOfStudents(3);
      containsSpecificStudents(testStudentNumbers);

      // Round 2
      cy.visit(`${Cypress.config().baseUrl}custompopulation`);
      cy.url().should("include", "/custompopulation");
      cy.contains("Custom population");
      cy.get("button")
        .contains("Custom population")
        .click();
      selectSavedPopulation(name);
      search();
      cy.contains(`Custom population "${name}"`);
      containsAmountOfStudents(3);
      containsSpecificStudents(testStudentNumbers);
    });

    it("Updates a custom population search", () => {
      const testStudentNumbers = ["010623419", "010942404", "010484975"];
      openCustomPopupForm();
      const name = fillName();
      fillForm(testStudentNumbers);
      save();

      selectSavedPopulation(name);
      search();
      cy.contains(`Custom population "${name}"`);
      containsAmountOfStudents(3);
      containsSpecificStudents(testStudentNumbers);
      cy.contains("Custom population");
      cy.get("button")
        .contains("Custom population")
        .click();
      selectSavedPopulation(name);
      fillForm(["", "011284954"]);
      save();

      cy.visit(`${Cypress.config().baseUrl}custompopulation`);
      cy.url().should("include", "/custompopulation");
      cy.contains("Custom population");
      cy.get("button")
        .contains("Custom population")
        .click();
      selectSavedPopulation(name);
      search();
      cy.contains(`Custom population "${name}"`);
      containsAmountOfStudents(4);
      containsSpecificStudents(testStudentNumbers.concat("011284954"));
    });
  });
});
