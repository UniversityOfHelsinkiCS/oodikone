
describe('Population Statistics tests', () => {
  Cypress.config('pageLoadTimeout', 100000)

  beforeEach(() => {
    cy.visit("localhost:8081", { timeout: 240000 })
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
      cy.get("tr").eq(3).find(".level").click()
      cy.wait(1000)
      cy.url().should('include', '/coursestatistics')
    })
    cy.contains("DIGI-000A")
    cy.contains("Searched courses").parentsUntil(".segment").contains("digitaidot").should("have.text", "Opiskelijan digitaidot: orientaatio (Keskusta)")
    
    cy.go("back")
    cy.get("button").contains("show").click()
    cy.contains("Student names hidden").click()
    cy.contains("Oinonen").siblings().eq(2).click()
    cy.contains("Oinonen").invoke('text').then((text) => expect(text).to.equal('Oinonen Heidi Eeva Elisabet, 014473717'))
  })

  it('All filters working', () => {
    cy.contains("Select study programme", { timeout: 50000 }).click().siblings().contains("Kasvatustieteiden kandiohjelma").click()
    cy.contains("See population").click()
    cy.wait(5000)

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

    cy.contains("select status").click().siblings().contains("present").click()
    cy.contains("select semesters").click().siblings().contains("Fall 2018").click()
    cy.contains("Spring 2018").click()
    cy.contains("Spring 2018").parentsUntil("form").contains("set filter").click()
    cy.contains("Students that were present").should('have.text', "Students that were present during Fall 2018, Spring 2018")

    checkAmountOfStudents(17)

    cy.contains("have/haven't").click().siblings().contains('haven\'t').click()
    cy.contains('canceled this studyright').parentsUntil('form').contains('set filter').click()
    cy.contains('Excluded students whose').should('have.text', 'Excluded students whose studyright is cancelled')

    checkAmountOfStudents(17)

    cy.contains('have not transfer to').parentsUntil("form").contains("set filter").click()

    checkAmountOfStudents(17)

    cy.contains("Advanced filters").click()

    cy.contains("Save filters as preset").click()
    cy.contains("This filter is saved").siblings().within(() => { cy.get("input").type(`Basic filters-${new Date().getTime()}`, { delay: 0 }) })
    cy.contains("Save current filters as preset").parentsUntil(".dimmer").within(() => { cy.get("button").contains("Save").click() })

    cy.contains("Filters").siblings().within(() => {
      cy.contains(`Basic filters`).parentsUntil("form").get(".remove").click()
    })

    cy.contains("course type").click().siblings().contains("Aineopinnot").click()
    cy.contains("discipline").click().siblings().contains("Kasvatustieteet").click()
    cy.contains("and at least").parentsUntil("form").contains("set filter").click()

    cy.contains("Filters").siblings().within(() => {
      cy.contains('Kehittävä').should('have.text', 'Kehittävä työntutkimus')
      cy.contains('Kvalitatiiviset').should('have.text', 'Kvalitatiiviset tutkimusmenetelmät I')
    })

    checkAmountOfStudents(1)

    removeFilter('Kehittävä')

    cy.contains("select source").click().siblings().contains("Anywhere").click()
    cy.contains("select target").click().siblings().contains("Kasvatustieteiden kandiohjelma").click()
    cy.contains("Students that transferred from").parentsUntil("form").contains("set filter").click()
    cy.contains("Showing students that transferred").should('have.text', 'Showing students that transferred to Kasvatustieteiden kandiohjelma')

    cy.contains('are/not').click().siblings().contains('not').click()
    cy.contains('select graduation').click().siblings().contains('graduated').click()
    cy.contains('select extent').click().siblings().contains('Ylempi korkeakoulututkinto').click()
    cy.contains('Alempi korkeakoulututkinto').parentsUntil("form").contains("set filter").click()

    cy.contains('Excluded students that graduated')

    cy.contains("Students that has").parentsUntil("form").within(() => {
      cy.contains("degree").click().siblings().contains("any degree").click()
      cy.contains("programme").click().siblings().contains("Kasvatustieteiden kandiohjelma")
      cy.contains("priority").click().siblings().contains("primary studies").click()
      cy.contains("set filter").click()
    })

    checkAmountOfStudents(1)

    cy.contains("Basic filters").parentsUntil("form").contains("set filter").click()

    cy.contains("Save filters as preset").click()
    cy.contains("This filter is saved").siblings().within(() => { cy.get("input").type(`Advanced filters-${new Date().getTime()}`, { delay: 0 }) })
    cy.contains("Save current filters as preset").parentsUntil(".dimmer").within(() => { cy.get("button").contains("Save").click() })

    cy.reload()
    cy.contains("Select study programme", { timeout: 50000 }).click().siblings().contains("Kasvatustieteiden kandiohjelma").click()
    cy.contains("See population").click()
    cy.wait(5000)

    cy.contains("add").click()
    cy.contains("Advanced filters").click()

    cy.get('label:contains(Basic filters)').each(($f) => {
      cy.wrap($f).parentsUntil("form").contains("set filter").click()
    })
    cy.get("label:contains(Advanced filters-)").each(($f) => {
      cy.wrap($f).parentsUntil("form").contains("set filter").click()
    })

    cy.get(".header").contains("Filters").siblings().within(() => {
      cy.get("label:contains(Basic filters)").each(($f) => {
        cy.wrap($f).parentsUntil(".segment").within(() => {
          cy.get(".trash").click()
        })
      })
    })
    cy.get("button").contains("Delete for good").click({ force: true })

    cy.contains("Filters").siblings().within(() => {
      cy.get("label:contains(Advanced filters-)").each(($f) => {
        cy.wrap($f).parentsUntil(".segment").within(() => {
          cy.get(".trash").click()
        })
      })
    })
    cy.get("button").contains("Delete for good").click({ force: true })

  })
})