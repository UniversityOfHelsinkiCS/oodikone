/// <reference types="Cypress" />

const deleteTag = name => {
  cy.contains(name).siblings().contains('Delete').click()
  cy.contains('Are you sure you want to delete tag')
  cy.contains('Confirm').click()
  cy.contains(name).should('not.exist')
}

const getEmptyYears = isAcademicYear => {
  const thisYear = new Date().getFullYear()
  const years = []
  for (let year = thisYear; year > 2021; year--) {
    if (isAcademicYear) {
      years.push(`${year} - ${year + 1}`)
    } else {
      years.push(year)
    }
  }
  return years
}

describe('Studyprogramme overview', () => {
  describe('when opening programme page with basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
    })

    /* Basic information overview -tests*/

    // If the backend breaks for one of the sections, the section header is not rendered and this will fail
    it('Basic information -tab loads', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('[data-cy=Section-StudentsOfTheStudyprogramme]')
      cy.get('[data-cy=Section-CreditsProducedByTheStudyprogramme]')
      cy.get('[data-cy=Section-GraduatedAndThesisWritersOfTheProgramme]')
      cy.get('[data-cy=Section-ProgrammesAfterGraduation]')
      cy.get('[data-cy=Section-AverageGraduationTimes]')
    })

    it('Basic information contains correct students', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Started, Graduated, Cancelled, Transferred Away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        [2021, 0, 0, 0, 1, 0],
        [2020, 10, 36, 16, 3, 2],
        [2019, 86, 17, 14, 0, 1],
        [2018, 162, 1, 3, 0, 0],
        [2017, 173, 0, 0, 0, 0],
      ]

      cy.checkTableStats(tableContents, 'StudentsOfTheStudyprogramme')
    })

    it('Basic information contains correct credits', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Total, Major credits, Non-major credits, Transferred credits]
        ...years.map(year => [year, 0, 0, 0, 0]),
        [2021, 0, 0, 0, 0],
        [2020, 4928, 548, 4213, 167],
        [2019, 7737, 1644, 5744, 349],
        [2018, 6730, 1820, 4638, 272],
        [2017, 2900, 788, 1724, 388],
      ]

      cy.checkTableStats(tableContents, 'CreditsProducedByTheStudyprogramme')
    })

    it('Basic information contains correct thesis writers and graduates', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2021, 0, 0],
        [2020, 36, 35],
        [2019, 17, 25],
        [2018, 1, 5],
        [2017, 0, 0],
      ]

      cy.checkTableStats(tableContents, 'GraduatedAndThesisWritersOfTheProgramme')
    })

    it('Special studyrights can be excluded and basic data changes accordingly', () => {
      cy.contains('Tietojenkäsittelytieteen maisteriohjelma').click()
      cy.get('[data-cy=StudentToggle]').click()
      const years = getEmptyYears()
      const studentTableContents = [
        // [Year, Started, Graduated]
        ...years.map(year => [year, 0, 0]),
        [2021, 0, 0],
        [2020, 22, 0],
        [2019, 12, 0],
        [2018, 0, 0],
        [2017, 0, 0],
      ]

      cy.checkTableStats(studentTableContents, 'StudentsOfTheStudyprogramme')

      const creditTableContents = [
        // [Year, Total, Major students credits, Transferred credits]
        ...years.map(year => [year, 0, 0, 0]),
        [2021, 0, 0, 0],
        [2020, 117.5, 0, 7.5],
        [2019, 67, 0, 0],
        [2018, 0, 0, 0],
        [2017, 0, 0, 0],
      ]

      cy.checkTableStats(creditTableContents, 'CreditsProducedByTheStudyprogramme')

      const graduatedTableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2021, 0, 0],
        [2020, 0, 0],
        [2019, 0, 0],
        [2018, 0, 0],
        [2017, 0, 0],
      ]

      cy.checkTableStats(graduatedTableContents, 'GraduatedAndThesisWritersOfTheProgramme')
    })

    it('Year can be changed to academic year, and data changes accordingly', () => {
      cy.contains('Tietojenkäsittelytieteen maisteriohjelma').click()
      cy.get('[data-cy=YearToggle]').click()
      const isAcademicYear = true
      const years = getEmptyYears(isAcademicYear)
      const studentTableContents = [
        // [Year, Started, Graduated, Cancelled, Transferred away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        ['2021 - 2022', 0, 0, 0, 0, 0],
        ['2020 - 2021', 5, 0, 1, 0, 0],
        ['2019 - 2020', 27, 0, 1, 0, 0],
        ['2018 - 2019', 4, 0, 0, 0, 0],
        ['2017 - 2018', 0, 0, 0, 0, 0],
      ]

      cy.checkTableStats(studentTableContents, 'StudentsOfTheStudyprogramme')

      const creditTableContents = [
        // [Year, Total, Major students credits, Non-major students credits, Transferred credits]
        ...years.map(year => [year, 0, 0, 0, 0]),
        ['2021 - 2022', 0, 0, 0, 0],
        ['2020 - 2021', 0, 0, 0, 0],
        ['2019 - 2020', 338.5, 0, 331, 7.5],
        ['2018 - 2019', 173, 0, 173, 0],
        ['2017 - 2018', 42, 0, 42, 0],
      ]

      cy.checkTableStats(creditTableContents, 'CreditsProducedByTheStudyprogramme')
    })

    it('Basic information graphs render', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()

      cy.get('[data-cy=Graph-StudentsOfTheStudyprogramme')
        .should('contain', 'Started')
        .should('contain', 'Graduated')
        .should('contain', 'Transferred away')

      cy.get('[data-cy=Graph-CreditsProducedByTheStudyprogramme')
        .should('contain', 'Major students credits')
        .should('contain', 'Non-major students credits')
        .should('contain', 'Transferred credits')
        .should('contain', 788)
        .should('contain', 1820)

      cy.get('[data-cy=Graph-GraduatedAndThesisWritersOfTheProgramme')
        .should('contain', 'Graduated students')
        .should('contain', 'Wrote thesis')
        .should('contain', 1)
        .should('contain', 5)
        .should('contain', 17)
        .should('contain', 25)
        .should('contain', 36)
        .should('contain', 35)

      cy.get('[data-cy=Graph-ProgrammesAfterGraduation')
        .should('contain', 'Tietojenkäsittelytieteen maisteriohjelma')
        .should('contain', 'Datatieteen maisteriohjelma')
        .should('contain', 'Matematiikan ja tilastotieteen maisteriohjelma')
        .should('contain', 'Kielellisen diversiteetin ja digitaalisten ihmistieteiden maisteriohjelma')
        .should('contain', 1)
        .should('contain', 4)
        .should('contain', 13)
    })

    /* Studytrack overview -tests*/

    // If the backend breaks for one of the sections, the section header is not rendered and this will fail
    it('Studytracks and student populations -tab loads', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Studytracks and student populations').click()
      cy.get('[data-cy=Section-StudytrackOverview]')
      cy.get('[data-cy=Section-StudytrackProgress]')
      cy.get('[data-cy=Section-AverageGraduationTimes]')
    })

    it('Students of the studyprogramme are shown correctly', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Studytracks and student populations').click()
      const tableContents = [
        // [Year, All, Started studying, Currently enrolled, Absent, Cancelled, Graduated, Men, Women, Finnish]
        [
          '2020 - 2021',
          12,
          '100.0 %',
          10,
          '83.3 %',
          0,
          '0 %',
          0,
          '0 %',
          0,
          '0 %',
          0,
          '0 %',
          10,
          '83.3 %',
          2,
          '16.7 %',
          12,
          '100.0 %',
        ],
        [
          '2019 - 2020',
          86,
          '100.0 %',
          86,
          '100.0 %',
          0,
          '0 %',
          0,
          '0 %',
          1,
          '1.2 %',
          1,
          '1.2 %',
          65,
          '75.6 %',
          21,
          '24.4 %',
          86,
          '100.0 %',
        ],
        [
          '2018 - 2019',
          162,
          '100.0 %',
          161,
          '99.4 %',
          0,
          '0 %',
          0,
          '0 %',
          11,
          '6.8 %',
          11,
          '6.8 %',
          118,
          '72.8 %',
          44,
          '27.2 %',
          161,
          '99.4 %',
        ],
        [
          '2017 - 2018',
          171,
          '100.0 %',
          171,
          '100.0 %',
          0,
          '0 %',
          0,
          '0 %',
          21,
          '12.3 %',
          42,
          '24.6 %',
          135,
          '78.9 %',
          36,
          '21.1 %',
          166,
          '97.1 %',
        ],
      ]

      cy.checkTableStats(tableContents, 'StudytrackOverview')
    })

    it('Student progress data is shown correctly', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Studytracks and student populations').click()
      const tableContents = [
        ['2020 - 2021', 12, 5, 2, 2, 0, 2, 1],
        ['2019 - 2020', 86, 13, 15, 32, 11, 2, 13],
        ['2018 - 2019', 162, 7, 16, 35, 33, 27, 44],
        ['2017 - 2018', 171, 10, 22, 18, 22, 24, 75],
      ]

      cy.checkTableStats(tableContents, 'StudytrackProgress')
    })

    /* Tag-tests*/

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
