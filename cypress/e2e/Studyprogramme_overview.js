/// <reference types="Cypress" />

const deleteTag = name => {
  cy.contains('td', name).siblings().contains('Delete').click()
  cy.contains('Are you sure you want to delete tag')
  cy.contains('Confirm').click()
  cy.contains('td', name).should('not.exist')
}

const getEmptyYears = isAcademicYear => {
  const today = new Date()
  const latestYear = isAcademicYear && today.getMonth() < 7 ? today.getFullYear() - 1 : today.getFullYear()

  const years = []
  for (let year = latestYear; year > 2021; year--) {
    if (isAcademicYear) {
      years.push(`${year} - ${year + 1}`)
    } else {
      years.push(year)
    }
  }
  return years
}

describe('Studyprogramme overview', () => {
  before(() => {
    cy.init('/study-programme', 'admin')
    cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click({ force: true })
    cy.get('.attached').contains('Update statistics').click()
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000)
    cy.get('button').eq(0).click({ force: true })
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(10000)
    cy.get('button').eq(1).click({ force: true })
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(10000)
  })

  /* Basic information overview -tests*/
  describe('Basic information -view works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000)
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click({ force: true })
      // cy.viewport(1536, 960)
    })

    // If the backend breaks for one of the sections, the section header is not rendered and this will fail
    it('Basic information -tab loads', () => {
      cy.get('[data-cy=Section-StudentsOfTheStudyprogramme]')
      cy.get('[data-cy=Section-CreditsProducedByTheStudyprogramme]')
      cy.get('[data-cy=Section-GraduatedAndThesisWritersOfTheProgramme]')
      cy.get('[data-cy=Section-ProgrammesBeforeOrAfter]')
      cy.get('[data-cy=Section-AverageGraduationTimes]')
    })

    it('Basic information contains correct students', () => {
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Started, Graduated, Transferred Away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0]),
        [2021, 0, 0, 1, 0],
        [2020, 12, 35, 3, 2],
        [2019, 87, 17, 0, 1],
        [2018, 161, 1, 0, 0],
        [2017, 171, 0, 0, 0],
      ]

      cy.checkTableStats(tableContents, 'StudentsOfTheStudyprogramme')
    })

    it('Basic information contains correct credits', () => {
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Total, Major credits, Non-major credits, Non-degree credits, Transferred credits]
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        [2021, 0, 0, 0, 0, 0],
        [2020, 5860, 5591, 102, 0, 167],
        [2019, 8696, 7737, 587, 23, 349],
        [2018, 7818, 6584, 857, 105, 272],
        [2017, 3085, 2492, 158, 47, 388],
      ]

      cy.checkTableStats(tableContents, 'CreditsProducedByTheStudyprogramme')
    })

    it('Basic information contains correct thesis writers and graduates', () => {
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2021, 0, 0],
        [2020, 35, 35],
        [2019, 17, 25],
        [2018, 1, 5],
        [2017, 0, 0],
      ]

      cy.checkTableStats(tableContents, 'GraduatedAndThesisWritersOfTheProgramme')
    })

    it('Special studyrights can be excluded and basic data changes accordingly', () => {
      cy.get('[data-cy=StudentToggle]').click()
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(15000)
      const years = getEmptyYears()
      const studentTableContents = [
        // [Year, Started, Graduated]
        ...years.map(year => [year, 0, 0]),
        [2021, 0, 0],
        [2020, 10, 35],
        [2019, 85, 17],
        [2018, 159, 1],
        [2017, 170, 0],
      ]

      cy.checkTableStats(studentTableContents, 'StudentsOfTheStudyprogramme')

      const creditTableContents = [
        // [Year, Total, Major students credits, Transferred credits]
        ...years.map(year => [year, 0, 0, 0]),
        [2021, 0, 0, 0],
        [2020, 4999, 4675, 167],
        [2019, 6182, 5699, 349],
        [2018, 4884, 4537, 272],
        [2017, 1988, 1600, 388],
      ]

      cy.checkTableStats(creditTableContents, 'CreditsProducedByTheStudyprogramme')

      const graduatedTableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2021, 0, 0],
        [2020, 35, 35],
        [2019, 17, 25],
        [2018, 1, 5],
        [2017, 0, 0],
      ]

      cy.checkTableStats(graduatedTableContents, 'GraduatedAndThesisWritersOfTheProgramme')
      cy.get('[data-cy=StudentToggle]').click()
    })

    it('Year can be changed to academic year, and data changes accordingly', () => {
      cy.get('[data-cy=YearToggle]').click({ force: true })
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(15000)
      const isAcademicYear = true
      const years = getEmptyYears(isAcademicYear)
      const studentTableContents = [
        // [Year, Started, Graduated, Transferred away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0]),
        ['2021 - 2022', 0, 0, 0, 0],
        ['2020 - 2021', 12, 6, 3, 2],
        ['2019 - 2020', 86, 41, 1, 0],
        ['2018 - 2019', 162, 5, 0, 1],
        ['2017 - 2018', 171, 1, 0, 0],
      ]
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000)
      cy.checkTableStats(studentTableContents, 'StudentsOfTheStudyprogramme')

      const creditTableContents = [
        // [Year, Total, Major students credits, Non-major students credits, Non-degree credits, Transferred credits]
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        ['2021 - 2022', 0, 0, 0, 0, 0],
        ['2020 - 2021', 566, 486, 20, 0, 60],
        ['2019 - 2020', 8595, 8271, 106, 0, 218],
        ['2018 - 2019', 9992, 8855, 791, 43, 303],
        ['2017 - 2018', 6055, 4792, 787, 132, 344],
      ]

      cy.checkTableStats(creditTableContents, 'CreditsProducedByTheStudyprogramme')
      //cy.wait(10000)
      cy.get('[data-cy=YearToggle]').click()
    })

    it('Basic information graphs render', () => {
      cy.get('[data-cy=Graph-StudentsOfTheStudyprogramme')
        .should('contain', 'Started')
        .should('contain', 'Graduated')
        .should('contain', 'Transferred away')

      cy.get('[data-cy=Graph-CreditsProducedByTheStudyprogramme')
        .should('contain', 'Major students credits')
        .should('contain', 'Non-major students credits')
        .should('contain', 'Transferred credits')
        .should('contain', 7737)
        .should('contain', 6584)

      cy.get('[data-cy=Graph-GraduatedAndThesisWritersOfTheProgramme')
        .should('contain', 'Graduated students')
        .should('contain', 'Wrote thesis')
        .should('contain', 1)
        .should('contain', 5)
        .should('contain', 17)
        .should('contain', 25)
        .should('contain', 35)

      cy.get('[data-cy=graduation-times-graph-breakdownBachelor]')
      cy.get('[data-cy=GraduationTimeToggle]').click()
      cy.get('[data-cy=graduation-times-graphBachelor]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2019')
        cy.contains('17 graduated').trigger('mouseover')
        cy.contains('study time: 23 months')
        cy.contains('17 graduated on time')
        cy.contains('0 graduated max year overtime')
      })

      cy.get('[data-cy=Graph-ProgrammesBeforeOrAfter')
        .should('contain', 'Tietojenkäsittelytieteen maisteriohjelma')
        .should('contain', 'Datatieteen maisteriohjelma')
        .should('contain', 'Matematiikan ja tilastotieteen maisteriohjelma')
        .should('contain', 1)
        .should('contain', 4)
        .should('contain', 13)
    })
  })

  describe('Graduation times of master programmes', () => {
    it('are split into two graphs', () => {
      cy.init('/study-programme', 'admin')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(5000)
      cy.contains('a', 'Kasvatustieteiden maisteriohjelma').click({ force: true })

      cy.get('[data-cy=graduation-times-graph-breakdownMaster]')
      cy.get('[data-cy=graduation-times-graph-breakdownBachelor]')

      cy.get('[data-cy=GraduationTimeToggle]').click()
      cy.get('[data-cy=graduation-times-graphMaster]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2020')
        cy.contains('24 graduated').trigger('mouseover')
        cy.contains('study time: 22 months')
        cy.contains('20 graduated on time')
        cy.contains('4 graduated max year overtime')
      })

      cy.get('[data-cy=graduation-times-graphBachelor]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2020')
        cy.contains('0 graduated').trigger('mouseover')
        cy.contains('study time: 0 months')
        cy.contains('0 graduated on time')
      })
    })
  })

  /* Studytrack overview -tests*/
  describe('Studytrack overview works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000)
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Studytracks and class statistics').click()
    })

    // If the backend breaks for one of the sections, the section header is not rendered and this will fail
    it('Studytracks and class statistics -tab loads', () => {
      cy.get('[data-cy=Section-StudytrackOverview]')
      cy.get('[data-cy=Section-StudytrackProgress]')
      cy.get('[data-cy=Section-AverageGraduationTimesStudytracks]')
    })

    it('Students of the studyprogramme are shown correctly', () => {
      const tableContents = [
        // [Year, All, Started studying, Currently enrolled, Absent, Inactive, Graduated, Men, Women, Finnish]
        ['2020 - 2021', 12, 10, 0, 0, 0, 0, 10, 2, 0, 12, 0],
        ['2019 - 2020', 86, 85, 0, 0, 0, 1, 65, 21, 0, 86, 0],
        ['2018 - 2019', 162, 159, 0, 0, 0, 11, 118, 44, 0, 161, 1],
        ['2017 - 2018', 171, 170, 0, 0, 0, 42, 135, 36, 0, 166, 5],
        ['Total', 431, 424, 0, 0, 0, 54, 328, 103, 0, 425, 6],
      ]

      cy.checkTableStats(tableContents, 'StudytrackOverview')
    })

    it('Student progress data is shown correctly', () => {
      const tableContents = [
        ['2020 - 2021', 12, 12, 0, 0, 0, 0, 0, 0, 0],
        ['2019 - 2020', 86, 10, 16, 34, 21, 5, 0, 0, 0],
        ['2018 - 2019', 162, 2, 8, 27, 47, 36, 26, 12, 4],
        ['2017 - 2018', 171, 5, 15, 21, 26, 22, 22, 33, 27],
        ['Total', 431, 29, 39, 82, 94, 63, 48, 45, 31],
      ]

      cy.checkTableStats(tableContents, 'StudytrackProgress')
    })

    it('Studytrack overview graphs render', () => {
      cy.get('[data-cy=Graph-StudytrackProgress]')
        .should('contain', 'Less than 15 credits')
        .should('contain', '30-59 credits')
        .should('contain', '180 or more credits')
        .should('contain', '2.9%') // The percentage for less than 15 credits in 2017-2018, to check that the graph renders
        .should('contain', '4.9%') // The percentage for 15-29 credits in 2018-2019
        .should('contain', '11.6%') // The percentage for less than 15 credits in 2019-2020

      cy.get('[data-cy=graduation-times-graph-breakdownBachelor]')
      cy.get('[data-cy=GraduationTimeToggle]').click()

      cy.get('[data-cy=graduation-times-graphBachelor]').within(() => {
        cy.contains('Start year')
        cy.contains('2019 - 2020')
        cy.contains('42 graduated').trigger('mouseover')
        cy.contains('study time: 31.5 months')
        cy.contains('39 graduated on time')
      })
    })
  })

  /* Programme courses -tests*/
  describe('Programme courses works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000)
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Programme courses').click()
    })

    it('content loads', () => {
      cy.get('[data-cy=CoursesYearFilter]')
      cy.get('[data-cy=CourseTabs]')
    })

    it('time range selection works', () => {
      cy.get('[data-cy=fromYear]').click().contains('2018').click()

      cy.get('[data-cy=toYear').click().contains('2019').click()

      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('684')
      })
    })

    it('calendar year -> academic year toggle works', () => {
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000)
      cy.get('[data-cy=fromYear]').click().contains('2018').click()

      cy.get('[data-cy=toYear').click().contains('2019').click()
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(20000)
      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('684')
      })
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(20000)
      cy.get('[data-cy=calendarAcademicYearToggle]').first().click()
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(20000)
      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('772')
      })
    })

    it('contains correct courses in alphabetical order', () => {
      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('Aineopintojen harjoitustyö: Tietokantasovellus')
        cy.get('tr').eq(-1).contains('Äidinkielinen viestintä')
      })
    })

    it('different sorting options work', () => {
      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        // Test sorting by different columns
        cy.get('th').eq(0).click()
        cy.get('tr').eq(2).contains('Tietojenkäsittelytieteen kisälliopetus')
        cy.get('th').eq(1).click()
        cy.get('tr').eq(1).contains('Äidinkielinen viestintä')
        cy.get('th').eq(2).click()
        cy.get('tr').eq(1).contains('Tietorakenteet ja algoritmit')
      })
    })

    it('show credits -> show students toggle works', () => {
      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('1068')
      })

      cy.get('[data-cy=creditsStudentsToggle]').first().click()

      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(2).contains('267')
      })
    })
  })

  /* Tag-tests*/
  describe('Basic information -view works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000)
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Tags').click()
    })

    it('can create and delete tags for population', () => {
      const name = `tag-${new Date().getTime()}`
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2018')
      cy.contains('Create new tag').click()
      cy.contains(name)
      cy.contains('2018')
      deleteTag(name)
    })

    it('can create personal tags', () => {
      const name = `tag-${new Date().getTime()}`
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
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2018')
      cy.contains('Create new tag').click()
      cy.contains(name)

      cy.contains('Add tags to students').click()
      cy.get('.form > .field > .dropdown').click().get('.ui > input.search').type(name).click()

      cy.get('.form > .field > .dropdown > .visible').contains(name).click()

      cy.get('textarea').type('010113437')
      cy.get('.positive').click()

      cy.contains('Student statistics').click()
      cy.get('.prompt').type(student)
      cy.contains('a', student).click()
      cy.contains(name)

      cy.go('back')
      cy.go('back')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000)
      deleteTag(name)

      cy.contains('Student statistics').click()
      cy.get('.prompt').type(student)
      cy.contains('a', student).click()
      cy.contains(name).should('not.exist')
    })
  })

  /*
  describe('IAM user', () => {
    beforeEach(() => {
      cy.init('/study-programme', 'onlyiamrights')

      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').dblclick()
    })

    it('can access programme and correct tabs are visible', () => {
      cy.reload()

      cy.contains('Basic information')
      cy.contains('Studytracks and class statistics')

      cy.contains('Update statistics').should('not.exist')
      cy.contains('Degree courses').should('not.exist')
    })

    it('can access basic information', () => {
      cy.contains('Basic information').click()

      cy.get('[data-cy=Section-StudentsOfTheStudyprogramme]')
      cy.get('[data-cy=Section-CreditsProducedByTheStudyprogramme]')
      cy.get('[data-cy=Section-GraduatedAndThesisWritersOfTheProgramme]')
      cy.get('[data-cy=Section-ProgrammesBeforeOrAfter]')
      cy.get('[data-cy=Section-AverageGraduationTimes]')
    })

    it('can access studytracks', () => {
      cy.get('.attached').contains('Studytracks and class statistics').click()

      cy.get('[data-cy=Section-StudytrackOverview]')
      cy.get('[data-cy=Section-StudytrackProgress]')
      cy.get('[data-cy=Section-AverageGraduationTimesStudytracks]')
    })
  })
  */
})
