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
  /* Basic information overview -tests */
  describe('Basic information -view works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click({ force: true })
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
        // [Year, Started studying, Accepted, Graduated, Transferred Away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        [2021, 0, 0, 0, 1, 0],
        [2020, 10, 10, 35, 2, 2],
        [2019, 83, 86, 17, 1, 1],
        [2018, 150, 161, 1, 0, 0],
        [2017, 158, 171, 0, 0, 0],
      ]

      cy.checkTableStats(tableContents, 'StudentsOfTheStudyprogramme')
    })

    it('Basic information contains correct credits', () => {
      const years = getEmptyYears()
      const tableContents = [
        ...years.map(year => [year, 0, 0]),
        [2021, 0, 0, 0, 0, 0],
        [2020, 4511, 4511, 0, 0, 406],
        [2019, 7117, 7097, 0, 0, 434],
        [2018, 5742, 5737, 0, 0, 150],
        [2017, 1887, 1882, 0, 0, 186],
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
      const years = getEmptyYears()
      const studentTableContents = [
        // [Year, Started studying, Accepted, Graduated]
        ...years.map(year => [year, 0, 0, 0]),
        [2021, 0, 0, 0],
        [2020, 10, 10, 35],
        [2019, 83, 86, 17],
        [2018, 150, 161, 1],
        [2017, 158, 171, 0],
      ]

      cy.checkTableStats(studentTableContents, 'StudentsOfTheStudyprogramme')

      const creditTableContents = [
        ...years.map(year => [year, 0, 0]),
        [2021, 0, 0, 0, 0, 0],
        [2020, 4511, 4511, 0, 0, 406],
        [2019, 7117, 7097, 0, 0, 434],
        [2018, 5742, 5737, 0, 0, 150],
        [2017, 1887, 1882, 0, 0, 186],
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
      const isAcademicYear = true
      const years = getEmptyYears(isAcademicYear)
      const studentTableContents = [
        // [Year, Started studying, Accepted, Graduated, Transferred away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        ['2021 - 2022', 0, 0, 0, 0, 0],
        ['2020 - 2021', 10, 10, 6, 1, 2],
        ['2019 - 2020', 83, 86, 38, 3, 0],
        ['2018 - 2019', 150, 161, 8, 0, 1],
        ['2017 - 2018', 158, 171, 1, 0, 0],
      ]
      cy.checkTableStats(studentTableContents, 'StudentsOfTheStudyprogramme')

      const creditTableContents = [
        ...years.map(year => [year, 0, 0]),
        ['2021 - 2022', 0, 0, 0, 0, 0],
        ['2020 - 2021', 352, 352, 0, 0, 296],
        ['2019 - 2020', 6966, 6966, 0, 0, 430],
        ['2018 - 2019', 7797, 7777, 0, 0, 259],
        ['2017 - 2018', 4142, 4132, 0, 0, 191],
      ]

      cy.checkTableStats(creditTableContents, 'CreditsProducedByTheStudyprogramme')
      cy.get('[data-cy=YearToggle]').click()
    })

    it('Basic information graphs render', () => {
      cy.get('[data-cy=Graph-StudentsOfTheStudyprogramme')
        .should('contain', 'Started studying')
        .should('contain', 'Accepted')
        .should('contain', 'Graduated')
        .should('contain', 'Transferred away')
        .should('contain', 'Transferred to')

      cy.get('[data-cy=Graph-CreditsProducedByTheStudyprogramme')
        .should('contain', 'Degree students')
        .should('contain', 'Transferred')
        .should('contain', 7097)
        .should('contain', 434)

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
        cy.contains('2020')
        cy.contains('35 graduated').trigger('mouseover')
        cy.contains('median study time: 34 months')
        cy.contains('30 graduated on time')
        cy.contains('5 graduated max year overtime')
      })

      cy.get('[data-cy=Graph-ProgrammesBeforeOrAfter')
        .should('contain', 'Tietojenkäsittelytieteen maisteriohjelma')
        .should('contain', 'Datatieteen maisteriohjelma')
        .should('contain', 'Matematiikan ja tilastotieteen maisteriohjelma')
        .should('contain', 11)
        .should('contain', 12)
        .should('contain', 24)
    })
  })

  describe('Graduation times of master programmes', () => {
    it('are split into two graphs', () => {
      cy.init('/study-programme', 'admin')
      cy.contains('a', 'Kasvatustieteiden maisteriohjelma').click({ force: true })

      cy.get('[data-cy=graduation-times-graph-breakdownMaster]')
      cy.get('[data-cy=graduation-times-graph-breakdownBachelor]')

      cy.get('[data-cy=GraduationTimeToggle]').click()
      cy.get('[data-cy=graduation-times-graphMaster]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2020')
        cy.contains('24 graduated').trigger('mouseover')
        cy.contains('study time: 22.5 months')
        cy.contains('19 graduated on time')
        cy.contains('5 graduated max year overtime')
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

  /* Studytrack overview -tests */
  describe('Studytrack overview works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
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
        // [Year, All, Started studying, Present, Absent, Inactive, Graduated, Men, Women, Other/Unknown, Finland, Other]
        ['2020 - 2021', 12, 10, 0, 0, 12, 0, 10, 2, 0, 12, 0],
        ['2019 - 2020', 86, 83, 0, 0, 85, 1, 65, 21, 0, 86, 0],
        ['2018 - 2019', 162, 150, 0, 0, 151, 11, 118, 44, 0, 161, 1],
        ['2017 - 2018', 171, 158, 0, 0, 130, 41, 135, 36, 0, 166, 5],
        ['Total', 431, 401, 0, 0, 378, 53, 328, 103, 0, 425, 6],
      ]

      cy.checkTableStats(tableContents, 'StudytrackOverview')
    })

    it('Student progress data is shown correctly', () => {
      const years = getEmptyYears(true)
      const tableContents = [
        // [Year, All, < 30 credits, 30–60 credits, 60–90 credits, 90–120 credits, 120–150 credits, 150–180 credits, ≥ 180 credits]
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
        ['2021 - 2022', 0, 0, 0, 0, 0, 0, 0, 0],
        ['2020 - 2021', 12, 12, 0, 0, 0, 0, 0, 0],
        ['2019 - 2020', 86, 26, 34, 21, 5, 0, 0, 0],
        ['2018 - 2019', 162, 10, 28, 47, 35, 26, 12, 4],
        ['2017 - 2018', 171, 20, 21, 26, 22, 22, 33, 27],
        ['Total', 431, 68, 83, 94, 62, 48, 45, 31],
      ]

      cy.checkTableStats(tableContents, 'StudytrackProgress')
    })

    it('Studytrack overview graphs render', () => {
      cy.get('[data-cy=Graph-StudytrackProgress]')
        .should('contain', 'Less than 30 credits')
        .should('contain', '30–60 credits')
        .should('contain', 'At least 180 credits')
        .should('contain', '100.0%') // The percentage for less than 15 credits in 2017-2018, to check that the graph renders

      cy.get('[data-cy=graduation-times-graph-breakdownBachelor]')
      cy.get('[data-cy=GraduationTimeToggle]').click()

      cy.get('[data-cy=graduation-times-graphBachelor]').within(() => {
        cy.contains('Start year')
        cy.contains('2017 - 2018')
        cy.contains('41 graduated').trigger('mouseover')
        cy.contains('study time: 31 months')
        cy.contains('36 graduated on time')
      })
    })
  })

  /* Programme courses -tests */
  describe('Programme courses works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
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
      cy.get('[data-cy=fromYear]').click().contains('2018').click()
      cy.get('[data-cy=toYear').click().contains('2019').click()
      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('684')
      })
      cy.get('[data-cy=calendarAcademicYearToggle]').first().click()
      cy.get('[data-cy=fromYear]').click().contains('2018-2019').click()
      cy.get('[data-cy=toYear').click().contains('2019-2020').click()
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

  /* Tag-tests */
  describe('Basic information -view works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Tags').click()
    })

    it('can create and delete tags for population', () => {
      const name = `tag-${new Date().getTime()}`
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2018')
      cy.contains('Create a new tag').click()
      cy.contains(name)
      cy.contains('2018')
      deleteTag(name)
    })

    it('can create personal tags', () => {
      const name = `tag-${new Date().getTime()}`
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2018')

      cy.get('.ui > label').click()
      cy.contains('Create a new tag').click()
      cy.contains(name)
      deleteTag(name)
    })

    it('can add tags to students', () => {
      const name = `tag-${new Date().getTime()}`

      const student = '010113437'
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2018')
      cy.contains('Create a new tag').click()
      cy.contains(name)

      cy.contains('Add a tag to students').click()
      cy.get('.form > .field > .dropdown').click().get('.ui > input.search').type(name).click()

      cy.get('.form > .field > .dropdown > .visible').contains(name).click()

      cy.get('textarea').type('010113437')
      cy.contains('Add tags').click()

      cy.contains('Successfully added tags to students.')

      cy.contains('Students').click()
      cy.get('.prompt').type(student)
      cy.contains('a', student).click()
      cy.contains(name)

      cy.go('back')
      cy.go('back')
      deleteTag(name)

      cy.contains('Students').click()
      cy.get('.prompt').type(student)
      cy.contains('a', student).click()
      cy.contains(name).should('not.exist')
    })
  })

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
})
