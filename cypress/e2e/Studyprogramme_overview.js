/// <reference types="cypress" />

const { getEmptyYears } = require('../support/commands')

const deleteTag = name => {
  cy.contains('td', name).siblings().contains('Delete').click()
  cy.contains('Are you sure you want to delete tag')
  cy.contains('Confirm').click()
  cy.contains('td', name).should('not.exist')
}

describe('Studyprogramme overview', () => {
  /* Basic information overview -tests */
  describe('Basic information -view works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click({ force: true })
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
        [2023, 8, 8, 26, 0, 0],
        [2022, 25, 26, 48, 1, 4],
        [2021, 29, 32, 47, 0, 2],
        [2020, 26, 27, 12, 1, 3],
        [2019, 28, 34, 1, 0, 1],
        [2018, 40, 45, 0, 0, 0],
        [2017, 41, 47, 0, 0, 0],
      ]

      cy.checkTableStats(tableContents, 'StudentsOfTheStudyprogramme')
    })

    it('Basic information contains correct credits', () => {
      const years = getEmptyYears()
      const tableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        [2023, 1519, 1519, 0, 0, 222],
        [2022, 3235, 3205, 0, 30, 209],
        [2021, 5133, 5108, 0, 25, 428],
        [2020, 5801, 5796, 0, 5, 94],
        [2019, 5295, 5295, 0, 0, 162],
        [2018, 3442, 3432, 0, 10, 21],
        [2017, 1211, 1211, 0, 0, 189],
      ]

      cy.checkTableStats(tableContents, 'CreditsProducedByTheStudyprogramme')
    })

    it("Toggling 'Show special categories' on displays additional information", () => {
      cy.contains('Show special categories').click()
      const years = getEmptyYears()
      const tableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0]),
        [2023, 1519, 1519, 0, 0, 0, 0, 222],
        [2022, 3235, 3205, 0, 30, 0, 0, 209],
        [2021, 5133, 5108, 0, 25, 0, 0, 428],
        [2020, 5801, 5796, 0, 5, 0, 0, 94],
        [2019, 5295, 5295, 0, 0, 0, 0, 162],
        [2018, 3442, 3432, 0, 10, 0, 0, 21],
        [2017, 1211, 1211, 0, 0, 0, 0, 189],
      ]

      cy.checkTableStats(tableContents, 'CreditsProducedByTheStudyprogramme')
    })

    it('Basic information contains correct thesis writers and graduates', () => {
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2023, 26, 0],
        [2022, 48, 0],
        [2021, 47, 66],
        [2020, 12, 18],
        [2019, 1, 15],
        [2018, 0, 0],
        [2017, 0, 1],
      ]

      cy.checkTableStats(tableContents, 'GraduatedAndThesisWritersOfTheProgramme')
    })

    it('Special studyrights can be excluded and basic data changes accordingly', () => {
      cy.get('[data-cy=StudentToggle]').click()
      const years = getEmptyYears()
      const studentTableContents = [
        // [Year, Started studying, Accepted, Graduated]
        ...years.map(year => [year, 0, 0, 0]),
        [2023, 8, 8, 24],
        [2022, 25, 26, 44],
        [2021, 29, 32, 46],
        [2020, 26, 27, 11],
        [2019, 28, 34, 1],
        [2018, 40, 45, 0],
        [2017, 41, 47, 0],
      ]

      cy.checkTableStats(studentTableContents, 'StudentsOfTheStudyprogramme')

      const graduatedTableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2023, 24, 0],
        [2022, 44, 0],
        [2021, 46, 60],
        [2020, 11, 17],
        [2019, 1, 15],
        [2018, 0, 0],
        [2017, 0, 1],
      ]

      cy.checkTableStats(graduatedTableContents, 'GraduatedAndThesisWritersOfTheProgramme')
    })

    it('Year can be changed to academic year, and data changes accordingly', () => {
      cy.get('[data-cy=YearToggle]').click({ force: true })
      const isAcademicYear = true
      const years = getEmptyYears(isAcademicYear)
      const studentTableContents = [
        // [Year, Started studying, Accepted, Graduated, Transferred away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        ['2023 - 2024', 8, 8, 4, 0, 0],
        ['2022 - 2023', 25, 26, 36, 0, 0],
        ['2021 - 2022', 29, 32, 57, 1, 6],
        ['2020 - 2021', 26, 27, 30, 0, 3],
        ['2019 - 2020', 28, 34, 7, 1, 1],
        ['2018 - 2019', 40, 45, 0, 0, 0],
        ['2017 - 2018', 41, 47, 0, 0, 0],
      ]
      cy.checkTableStats(studentTableContents, 'StudentsOfTheStudyprogramme')

      const creditTableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        ['2023 - 2024', 160, 160, 0, 0, 67],
        ['2022 - 2023', 2725, 2720, 0, 5, 337],
        ['2021 - 2022', 4092, 4042, 0, 50, 198],
        ['2020 - 2021', 5420, 5415, 0, 5, 321],
        ['2019 - 2020', 6043, 6043, 0, 0, 101],
        ['2018 - 2019', 4846, 4841, 0, 5, 107],
        ['2017 - 2018', 2350, 2345, 0, 5, 26],
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
        .should('contain', 5796)
        .should('contain', 428)

      cy.get('[data-cy=Graph-GraduatedAndThesisWritersOfTheProgramme')
        .should('contain', 'Graduated students')
        .should('contain', 'Wrote thesis')
        .should('contain', 47)
        .should('contain', 66)

      cy.get('[data-cy=graduation-times-graph-breakdownBachelor]')
      cy.get('[data-cy=GraduationTimeToggle]').click()
      cy.get('[data-cy=graduation-times-graphBachelor]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2022')
        cy.contains('48 graduated').trigger('mouseover')
        cy.contains('48 students graduated in year 2022')
        cy.contains('median study time: 44.5 months')
        cy.contains('22 graduated on time')
        cy.contains('12 graduated max year overtime')
        cy.contains('14 graduated over year late')
      })

      cy.get('[data-cy=Graph-ProgrammesBeforeOrAfter')
        .should('contain', 'Tietojenkäsittelytieteen maisteriohjelma')
        .should('contain', 'Datatieteen maisteriohjelma')
        .should('contain', 'Matematiikan ja tilastotieteen maisteriohjelma')
        .should('contain', 32)
        .should('contain', 21)
        .should('contain', 17)
    })
  })

  describe('Graduation times of master programmes', () => {
    it('are split into two graphs', () => {
      cy.init('/study-programme')
      cy.contains('a', 'Matematiikan ja tilastotieteen maisteriohjelma').click({ force: true })

      cy.get('[data-cy=graduation-times-graph-breakdownMaster]')
      cy.get('[data-cy=graduation-times-graph-breakdownBachelor]')

      cy.get('[data-cy=GraduationTimeToggle]').click()
      cy.get('[data-cy=graduation-times-graphMaster]').within(() => {
        cy.contains('Master studyright')
        cy.contains('Graduation year')
        cy.contains('2021')
        cy.contains('2 graduated').trigger('mouseover')
        cy.contains('2 students graduated in year 2021')
        cy.contains('median study time: 25 months')
        cy.contains('1 graduated on time')
        cy.contains('1 graduated max year overtime')
        cy.contains('0 graduated over year late')
      })

      cy.get('[data-cy=graduation-times-graphBachelor]').within(() => {
        cy.contains('Bachelor + master studyright')
        cy.contains('Graduation year')
        cy.contains('2023')
        cy.contains('11 graduated').trigger('mouseover')
        cy.contains('11 students graduated in year 2023')
        cy.contains('median study time: 69 months')
        cy.contains('3 graduated on time')
        cy.contains('7 graduated max year overtime')
        cy.contains('1 graduated over year late')
      })
    })
  })

  /* Studytrack overview -tests */
  describe('Studytrack overview works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click()
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
        ['2023 - 2024', 8, 8, 0, 0, 8, 0, 5, 3, 0, 8, 0],
        ['2022 - 2023', 26, 25, 0, 0, 24, 2, 19, 7, 0, 25, 1],
        ['2021 - 2022', 38, 29, 0, 0, 33, 5, 29, 9, 0, 35, 3],
        ['2020 - 2021', 30, 26, 0, 0, 11, 19, 15, 15, 0, 29, 1],
        ['2019 - 2020', 35, 28, 0, 0, 8, 27, 22, 13, 0, 34, 1],
        ['2018 - 2019', 45, 40, 0, 0, 6, 39, 26, 19, 0, 44, 1],
        ['2017 - 2018', 47, 41, 0, 0, 5, 42, 31, 16, 0, 47, 0],
        ['Total', 229, 197, 0, 0, 95, 134, 147, 82, 0, 222, 7],
      ]

      cy.checkTableStats(tableContents, 'StudytrackOverview')
    })

    it('Years in the students table can be expanded and study track data will be shown', () => {
      cy.get('[data-cy=Table-StudytrackOverview]').within(() => {
        cy.get('tbody tr.header-row')
          .eq(3)
          .within(() => {
            cy.get('td i.angle.right.icon').click()
          })

        const dataForStudyTracks = [
          ['Ekonometria, MAT-EKO', 2, 2, 0, 0, 0, 2, 1, 1, 0, 2, 0],
          ['Matematiikka, MAT-MAT', 13, 10, 0, 0, 1, 12, 7, 6, 0, 12, 1],
          ['Tietojenkäsittelyteoria, MAT-TIE', 2, 1, 0, 0, 1, 1, 2, 0, 0, 2, 0],
          ['Tilastotiede, MAT-TIL', 4, 4, 0, 0, 0, 4, 1, 3, 0, 4, 0],
        ]

        dataForStudyTracks.forEach((data, index) => {
          cy.get('tbody tr.regular-row')
            .eq(index)
            .within(() => {
              cy.get('td').each((cell, i) => {
                cy.wrap(cell).contains(data[i])
              })
            })
        })

        cy.get('tbody tr.header-row')
          .eq(3)
          .within(() => {
            cy.get('td i.angle.down.icon').click()
          })

        cy.get('tbody tr.regular-row').should('not.exist')
      })
    })

    it('Links to class statistics page work', () => {
      cy.get('[data-cy=Table-StudytrackOverview]').within(() => {
        cy.get('tbody tr.header-row')
          .eq(1)
          .within(() => {
            cy.get('td i.level.up.alternate.icon').click()
          })
      })

      cy.contains('Matemaattisten tieteiden kandiohjelma 2022 - 2023')
      cy.contains('class size 26 students')
    })

    it('Links to class statistics page with all years combined work', { retries: 2 }, () => {
      cy.get('[data-cy=Table-StudytrackOverview]').within(() => {
        cy.get('td.total-row-cell a').click()
      })

      cy.contains('Matemaattisten tieteiden kandiohjelma')
      cy.contains('class size 227 students')
    })

    it('Links to class statistics page with study track info included work', () => {
      cy.get('[data-cy=Table-StudytrackOverview]').within(() => {
        cy.get('tbody tr.header-row')
          .eq(3)
          .within(() => {
            cy.get('td i.angle.right.icon').click()
          })
      })

      cy.contains('td', 'Matematiikka, MAT-MAT').within(() => {
        cy.get('a').click()
      })

      cy.contains('Matemaattisten tieteiden kandiohjelma 2020 - 2021')
      cy.contains('div.sub.header', 'studytrack MAT-MAT')
      cy.contains('class size 30 students')
      cy.contains('10 students out of 30 shown')
    })

    it('Student progress data is shown correctly', () => {
      const years = getEmptyYears(true)
      const tableContents = [
        // [Year, All, < 30 credits, 30–60 credits, 60–90 credits, 90–120 credits, 120–150 credits, 150–180 credits, ≥ 180 credits]
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
        ['2023 - 2024', 8, 8, 0, 0, 0, 0, 0, 0],
        ['2022 - 2023', 26, 9, 9, 4, 3, 0, 1, 0],
        ['2021 - 2022', 38, 8, 6, 11, 8, 5, 0, 0],
        ['2020 - 2021', 30, 2, 1, 3, 7, 4, 4, 9],
        ['2019 - 2020', 35, 1, 0, 2, 1, 0, 4, 27],
        ['2018 - 2019', 45, 0, 1, 1, 2, 0, 3, 38],
        ['2017 - 2018', 47, 0, 1, 3, 0, 1, 2, 40],
        ['Total', 229, 28, 18, 24, 21, 10, 14, 114],
      ]

      cy.checkTableStats(tableContents, 'StudytrackProgress')
    })

    it('Studytrack overview graphs render', () => {
      cy.get('[data-cy=Graph-StudytrackProgress]')
        .should('contain', 'Less than 30 credits')
        .should('contain', '30–60 credits')
        .should('contain', 'At least 180 credits')
        .should('contain', '49.8%') // The percentage for total, at least 180 credits, to check that the graph renders

      cy.get('[data-cy=Graph-StudytrackProgress]').contains('49.8%').trigger('mouseover', { force: true })
      cy.contains('At least 180 credits: 114')

      cy.get("[data-cy='Section-KH50_001']").within(() => {
        cy.contains('Start year')
        cy.contains('2020 - 2021')
        cy.get('[aria-label="2020 - 2021, 15. On time."]').trigger('mouseover')
        cy.contains('On time: 15')
        cy.contains("Click a bar to view that year's study track level breakdown")
        cy.get('[aria-label="2019 - 2020, 22. On time."]').click()
        cy.contains("Click a bar to view that year's study track level breakdown").should('not.exist')
        cy.contains('Year 2019 - 2020 by start year')
        cy.get('[aria-label="MAT-MAT, 14. On time."]').trigger('mouseover')
        cy.contains('Matematiikka')
        cy.contains('MAT-MAT')
        cy.contains('On time: 14')
      })

      cy.get('[data-cy=GraduationTimeToggle]').click()

      cy.get("[data-cy='Section-KH50_001']").within(() => {
        cy.contains('Start year')
        cy.contains('2020 - 2021')
        cy.contains('19 graduated').trigger('mouseover')
        cy.contains('From class of 2020 - 2021, 19/30 students have graduated')
        cy.contains('median study time: 33 months')
        cy.contains('15 graduated on time')
        cy.contains('3 graduated max year overtime')
        cy.contains('1 graduated over year late')
      })
    })

    describe('Studytrack can be changed', () => {
      beforeEach(() => {
        cy.get('.studytrack-selector').contains('All students of the programme, KH50_001').click()
        cy.get('.studytrack-selector .visible.menu').contains('Matematiikka, MAT-MAT').click()
      })

      it('Students of the study track are shown correctly', () => {
        cy.get("[data-cy='Section-StudytrackOverview']").contains('Students of the studytrack MAT-MAT by starting year')
        const tableContents = [
          // [Year, All, Started studying, Present, Absent, Inactive, Graduated, Men, Women, Other/Unknown, Finland, Other]
          ['2022 - 2023', 3, 3, 0, 0, 1, 2, 2, 1, 0, 3, 0],
          ['2021 - 2022', 5, 1, 0, 0, 1, 4, 3, 2, 0, 5, 0],
          ['2020 - 2021', 13, 10, 0, 0, 1, 12, 7, 6, 0, 12, 1],
          ['2019 - 2020', 17, 14, 0, 0, 0, 17, 10, 7, 0, 16, 1],
          ['2018 - 2019', 23, 21, 0, 0, 2, 21, 11, 12, 0, 23, 0],
          ['2017 - 2018', 28, 24, 0, 0, 1, 27, 15, 13, 0, 28, 0],
          ['Total', 89, 73, 0, 0, 6, 83, 48, 41, 0, 87, 2],
        ]
        cy.checkTableStats(tableContents, 'StudytrackOverview')
      })

      it('Links to class statistics page with study track info included work', () => {
        cy.get('[data-cy=Table-StudytrackOverview]').within(() => {
          cy.get('tbody tr.regular-row')
            .eq(2)
            .within(() => {
              cy.get('a').click()
            })
        })

        cy.contains('Matemaattisten tieteiden kandiohjelma 2020 - 2021')
        cy.contains('div.sub.header', 'studytrack MAT-MAT')
        cy.contains('class size 30 students')
        cy.contains('10 students out of 30 shown')
      })

      it('Info message about missing progress stats is displayed', () => {
        cy.contains('.divider', 'Progress of students of the studytrack MAT-MAT by starting year')
        cy.contains(
          '.message',
          'Currently progress data is only available for all students of the study programme. Please select ”All students of the programme” to view the progress data.'
        )
      })

      it('Average graduation times are displayed correctly', () => {
        cy.get("[data-cy='Section-AverageGraduationTimesStudytracks']")
        cy.get("[data-cy='graduation-times-graph-breakdownBachelor']").within(() => {
          cy.contains('Start year')
          cy.contains('2020 - 2021')
          cy.get('[aria-label="2020 - 2021, 9. On time."]').trigger('mouseover')
          cy.contains('Graduated On time: 9 students')
        })

        cy.get('[data-cy=GraduationTimeToggle]').click()
        cy.get("[data-cy='graduation-times-graphBachelor']").within(() => {
          cy.contains('Start year')
          cy.contains('2020 - 2021')
          cy.contains('12 graduated').trigger('mouseover')
          cy.contains('From class of 2020 - 2021, 12/13 students have graduated')
          cy.contains('median study time: 34 months')
          cy.contains('9 graduated on time')
          cy.contains('2 graduated max year overtime')
          cy.contains('1 graduated over year late')
        })
      })
    })
  })

  /* Programme courses -tests */
  describe('Programme courses works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click()
      cy.get('.attached').contains('Programme courses').click()
    })

    it('content loads', () => {
      cy.get('[data-cy=CoursesYearFilter]')
      cy.get('[data-cy=CourseTabs]')
    })

    it('time range selection works', () => {
      cy.get('[data-cy=CoursesSortableTable] tbody').within(() => {
        cy.get('tr')
          .eq(0)
          .within(() => {
            cy.get('td').eq(0).contains('MAT11008')
            cy.get('td').eq(1).contains('Advanced calculus')
            cy.get('td').eq(2).contains('75')
          })
      })
      cy.get('[data-cy=fromYear]').click().contains('2018').click()
      cy.get('[data-cy=toYear').click().contains('2019').click()

      cy.get('[data-cy=CoursesSortableTable] tbody').within(() => {
        cy.get('tr')
          .eq(0)
          .within(() => {
            cy.get('td').eq(0).contains('MAT11008')
            cy.get('td').eq(1).contains('Advanced calculus')
            cy.get('td').eq(2).contains('15')
          })
      })
    })

    it("'Calendar year/Academic year' toggle works", () => {
      cy.get('[data-cy=calendarAcademicYearToggle]').click()
      cy.get('[data-cy=fromYear]').contains('2017-2018')
      cy.get('[data-cy=toYear').contains('2023-2024')
      cy.get('[data-cy=CoursesSortableTable] tbody').within(() => {
        cy.get('tr')
          .eq(0)
          .within(() => {
            cy.get('td').eq(0).contains('MAT11008')
            cy.get('td').eq(1).contains('Advanced calculus')
            cy.get('td').eq(2).contains('75')
          })
      })
    })

    it('contains correct courses in alphabetical order', () => {
      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('Advanced calculus')
        cy.get('tr').eq(-1).contains('Äidinkielen opinnot')
      })
    })

    it('different sorting options work', () => {
      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        // Course code
        cy.get('th').eq(0).click()
        cy.get('tr')
          .eq(1)
          .within(() => {
            cy.get('td').eq(0).contains('odgi-zef0')
            cy.get('td').eq(1).contains('Työ- ja organisaatiopsykologian perusopinnot')
          })
        cy.get('th').eq(0).click()
        cy.get('tr')
          .eq(1)
          .within(() => {
            cy.get('td').eq(0).contains('MAT-yht')
            cy.get('td').eq(1).contains('Muut opinnot')
          })

        // Course name
        cy.get('th').eq(1).click()
        cy.get('tr')
          .eq(1)
          .within(() => {
            cy.get('td').eq(0).contains('MAT20003')
            cy.get('td').eq(1).contains('Äidinkielen opinnot')
          })
        cy.get('th').eq(1).click()
        cy.get('tr')
          .eq(1)
          .within(() => {
            cy.get('td').eq(0).contains('MAT11008')
            cy.get('td').eq(1).contains('Advanced calculus')
          })

        // Total credits
        cy.get('th').eq(2).click()
        cy.get('tr')
          .eq(1)
          .within(() => {
            cy.get('td').eq(0).contains('MAT110')
            cy.get('td').eq(1).contains('Matematiikka, perusopinnot')
          })
        cy.get('th').eq(2).click()
        cy.get('tr')
          .eq(1)
          .within(() => {
            cy.get('td').eq(0).contains('MAT20001')
            cy.get('td').eq(1).contains('Kypsyysnäyte')
          })
      })
    })

    it("'Show credits/Show students' toggle works", () => {
      cy.get('[data-cy=CoursesSortableTable] thead tr').within(() => {
        cy.get('th').should('have.length', 8)
        const headers = [
          'Code',
          'Name',
          'Total credits',
          'Major credits',
          'Non-major credits',
          'Non-degree credits',
          'Transferred credits',
          'Type',
        ]
        headers.forEach((header, index) => {
          cy.get('th').eq(index).contains(header)
        })
      })

      cy.get('[data-cy=CoursesSortableTable] tbody').within(() => {
        cy.get('tr')
          .eq(0)
          .within(() => {
            cy.get('td').eq(0).contains('MAT11008')
            cy.get('td').eq(1).contains('Advanced calculus')
            cy.get('td').eq(2).contains('75')
          })
      })

      cy.get('[data-cy=creditsStudentsToggle]').click()

      cy.get('[data-cy=CoursesSortableTable] thead tr')
        .eq(0)
        .within(() => {
          cy.get('th').should('have.length', 7)
          const headers = [
            'Code',
            'Name',
            'Total',
            'Breakdown of total',
            'Breakdown of passed students',
            'Not included in total nor passed',
            'Type',
          ]
          headers.forEach((header, index) => {
            cy.get('th').eq(index).contains(header)
          })
        })

      cy.get('[data-cy=CoursesSortableTable] thead tr')
        .eq(1)
        .within(() => {
          cy.get('th').should('have.length', 6)
          const headers = [
            'Passed',
            'Not completed',
            'Major students',
            'Non-major students',
            'Non-degree students',
            'Transferred students',
          ]
          headers.forEach((header, index) => {
            cy.get('th').eq(index).contains(header)
          })
        })

      cy.get('[data-cy=CoursesSortableTable] tbody').within(() => {
        cy.get('tr')
          .eq(0)
          .within(() => {
            cy.get('td').eq(0).contains('MAT11008')
            cy.get('td').eq(1).contains('Advanced calculus')
            cy.get('td').eq(2).contains('23')
          })
      })
    })
  })

  describe('Degree courses works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click()
      cy.get('.attached').contains('Degree courses').click()
    })

    it('content loads', () => {
      cy.contains('h3', 'Select curriculum to edit:')
      cy.get('[data-cy=curriculum-picker]').contains('2023 - 2026')
      cy.contains('Change visibility of degree courses and select criteria for academic years')
      cy.contains('form', 'First year (12 months) last set: 0')
      cy.get('table').within(() => {
        cy.contains('Muut opinnot')
        cy.contains('Matematiikka, perusopinnot')
        cy.contains('div.green.label', 'visible')
        cy.contains('button', 'Set hidden')
      })
    })
  })

  /* Tag-tests */
  describe('Tags view works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click({ force: true })
      cy.get('.attached').contains('Tags').click()
    })

    it('can create and delete tags for population', () => {
      const name = `tag-${new Date().getTime()}`
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2022')
      cy.contains('Create a new tag').click()
      cy.contains(name)
      cy.contains('2022')
      deleteTag(name)
    })

    it('can create personal tags', () => {
      const name = `tag-${new Date().getTime()}`
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2022')

      cy.get('.ui > label').click()
      cy.contains('Create a new tag').click()
      cy.contains(name)
      deleteTag(name)
    })

    describe('Adding tags to students and removing them works', () => {
      const name = `tag-${new Date().getTime()}`
      const studentInput = '477806,478275;   478953  479239\n   480080'
      const studentNumbers = studentInput.match(/[^\s,;]+/g)

      it('can add tags to students', () => {
        cy.get('.tagNameSelectInput > .ui > input').type(name)
        cy.get('.yearSelectInput').type('2022')
        cy.contains('Create a new tag').click()
        cy.contains(name)

        cy.contains('Add a tag to students').click()
        cy.get('.form > .field > .dropdown').click().get('.ui > input.search').type(name).click()

        cy.get('.form > .field > .dropdown > .visible').contains(name).click()

        cy.get('textarea').type(studentInput)
        cy.contains('Add tags').click()

        cy.contains('Successfully added tags to students.')

        cy.contains('td', name).get('i.level.up.alternate.icon').click()

        cy.contains('Matemaattisten tieteiden kandiohjelma 2022 - 2023')
        cy.contains(`Tagged with: ${name}`)
        cy.contains('Students (5)')
          .parent()
          .then($parentDiv => {
            if (!$parentDiv.hasClass('active')) cy.contains('Students (5)').click()
          })

        for (const studentNumber of studentNumbers) {
          cy.contains(studentNumber)
        }

        cy.go('back')
        deleteTag(name)
      })

      it('deleting a tag from tag view also removes it from students', () => {
        cy.contains(name).should('not.exist')
        for (const studentNumber of studentNumbers) {
          cy.contains('Students').click()
          cy.get('.prompt').type(studentNumber)
          cy.contains('a', studentNumber).click()
          cy.contains(name).should('not.exist')
        }
      })
    })
  })

  describe('IAM user', () => {
    beforeEach(() => {
      cy.init('/study-programme', 'onlyiamrights')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click()
    })

    it('can access programme and correct tabs are visible', () => {
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

    it("doesn't see other tabs", () => {
      cy.get('div.ui.tabular.menu a').should('have.length', 2)
    })
  })
})
