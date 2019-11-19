/// <reference types="Cypress" />

const openCustomPopupForm = () => {
  cy.get("button")
    .contains("Custom population")
    .click();
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
  cy.contains("Add filters");
  cy.contains("Credit accumulation");
  cy.contains("Programme distribution");
  cy.contains("Courses of Population");
  cy.contains("Students");
};

const containsAmountOfStudents = (amount = 0) => {
  cy.contains(`Credit accumulation (for ${amount} students)`);
};

const containsSpecificStudents = (studentnumbers = []) => {
  cy.contains("Students (")
    .siblings()
    .get("button")
    .contains("show")
    .click();

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
    cy.server({
      onAnyRequest: function(route, proxy) {
        if (Cypress.config().baseUrl.includes("http://nginx/")) {
          proxy.xhr.setRequestHeader("uid", "tktl");
          proxy.xhr.setRequestHeader("shib-session-id", "mock-shibboleth");
          proxy.xhr.setRequestHeader("hygroupcn", "grp-oodikone-users");
          proxy.xhr.setRequestHeader("edupersonaffiliation", "asdasd");
        }
      }
    });
    console.log(Cypress.config().baseUrl);
    cy.visit(`${Cypress.config().baseUrl}custompopulation`);
    cy.url().should("include", "/custompopulation");
    cy.get("button").contains("Custom population");
  });

  it("Finds a proper population", () => {
    const testStudentNumbers = ["010623419", "010942404", "010484975"];
    searchFor(testStudentNumbers);
    hasLanded();
    containsAmountOfStudents(3);
    containsSpecificStudents(testStudentNumbers);
  });

  it("Doesn't return non-existing students", () => {
    const testStudentNumbers = ["010623419", "010942404", "123", "x", "-", " "];
    searchFor(testStudentNumbers);
    hasLanded();
    containsAmountOfStudents(2);
    containsSpecificStudents(["010623419", "010942404"]);
  });

  it("Doesn't find empty custom population", () => {
    const testStudentNumbers = ["1", "2", "3"];
    searchFor(testStudentNumbers);
    cy.contains("Add filters").should("not.exist");
    cy.contains("Credit accumulation").should("not.exist");
    cy.contains("Programme distribution").should("not.exist");
    cy.contains("Courses of Population").should("not.exist");
    cy.contains("Students").should("not.exist");
    cy.get("button").contains("Custom population");
  });

  it("Doesn't return students to whom the user doesn't have rights to", () => {
    const kasvatusStudents = ["010102273", "010112616", "010116531"];
    const kapistelyStudents = ["010623419", "010942404", "010484975"];
    loginAs("Normaalikäyttäjä");

    searchFor(kasvatusStudents);
    cy.contains("Add filters").should("not.exist");
    cy.contains("Credit accumulation").should("not.exist");
    cy.contains("Programme distribution").should("not.exist");
    cy.contains("Courses of Population").should("not.exist");
    cy.contains("Students").should("not.exist");

    searchFor(kapistelyStudents.concat(kasvatusStudents));
    hasLanded();
    containsAmountOfStudents(3);
    containsSpecificStudents(kapistelyStudents);
  });
});
