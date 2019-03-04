
describe('Population Statistics tests', () => {
  Cypress.config('pageLoadTimeout', 100000)

  beforeEach(() => {
    cy.visit("localhost:8081")
    cy.contains("Population statistics").click()
    cy.contains("Select study programme", { timeout: 100000 })
  })

  const checkAmountOfStudents = (assertion) => {
    let students = 0
    cy.contains("Credit accumulation").invoke('text').then((text) => {
      students = Number(text.match(/\d+/g)[0])
      expect(students).to.equal(assertion)
    })
    cy.contains("Credit accumulation").siblings().within(() => {
      cy.get(".highcharts-series-group").within(() => {
        cy.get("path").its('length').should('be.equal', (students * 2) + 2) // For each student there should be 2 paths in the graph + 2 for the scrollbar
      })
    })
  }

  it('Population statistics search form is usable', () => {
    cy.contains("See population").should('be.disabled')
    cy.url().should('include', '/populations')
    cy.contains("Search for population")
    cy.get(".populationSearchForm__yearSelect___2w98a").as("enrollmentSelect").contains("Enrollment")

    cy.get("@enrollmentSelect").within(() => {
      cy.get("input").its(`${[0]}.value`).then((beforeVal) => {
        cy.get("input").click()
        cy.get("table").contains("2014-2015").click()
        cy.get("input").should('not.have.value', beforeVal)
      })
    })

    cy.contains("Statistics until").siblings().within(() => {
      cy.get("input").click()
      cy.get("table").contains(`${new Date().getFullYear()}`).click()
      cy.contains("2018").click()
      cy.contains("Oct").click()
      cy.get("input").should("have.value", "October 2018")
    })
    cy.contains("Select study programme").click().siblings().contains("Tietojenkäsittelytieteen koulutusohjelma").click()
    cy.contains("Select degree").click().siblings().contains("Luonnontieteiden kandidaatti")
    cy.get(".toggle").click()
    cy.contains("Exchange students")
    cy.contains("See population").should('be.enabled')
  })

  it('Population statistics is usable on general level', () => {
    cy.contains("Select study programme").click().siblings().contains("Kasvatustieteiden kandiohjelma").click()
    cy.contains("See population").click()
    cy.get(".card").within(() => {
      cy.contains("Kasvatustieteiden kandiohjelma")
      cy.contains("Sample size: 26 students")
      cy.contains("Excludes exchange students")
      cy.contains("Excludes students with cancelled study right")
    })
    cy.contains("add").click()
    cy.contains("Add filters").siblings().within(() => {
      cy.get(".form").should('have.length', 6)
    })

    checkAmountOfStudents(26)

    let filteredStudents = 1328493
    cy.contains("Credits gained during first").parentsUntil(".tab").get("table").within(() => {
      cy.get("tr").eq(1).find("td").eq(1).invoke("text").then(text => filteredStudents = Number(text))
      cy.get("tr").eq(1).click()
    }).then(() => {
      checkAmountOfStudents(filteredStudents)
    })

    cy.contains("Courses of Population").parentsUntil(".ui.segment").parent().within(() => {
      cy.get("tr").its('length').should('be.gte', 10)
    })
    cy.get("button").contains("show").click()
    cy.contains("Student names hidden").click()
    cy.contains("Oinonen").siblings().eq(2).click()
    cy.contains("Oinonen").invoke('text').then((text) => expect(text).to.equal('Oinonen Heidi Eeva Elisabet, 014473717'))
  })

  it.only('All filters working', () => {
    cy.contains("Select study programme").click().siblings().contains("Kasvatustieteiden kandiohjelma").click()
    cy.contains("See population").click()

    cy.contains("add").click()
    cy.contains("Add filters").siblings().within(() => {
      cy.contains("Show only students with credits at least").parentsUntil("form").contains("set filter").should('be.disabled')
        .parentsUntil("form").find("input").type("15")
      cy.contains("Show only students with credits at least").parentsUntil("form").contains("set filter").click()

    })
    cy.contains("Filters").siblings().within(() => {
      cy.contains("Credits at least 15")
    })
    checkAmountOfStudents(24)

    cy.contains("Show only students with credits less than").parentsUntil("form").contains("set filter").should('be.disabled')
      .parentsUntil("form").find("input").type("100")
    cy.contains("Show only students with credits less than").parentsUntil("form").contains("set filter").click()

    checkAmountOfStudents(23)

    cy.contains("started this semester").parentsUntil("form").contains("set filter").click()

    checkAmountOfStudents(17)

    // cy.contains("select status").click().contains("present").click()
    // cy.contains("select semesters").click().contains("Fall 2018").click().contains("Spring 2018").click()
  })

})