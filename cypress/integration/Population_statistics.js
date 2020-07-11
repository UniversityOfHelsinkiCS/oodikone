/// <reference types="Cypress" />

const setPopStatsUntil = (until, includeSettings = []) => {
  cy.contains("Advanced settings").siblings().get('[data-cy=advanced-toggle]').click()
  includeSettings.forEach(setting => {
    cy.contains("Advanced settings").parent().siblings().contains(setting).click()
  })
  cy.get(".adv-stats-until > .form-control").click().clear().type(until)
  cy.contains("Fetch population with new settings").click()
  cy.contains("Advanced settings")
}

describe('Population Statistics tests', () => {
  beforeEach(() => {
    cy.init()
    cy.contains("Study programme").click().siblings().contains("Search by class").click()
    cy.contains("Select study programme")
  })

  const checkAmountOfStudents = (assertion) => {
    let students = 0
    cy.contains("Credit accumulation").click().invoke('text').then((text) => {
      students = Number(text.match(/\d+/g)[0])
      expect(students).to.equal(assertion)
    })
    cy.contains("Credit accumulation").click().siblings().within(() => {
      cy.get(".highcharts-series-group").find("path").should('have.length', students ? (students * 2) + 2 : 0) // For each student there should be 2 paths in the graph + 2 for the scrollbar
    })
  }

  it('Population statistics search form is usable', () => {
    cy.contains("See population").should('be.disabled')
    cy.url().should('include', '/populations')
    cy.contains("Search for population")
    cy.contains("Class of").parent().within(() => {
      cy.get(".form-control").as("enrollmentSelect")
    })

    cy.get("@enrollmentSelect").its(`${[0]}.value`).then((beforeVal) => {
      cy.get("@enrollmentSelect").click()
      // go back to 2010-2019
      cy.get(".yearSelectInput .rdtPrev").click({ force: true })
      cy.get(".yearSelectInput table").contains("2014-2015").click({ force: true })
      cy.get("@enrollmentSelect").should('not.have.value', beforeVal)
    })

    cy.contains("Select study programme").click().siblings().contains("Tietojenkäsittelytieteen koulutusohjelma").click()
    cy.contains("Select degree").click().siblings().contains("Luonnontieteiden kandidaatti")
  })

  it('Population statistics is usable on general level', () => {
    cy.contains("Select study programme").click().siblings().contains("Tietojenkäsittelytieteen maisteriohjelma").click()
    cy.contains("See population").click()
    setPopStatsUntil('September 2019')

    cy.get(".card").within(() => {
      cy.contains("Tietojenkäsittelytieteen maisteriohjelma")
      cy.contains("Sample size: 29 students")
      cy.contains("Excludes exchange students")
      cy.contains("Excludes students who haven't enrolled present nor absent")
    })
    cy.contains("Courses of population").click({ force: true })
    cy.contains("Courses of population").parent().within(() => {
      cy.get("tr").its('length').should('be.gte', 10)
      cy.route('/api/v3/courseyearlystats**').as('coursePage')
      cy.contains("Laskennan mallit")
      cy.get(':nth-child(2) > .iconCell > p > .item > .level').click({ force: true })
      cy.wait('@coursePage')
      cy.url().should('include', '/coursestatistics')
    })
    cy.contains("TKT20005")
    cy.go("back")
    cy.contains("Ohjelmoinnin perusteet")
    cy.contains("Courses of population").click().parent().within(() => {
      cy.contains("Ohjelmoinnin perusteet").siblings().eq(4).should("have.text", "15")
    })

    checkAmountOfStudents(29)

    let filteredStudents = 1328493
    cy.contains("Credit statistics").click()
    cy.contains("Credits Gained During First").parentsUntil(".tab").get("table").within(() => {
      cy.get("tr").eq(2).find("td").eq(2).invoke("text").then(text => filteredStudents = Number(text))
      cy.route('POST', '/api/v2/populationstatistics/courses**').as('courseData')
      cy.get("tr").eq(2).find('.filter').click()
      cy.wait('@courseData')
    }).then(() => {
      checkAmountOfStudents(filteredStudents)
    })
    cy.contains("Courses of population").click({ force: true })
    cy.contains("Courses of population").parent().within(() => {
      cy.contains("Ohjelmoinnin perusteet").siblings().eq(5).should("have.text", "0")
    })

    cy.contains("Students (1)").click()
    cy.contains("Student names hidden").click()
    cy.contains("Luoto").siblings().eq(2).click()
    cy.contains("Luoto").invoke('text').then((text) => expect(text).to.equal('Luoto Veli-Matti, 014824094'))

    cy.go("back")
    cy.contains("Advanced settings")
  })

  it('Student list checking works as intended', () => {
    cy.contains("Select study programme").click().siblings().contains("Tietojenkäsittelytieteen maisteriohjelma").click()
    cy.contains("See population").click()
    cy.contains("Students (29)").click()
    cy.contains("010111264")
    cy.contains("666666666").should('not.exist')
    cy.contains('button', "Check studentnumbers").click()
    cy.contains('Check for studentnumbers')
    cy.get('textarea').type("010111264").type('{enter}').type("666666666")
    cy.contains('button', 'check students').click()
    cy.contains('#checkstudentsresults', 'Results').within(e => {
      cy.contains('Student numbers in list and in oodi').click()
      cy.contains('#found', '010111264')
      cy.contains('Student numbers in list but not in oodi').click()
      cy.contains('#notfound', '666666666')
      cy.contains('Student numbers in oodi but not in list').click()
      cy.contains('#notsearched', '010533091')
    })
  })

  it('Population statistics wont crash course population', () => {
    cy.contains("Select study programme").click().siblings().contains("Tietojenkäsittelytieteen maisteriohjelma").click()
    cy.contains("See population").click()
    cy.contains("Courses of population").click({ force: true })
    cy.get(':nth-child(3) > .iconCell > p > .item > .level').click({ force: true })
    cy.get(':nth-child(3) > :nth-child(1) > div > .item > .level').click({ force: true })
  })

  it("Empty 'mandatory courses' tab has a link to the page where mandatory courses can be added", () => {
    cy.contains("Select study programme").click().siblings().contains("Kielten kandiohjelma").click()
    cy.contains("See population").click()
    cy.contains("Students (5)").click()
    cy.get("[data-cy=student-table-tabs]").contains("Mandatory Courses").click()
    cy.contains("No mandatory courses defined. You can define them here.").find("a").click()
    cy.contains("Kielten kandiohjelma")
    cy.contains("Add courses")
  })

  it("Empty 'tags' tab has a link to the page where tags can be created", () => {
    cy.contains("Select study programme").click().siblings().contains("Kielten kandiohjelma").click()
    cy.contains("See population").click()
    cy.contains("Students (5)").click()
    cy.get("[data-cy=student-table-tabs]").contains("Mandatory Courses").siblings().contains("Tags").click()
    cy.contains("No tags defined. You can define them here.").find("a").click()
    cy.contains("Kielten kandiohjelma")
    cy.contains("Create new tag")
  })
  
  it("Advanced settings work", () => {
    cy.contains("Select study programme").click().siblings().contains("Tietojenkäsittelytieteen kandiohjelma").click()
    cy.contains("See population").click()
    cy.get('[data-cy=advanced-toggle]').click()
    cy.contains('Statistics until')
    // only spring
    cy.get(':nth-child(2) > :nth-child(2) > .ui > label').click({ force: true })
    cy.contains('Fetch population').click()

    cy.contains('Credit accumulation (for 13 students)')

    // only fall
    cy.get(':nth-child(2) > :nth-child(2) > .ui > label').click({ force: true })
    cy.get(':nth-child(2) > :nth-child(3) > .ui > label').click({ force: true })
    cy.contains('Fetch population').click()

    cy.contains('Credit accumulation (for 206 students)')

    // spring + fall and include cancelled
    cy.get(':nth-child(2) > :nth-child(3) > .ui > label').click({ force: true })
    cy.get(':nth-child(3) > :nth-child(3) > .ui > label').click({ force: true })
    cy.contains('Fetch population').click()

    cy.contains('Credit accumulation (for 228 students)')
  })
  
  it("Credit Statistics, Statistics pane works", () => {
    cy.contains("Select study programme").click().siblings().contains("Tietojenkäsittelytieteen kandiohjelma").click()
    cy.contains("See population").click()
    cy.contains("Credit statistics").click()
    cy.get("[data-cy='credit-stats-tab'] > .menu > :nth-child(2)").click()

    cy.get("[data-cy='credit-stats-table-name-header']").should('contain', 'Statistic for n = 219 Students')
    cy.get("[data-cy='credit-stats-mean']").should('contain', '44.36')
    cy.get("[data-cy='credit-stats-stdev']").should('contain', '30.77')
    cy.get("[data-cy='credit-stats-min']").should('contain', '0')
    cy.get("[data-cy='credit-stats-q1']").should('contain', '17')
    cy.get("[data-cy='credit-stats-q2']").should('contain', '46')
    cy.get("[data-cy='credit-stats-q3']").should('contain', '66')
    cy.get("[data-cy='credit-stats-max']").should('contain', '137')
  })
})
