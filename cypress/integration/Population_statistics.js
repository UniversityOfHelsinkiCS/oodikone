/// <reference types="Cypress" />

const setPopStatsUntil = (until) => {
  cy.contains("Advanced settings").siblings().get('.toggle').click()
  cy.contains("Statistics until").siblings().get('.rdt').get('input').eq(1).click().clear().type(until)
  cy.contains("Fetch population with new settings").click()
}

describe('Population Statistics tests', () => {
  beforeEach(() => {
    cy.server({
      onAnyRequest: function (route, proxy) {
        if (Cypress.config().baseUrl.includes("http://nginx/")) {
          proxy.xhr.setRequestHeader('uid', 'tktl')
          proxy.xhr.setRequestHeader('shib-session-id', 'mock-shibboleth')
          proxy.xhr.setRequestHeader('hygroupcn', 'grp-oodikone-users')
          proxy.xhr.setRequestHeader('edupersonaffiliation', 'asdasd')
        }
      }
    })
    console.log(Cypress.config().baseUrl)
    cy.visit(Cypress.config().baseUrl)
    cy.contains("Study programme").click().siblings().contains("Search by class").click()
    cy.contains("Select study programme")
  })

  const checkAmountOfStudents = (assertion) => {
    let students = 0
    cy.contains("Credit accumulation").invoke('text').then((text) => {
      students = Number(text.match(/\d+/g)[0])
      expect(students).to.equal(assertion)
    })
    cy.contains("Credit accumulation").siblings().within(() => {
      cy.get(".highcharts-series-group").find("path").should('have.length', students ? (students * 2) + 2 : 0) // For each student there should be 2 paths in the graph + 2 for the scrollbar
    })
  }

  const removeFilter = (text) => {
    cy.contains("Filters").siblings().within(() => {
      cy.contains(text).parent().within(() => {
        cy.get(".remove").click()
      })
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
      cy.get("table").contains("2014-2015").click()
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
      cy.contains("Excludes students with cancelled study right")
    })

    cy.contains("Courses of Population").parentsUntil(".ui.segment").parent().within(() => {
      cy.get("tr").its('length').should('be.gte', 10)
      cy.route('/api/v3/courseyearlystats**').as('coursePage')
      cy.contains("Laskennan mallit")
      cy.get(':nth-child(2) > .iconCell > p > .item > .level').click({ force: true })
      cy.wait('@coursePage')
      cy.url().should('include', '/coursestatistics')
    })
    cy.contains("TKT20005")
    cy.go("back")

    cy.contains("Courses of Population").parentsUntil(".ui.segment").parent().within(() => {
      cy.contains("Ohjelmoinnin perusteet").siblings().eq(2).should("have.text", "15")
    })

    cy.contains("add").click()
    cy.contains("Add filters").siblings().within(() => {
      cy.get(".form").should('have.length', 9)
    })

    checkAmountOfStudents(29)

    let filteredStudents = 1328493
    cy.contains("Credits gained during first").parentsUntil(".tab").get("table").within(() => {
      cy.get("tr").eq(2).find("td").eq(1).invoke("text").then(text => filteredStudents = Number(text))
      cy.route('POST', '/api/v2/populationstatistics/courses**').as('courseData')
      cy.get("tr").eq(2).click()
      cy.wait('@courseData')
    }).then(() => {
      checkAmountOfStudents(filteredStudents)
    })

    cy.contains("Courses of Population").parentsUntil(".ui.segment").parent().within(() => {
      cy.contains("Ohjelmoinnin perusteet").siblings().eq(2).should("have.text", "1")
    })

    cy.contains("button", "show").click()
    cy.contains("Student names hidden").click()
    cy.contains("Luoto").siblings().eq(2).click()
    cy.contains("Luoto").invoke('text').then((text) => expect(text).to.equal('Luoto Veli-Matti, 014824094'))
  })

  it('Student list checking works as intended', () => {
    cy.contains("Select study programme").click().siblings().contains("Tietojenkäsittelytieteen maisteriohjelma").click()
    cy.contains("See population").click()
    cy.contains("button", "show").click()
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

  it('All filters working', () => {
    cy.contains("Select study programme", { timeout: 50000 }).click().siblings().contains("Tietojenkäsittelytieteen maisteriohjelma").click()
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
    checkAmountOfStudents(23)

    cy.contains("Show only students with credits less than").parentsUntil("form").contains("set filter").should('be.disabled')
      .parentsUntil("form").find("input").type("100")
    cy.contains("Show only students with credits less than").parentsUntil("form").contains("set filter").click()

    checkAmountOfStudents(22)

    cy.contains("chosen semester").parentsUntil("form").contains("set filter").click()

    checkAmountOfStudents(11)

    cy.contains("select status").click().siblings().contains("present").click()
    cy.contains("select semesters").click().siblings().contains("Fall 2018").click()
    cy.contains("Spring 2018").click()
    cy.contains("Spring 2018").parentsUntil("form").contains("set filter").click()
    cy.contains("Students that were present").should('have.text', "Students that were present during Fall 2018, Spring 2018")
    cy.get(':nth-child(7) > .form > .inline > :nth-child(2) > .ui > .default').click().siblings().contains('have not').click()

    checkAmountOfStudents(11)

    cy.contains("have/haven't").click().siblings().contains('haven\'t').click()
    cy.contains('canceled this studyright').parentsUntil('form').contains('set filter').click()
    cy.contains('Excluded students whose').should('have.text', 'Excluded students whose studyright is cancelled')

    checkAmountOfStudents(11)

    cy.contains('transferred to').parentsUntil("form").contains("set filter").click()

    checkAmountOfStudents(11)

    cy.contains("Students that").parentsUntil("form").contains("set filter").click()
    cy.contains('Showing students that have not graduated from Tietojenkäsittelytieteen maisteriohjelma')
    checkAmountOfStudents(11)

    cy.contains("Advanced filters").click()

    cy.contains("Save filters as preset").click()
    cy.contains("This filter is saved").siblings().within(() => { cy.get("input").type(`Basic filters-${new Date().getTime()}`, { delay: 0 }) })
    cy.contains("Save current filters as preset").parentsUntil(".dimmer").within(() => { cy.get("button").contains("Save").click() })

    cy.contains("Filters").siblings().within(() => {
      cy.contains(`Basic filters`).parentsUntil("form").get(".remove").click()
    })

    cy.contains("course type").click().siblings().contains("Aineopinnot").click()
    cy.contains("discipline").click().siblings().contains("Tietojenkäsittelytiede").click()
    cy.contains("and at least").parentsUntil("form").contains("set filter").click()

    checkAmountOfStudents(0)

    cy.get('.filter-segment').its('length')
      .then(originalLength => {
        cy.contains('.filter-segment', 'Laskennan mallit').should('exist')
        removeFilter('Laskennan mallit')
        cy.get('.filter-segment').should('have.length', originalLength - 1)
      })

    cy.contains("select source").click().siblings().contains("Anywhere").click()
    cy.contains("select target").click().siblings().contains("Tietojenkäsittelytieteen maisteriohjelma").click()
    cy.contains("Students that transferred from").parentsUntil("form").contains("set filter").click()
    cy.contains("Showing students that transferred").should('have.text', 'Showing students that transferred to Tietojenkäsittelytieteen maisteriohjelma')

    cy.contains('are/not').click().siblings().contains('not').click()
    cy.contains('select graduation').click().siblings().contains('graduated').click()
    cy.contains('select extent').click().siblings().contains('Ylempi korkeakoulututkinto').click()
    cy.contains('Alempi korkeakoulututkinto').parentsUntil("form").contains("set filter").click()

    cy.contains('Excluded students that graduated')

    cy.contains("Students that has").parentsUntil("form").within(() => {
      cy.contains("degree").click().siblings().contains("any degree").click()
      cy.contains("programme").click().siblings().contains("Tietojenkäsittelytieteen maisteriohjelma")
      cy.contains("priority").click().siblings().contains("primary studies").click()
      cy.contains("set filter").click()
    })

    checkAmountOfStudents(0)

    cy.contains("Basic filters").parentsUntil("form").contains("set filter").click()

    cy.contains("Save filters as preset").click()
    cy.contains("This filter is saved").siblings().within(() => { cy.get("input").type(`Advanced filters-${new Date().getTime()}`, { delay: 0 }) })
    cy.contains("Save current filters as preset").parentsUntil(".dimmer").within(() => { cy.get("button").contains("Save").click() })

    cy.visit("/populations")
    cy.contains("Select study programme", { timeout: 50000 }).click().siblings().contains("Tietojenkäsittelytieteen maisteriohjelma").click()
    cy.contains("See population").click()

    cy.contains("add").click()
    cy.contains("Advanced filters").click()

    cy.get('label:contains(Basic filters)').each(($f) => {
      cy.wrap($f).parentsUntil("form").contains("set filter").click()
    })
    cy.get("label:contains(Advanced filters-)").each(($f) => {
      cy.wrap($f).parentsUntil("form").contains("set filter").click()
    })

    cy.get("label:contains(Basic filters)").each(($f) => {
      cy.wrap($f).parentsUntil(".segment").within(() => {
        cy.get(".trash").click()
      })
      cy.root().get("button").contains("Delete for good").click({ force: true })
    })

    cy.get("label:contains(Advanced filters-)").each(($f) => {
      cy.wrap($f).parentsUntil(".segment").within(() => {
        cy.get(".trash").click()
      })
      cy.root().get("button").contains("Delete for good").click({ force: true })
    })
  })
  it('Population statistics wont crash course population', () => {
    cy.contains("Select study programme").click().siblings().contains("Tietojenkäsittelytieteen maisteriohjelma").click()
    cy.contains("See population").click()
    cy.get(':nth-child(3) > .iconCell > p > .item > .level').click({ force: true })
    cy.get(':nth-child(3) > :nth-child(1) > div > .item > .level').click({ force: true })
  })
})
