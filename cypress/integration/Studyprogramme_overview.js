/// <reference types="Cypress" />

const deleteTag = name => {
  cy.contains(name).siblings().contains('Delete').click()
  cy.contains('Are you sure you want to delete tag')
  cy.contains('Confirm').click()
  cy.contains(name).should('not.exist')
}

describe('Studyprogramme overview', () => {
  describe('when opening programme page with basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme/KH50_005')
    })

    // If the backend breaks for one of the sections, the section header is not rendered and this will fail
    it.skip('Basic information -tab loads', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('[data-cy=Section-StudentsOfTheStudyprogramme]')
      cy.get('[data-cy=Section-CreditsProducedByTheStudyprogramme]')
      cy.get('[data-cy=Section-GraduatedAndThesisWritersOfTheProgramme]')
      cy.get('[data-cy=Section-ProgrammesAfterGraduation]')
      cy.get('[data-cy=Section-AverageGraduationTimes]')
    })

    // If the backend breaks for one of the sections, the section header is not rendered and this will fail
    it.skip('Studytracks and student populations -tab loads', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Studytracks and student populations').click()
      cy.get('[data-cy=Section-StudytrackOverview]')
      cy.get('[data-cy=Section-StudytrackProgress]')
      cy.get('[data-cy=Section-AverageGraduationTimes]')
    })

    it('Basic information contains correct students', () => {
      const thisYear = new Date().getFullYear()
      const years = []
      for (let year = thisYear; year > 2021; year--) {
        years.push(year)
      }

      const studentsTableContents = [
        // [Year, All, Started, Graduated, Cancelled, Transferred Away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0]),
        [2021, 0, 0, 0, 0, 1, 0],
        [2020, 12, 10, 36, 16, 3, 2],
        [2019, 87, 86, 17, 14, 0, 1],
        [2018, 161, 162, 1, 3, 0, 0],
        [2017, 171, 173, 0, 0, 0, 0],
      ]

      cy.checkTableStats(studentsTableContents, 'StudentsOfTheStudyprogramme')
    })

    it('Basic information contains correct credits', () => {
      const thisYear = new Date().getFullYear()
      const years = []
      for (let year = thisYear; year > 2021; year--) {
        years.push(year)
      }

      const creditTableContents = [
        // [Year, Total, Major credits, Non-major credits, Transferred credits]
        ...years.map(year => [year, 0, 0, 0, 0]),
        [2021, 0, 0, 0, 0],
        [2020, 4928, 548, 4213, 167],
        [2019, 7737, 1644, 5744, 349],
        [2018, 6730, 1820, 4638, 272],
        [2017, 2900, 788, 1724, 388],
      ]

      cy.checkTableStats(creditTableContents, 'CreditsProducedByTheStudyprogramme')
    })

    it('can create and delete tags for population', () => {
      const name = `tag-${new Date().getTime()}`
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Tags').click()
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2018')
      cy.contains('Create new tag').click()
      cy.contains(name)
      cy.contains('2018')
      deleteTag(name)
    })

    it('can create personal tags', () => {
      const name = `tag-${new Date().getTime()}`
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Tags').click()
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2018')

      cy.get('.ui > label').click()
      cy.contains('Create new tag').click()
      cy.contains(name)
      deleteTag(name)
    })

    it('can add tags to students', () => {
      const name = `tag-${new Date().getTime()}`

      const student = '010113437'

      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Tags').click()
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2018')
      cy.contains('Create new tag').click()
      cy.contains(name)

      cy.contains('Add tags to students').click()
      cy.get('.form > .field > .dropdown').click().get('.ui > .search').type(name).click()

      cy.get('.form > .field > .dropdown > .visible').contains(name).click()

      cy.get('textarea').type('010113437')
      cy.get('.positive').click()

      cy.contains('Student statistics').click()
      cy.get('.prompt').type(student)
      cy.contains(student).click()
      cy.contains(name)

      cy.go('back')
      cy.go('back')

      deleteTag(name)

      cy.contains('Student statistics').click()
      cy.get('.prompt').type(student)
      cy.contains(student).click()
      cy.contains(name).should('not.exist')
    })
  })
})
