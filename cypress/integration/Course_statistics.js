
describe('Course Statistics tests', () => {
  before(() => {
    cy.visit(Cypress.config().baseUrl)
    cy.get(".world").parent().click().contains('fi').click()
  })

  beforeEach(() => {
    cy.server({
      onAnyRequest: function (route, proxy) {
        if (Cypress.config().baseUrl.includes("http://localhost:1337/")) {
          proxy.xhr.setRequestHeader('uid', 'tktl')
          proxy.xhr.setRequestHeader('shib-session-id', 'mock-shibboleth')
          proxy.xhr.setRequestHeader('hygroupcn', 'grp-oodikone-users')
          proxy.xhr.setRequestHeader('edupersonaffiliation', 'asdasd')
        }
      }
    })
    console.log(Cypress.config().baseUrl)
    cy.visit(Cypress.config().baseUrl)
    cy.contains("Course statistics").click()
    cy.contains("Search for courses")
  })

  it('Searching single course having duplicate mappings shows course statistics', () => {
    cy.url().should('include', '/coursestatistics')
    cy.contains("Search for courses")
    cy.get("input[placeholder='Search by entering a course code']").type('TKT20003')
    cy.contains("tr", "TKT20003").click()
    cy.contains("Fetch statistics").should('be.enabled').click()
    cy.contains("Search for courses").should('not.exist')

    cy.contains("Käyttöjärjestelmät")
    cy.contains("TKT20003")
    cy.contains("582640") // old mapped code

    cy.contains(".tabular.menu a", "Table").click()
    cy.contains("All")
    cy.contains(".modeSelectorRow a", "Cumulative").click()
    cy.contains(".modeSelectorRow a", "Student").click()
    cy.contains(".modeSelectorRow a", "Grades").click()

    cy.contains(".tabular.menu a", "Pass rate chart").click()
    cy.get("div.modeSelectorContainer").click()
    cy.contains("svg", "Pass rate chart")

    cy.contains(".tabular.menu a", "Grade distribution chart").click()
    cy.get("div.modeSelectorContainer").click()
    cy.contains("svg", "Grades")

    cy.contains("a", "New query").click()
    cy.contains("Search for courses")
  })

  it('Searching multiple courses having duplicate mappings shows course statistics', () => {
    cy.url().should('include', '/coursestatistics')
    cy.contains("Search for courses")
    cy.get("input[placeholder='Search by entering a course code']").type('TKT')
    cy.contains("tr", "TKT20003").click()
    cy.contains("tr", "TKT10002").click()
    cy.contains("Fetch statistics").should('be.enabled').click()
    cy.contains("Search for courses").should('not.exist')

    cy.contains('.courseNameCell', "Käyttöjärjestelmät").contains("TKT20003").click()
    cy.contains('.courseNameCell', "Ohjelmoinnin perusteet").should('not.exist');
    cy.contains("TKT20003")
    cy.contains("582640") // old mapped code
    cy.contains("Summary").click()

    cy.contains('.courseNameCell', "Ohjelmoinnin perusteet").contains("TKT10002").click()
    cy.contains('.courseNameCell', "Käyttöjärjestelmät").should('not.exist');
    cy.contains("TKT10002")
    cy.contains("581325") // old mapped code
    cy.contains("Summary").click()

    cy.contains("a", "New query").click()
    cy.contains("Search for courses")
  })

})
