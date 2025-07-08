/* eslint-disable cypress/unsafe-to-chain-command */
/// <reference types="cypress" />

const { getEmptyYears } = require('../support/commands')

const tagName = `tag-${new Date().getTime()}`

const selectYear = year => {
  // ? Testing the MUI X DatePicker seems very difficult. It does not detect data-cy and the tests fail in CI/CD
  cy.contains('Associated start year (optional)').click({ force: true })
  cy.get('[placeholder=YYYY]').type(year)
}

const deleteTag = tagName => {
  cy.cs(`delete-tag-${tagName}-button`).click()
  cy.contains('Delete tag')
  cy.contains('Are you sure you want to delete tag')
  cy.cs('confirm-delete-tag-button').click()
}

describe('Study programme overview', () => {
  describe('Study programme selector', () => {
    beforeEach(() => {
      cy.init('/study-programme', 'admin')
    })

    it('Correct categories', () => {
      cy.contains('Bachelor programmes')
      cy.contains('Master programmes')
      cy.contains('Combined programmes')
      cy.contains('Doctoral programmes')
    })

    it('Study programme search filter', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').should('exist')
      cy.contains('Matemaattisten tieteiden kandiohjelma').should('exist')
      cy.cs('study-programme-filter').type('Tietojenkäsittelytieteen')
      cy.contains('Tietojenkäsittelytieteen kandiohjelma').should('exist')
      cy.contains('Matemaattisten tieteiden kandiohjelma').should('not.exist')
    })

    it('Old and specialized programmes filter', () => {
      cy.contains('Biotekniikka (ylempi)').should('not.exist')
      cy.cs('filter-old-programmes-toggle').click()
      cy.contains('Biotekniikka (ylempi)').should('exist')
    })
  })

  describe('Basic information tab works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click({ force: true })
    })

    // If the backend breaks for one of the sections, the section header is not rendered and this will fail
    it('Basic information tab loads', () => {
      cy.cs('students-of-the-study-programme-section')
      cy.cs('credits-produced-by-the-study-programme-section')
      cy.cs('graduated-and-thesis-writers-of-the-programme-section')
      cy.cs('programmes-before-or-after-section')
      cy.cs('average-graduation-times-section')
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

      cy.checkTableStats(tableContents, 'students-of-the-study-programme')
    })

    it('Basic information contains correct credits', () => {
      const years = getEmptyYears()
      const tableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        [2023, 1519, 1519, 0, 0, 222],
        [2022, 3235, 3205, 0, 30, 209],
        [2021, 5133, 5108, 0, 25, 428],
        [2020, 5801, 5796, 0, 5, 94],
        [2019, 5305, 5305, 0, 0, 162],
        [2018, 3442, 3432, 0, 10, 21],
        [2017, 1211, 1211, 0, 0, 189],
      ]

      cy.checkTableStats(tableContents, 'credits-produced-by-the-study-programme')
    })

    it("Toggling 'Show special categories' on displays additional information", () => {
      cy.cs('special-categories-toggle').click()
      const years = getEmptyYears()
      const tableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0]),
        [2023, 1519, 1519, 0, 0, 0, 0, 222],
        [2022, 3235, 3205, 0, 30, 0, 0, 209],
        [2021, 5133, 5108, 0, 25, 0, 0, 428],
        [2020, 5801, 5796, 0, 5, 0, 0, 94],
        [2019, 5305, 5305, 0, 0, 0, 0, 162],
        [2018, 3442, 3432, 0, 10, 0, 0, 21],
        [2017, 1211, 1211, 0, 0, 0, 0, 189],
      ]

      cy.checkTableStats(tableContents, 'credits-produced-by-the-study-programme')
    })

    it('Basic information contains correct thesis writers and graduates', () => {
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2023, 26, 5],
        [2022, 48, 13],
        [2021, 47, 76],
        [2020, 12, 23],
        [2019, 1, 19],
        [2018, 0, 0],
        [2017, 0, 1],
      ]

      cy.checkTableStats(tableContents, 'graduated-and-graduations-of-the-programme')
    })

    it('Special study rights can be excluded and basic data changes accordingly', () => {
      cy.cs('study-right-toggle').click()
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

      cy.checkTableStats(studentTableContents, 'students-of-the-study-programme')

      const graduatedTableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2023, 24, 5],
        [2022, 44, 12],
        [2021, 46, 69],
        [2020, 11, 22],
        [2019, 1, 18],
        [2018, 0, 0],
        [2017, 0, 1],
      ]

      cy.checkTableStats(graduatedTableContents, 'graduated-and-graduations-of-the-programme')
    })

    it('Year can be changed to academic year, and data changes accordingly', () => {
      cy.cs('year-toggle').click()
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
      cy.checkTableStats(studentTableContents, 'students-of-the-study-programme')

      const creditTableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        ['2023 - 2024', 160, 160, 0, 0, 67],
        ['2022 - 2023', 2725, 2720, 0, 5, 337],
        ['2021 - 2022', 4092, 4042, 0, 50, 198],
        ['2020 - 2021', 5420, 5415, 0, 5, 321],
        ['2019 - 2020', 6043, 6043, 0, 0, 101],
        ['2018 - 2019', 4856, 4851, 0, 5, 107],
        ['2017 - 2018', 2350, 2345, 0, 5, 26],
      ]

      cy.checkTableStats(creditTableContents, 'credits-produced-by-the-study-programme')
      cy.cs('year-toggle').click()
    })

    it('Basic information graphs render', () => {
      cy.cs('students-of-the-study-programme-line-graph-section')
        .should('contain', 'Started studying')
        .should('contain', 'Accepted')
        .should('contain', 'Graduated')
        .should('contain', 'Transferred away')
        .should('contain', 'Transferred to')

      cy.cs('credits-produced-by-the-study-programme-stacked-bar-chart-section')
        .should('contain', 'Degree students')
        .should('contain', 'Transferred')
        .should('contain', 5796)
        .should('contain', 428)

      cy.cs('graduated-and-thesis-writers-of-the-programme-bar-chart-section')
        .should('contain', 'Graduated students')
        .should('contain', 'Wrote thesis')
        .should('contain', 47)
        .should('contain', 76)

      cy.cs('bachelor-breakdown-bar-chart-section')
      cy.cs('graduation-time-toggle').click()
      cy.cs('bachelor-median-time-bar-chart-section').within(() => {
        cy.contains('Graduation year')
        cy.contains('2022')
        cy.contains('48 graduated').trigger('mouseover')
        cy.contains('48 students graduated in year 2022')
        cy.contains('median study time: 44.5 months')
        cy.contains('22 graduated on time')
        cy.contains('12 graduated max year overtime')
        cy.contains('14 graduated over year late')
      })

      cy.cs('programmes-before-or-after-stacked-bar-chart-section')
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

      cy.cs('bachelor-breakdown-bar-chart-section')
      cy.cs('master-breakdown-bar-chart-section')

      cy.cs('graduation-time-toggle').click()
      cy.cs('master-median-time-bar-chart-section').within(() => {
        cy.contains('Master study right')
        cy.contains('Graduation year')
        cy.contains('2021')
        cy.contains('2 graduated').trigger('mouseover')
        cy.contains('2 students graduated in year 2021')
        cy.contains('median study time: 25 months')
        cy.contains('1 graduated on time')
        cy.contains('1 graduated max year overtime')
        cy.contains('0 graduated over year late')
      })

      cy.cs('bachelor-median-time-bar-chart-section').within(() => {
        cy.contains('Bachelor + master study right')
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

  describe('Study tracks and class statistics tab works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click()
      cy.cs('study-tracks-and-class-statistics-tab').click()
    })

    describe('Info boxes', () => {
      it('Study track overview section', () => {
        cy.cs('study-track-overview-info-box-button').click()
        cy.cs('study-track-overview-info-box-content').contains('Opiskelijat, joiden')
      })

      it('Progress of students section', () => {
        cy.cs('progress-of-students-info-box-button').click()
        cy.cs('progress-of-students-info-box-content').contains('Kuvaa koulutusohjelmassa')
      })

      it('Average graduation times section', () => {
        cy.cs('average-graduation-times-info-box-button').click()
        cy.cs('average-graduation-times-info-box-content').contains('Yksittäinen palkki')
      })
    })

    it('All sections are visible', () => {
      cy.cs('study-track-selector-section')
      cy.cs('study-track-overview-section')
      cy.cs('progress-of-students-section')
      cy.cs('average-graduation-times-section')
    })

    it('Students of the study programme are shown correctly', () => {
      const tableContents = [
        // [Year, All, Started studying, Present, Absent, Inactive, Graduated, Men, Women, Other/Unknown, Finland, Other]
        ['2023 - 2024', 8, 8, 0, 0, 8, 0, 5, 3, 0, 8, 1],
        ['2022 - 2023', 26, 25, 0, 0, 24, 2, 19, 7, 0, 25, 1],
        ['2021 - 2022', 38, 29, 0, 0, 33, 5, 29, 9, 0, 36, 4],
        ['2020 - 2021', 30, 26, 0, 0, 11, 19, 15, 15, 0, 29, 3],
        ['2019 - 2020', 35, 28, 0, 0, 8, 27, 22, 13, 0, 35, 2],
        ['2018 - 2019', 45, 40, 0, 0, 6, 39, 26, 19, 0, 44, 1],
        ['2017 - 2018', 47, 41, 0, 0, 5, 42, 31, 16, 0, 47, 0],
        ['Total', 229, 197, 0, 0, 95, 134, 147, 82, 0, 224, 12],
      ]

      cy.checkTableStats(tableContents, 'study-tracks-and-class-statistics')
    })

    it.skip('Years in the students table can be expanded and study track data will be shown', () => {
      // TODO: Fix this test
      cy.cs('study-tracks-and-class-statistics-data-table').within(() => {
        cy.get('tbody tr.header-row')
          .eq(3)
          .within(() => {
            cy.get('td i.angle.right.icon').click()
          })

        const dataForStudyTracks = [
          ['Ekonometria, MAT-EKO', 2, 2, 0, 0, 0, 2, 1, 1, 0, 2, 0],
          ['Matematiikka, MAT-MAT', 13, 10, 0, 0, 1, 12, 7, 6, 0, 12, 3],
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

    describe('Population link button works for', () => {
      it('a single year', () => {
        cy.cs('2023-population-link-button').first().click()
        cy.contains('Matemaattisten tieteiden kandiohjelma 2023 - 2024')
        cy.contains('Class size 8 students')
      })

      it('total', () => {
        cy.cs('total-population-link-button').click()
        cy.contains('Matemaattisten tieteiden kandiohjelma')
        cy.contains('Class size 227 students')
      })

      it('Links to class statistics page with study track info included work', () => {
        cy.cs('show-study-tracks-button').first().click()
        cy.contains('td', 'Matematiikka (MAT-MAT)').within(() => {
          cy.get('a').click()
        })

        cy.contains('Matemaattisten tieteiden kandiohjelma 2022 - 2023')
        cy.contains('studytrack MAT-MAT')
        cy.contains('Class size 26 students')
        cy.contains('3 students out of 26 shown')
      })
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

      cy.checkTableStats(tableContents, 'study-programme-progress')
    })

    it('Progress section', () => {
      cy.cs('programme-progress-bar-chart-section')
        .should('contain', 'Less than 30 credits')
        .should('contain', '30–60 credits')
        .should('contain', 'At least 180 credits')
        .should('contain', '49.8%') // The percentage for total, at least 180 credits, to check that the graph renders

      cy.cs('programme-progress-bar-chart-section').contains('49.8%').trigger('mouseover', { force: true })
      cy.contains('At least 180 credits: 114')
    })

    it('Average graduation times section', () => {
      cy.cs('average-graduation-times-section').within(() => {
        cy.contains('2020 - 2021')
        cy.get('[aria-label="2020 - 2021, 15. On time."]').trigger('mouseover')
        cy.contains('On time: 15')
        cy.contains("Click a bar to view that year's study track level breakdown")
        cy.get('[aria-label="2019 - 2020, 22. On time."]').click()
        cy.contains('Year 2019 - 2020 by start year')
        cy.get('[aria-label="MAT-MAT, 14. On time."]').trigger('mouseover')
        cy.contains('Matematiikka')
        cy.contains('MAT-MAT')
        cy.contains('On time: 14')
      })

      cy.cs('graduation-time-toggle').click()

      cy.cs('average-graduation-times-section').within(() => {
        cy.contains('2020 - 2021')
        cy.contains('19 graduated').trigger('mouseover')
        cy.contains('From class of 2020 - 2021, 19/30 students have graduated')
        cy.contains('median study time: 33 months')
        cy.contains('15 graduated on time')
        cy.contains('3 graduated max year overtime')
        cy.contains('1 graduated over year late')
      })
    })

    describe('Study track can be changed', () => {
      beforeEach(() => {
        cy.cs('study-track-select').click()
        cy.contains('All students of the programme')
        cy.contains('Ekonometria')
        cy.contains('Tietojenkäsittelyteoria')
        cy.contains('Tilastotiede')
        cy.contains('Matematiikka').click()
      })

      it('Students of the study track are shown correctly', () => {
        cy.cs('study-track-overview-section').contains('Students of the study track MAT-MAT by starting year')
        const tableContents = [
          // [Year, All, Started studying, Present, Absent, Inactive, Graduated, Men, Women, Other/Unknown, Finland, Other]
          ['2022 - 2023', 3, 3, 0, 0, 1, 2, 2, 1, 0, 3, 0],
          ['2021 - 2022', 5, 1, 0, 0, 1, 4, 3, 2, 0, 5, 0],
          ['2020 - 2021', 13, 10, 0, 0, 1, 12, 7, 6, 0, 12, 3],
          ['2019 - 2020', 17, 14, 0, 0, 0, 17, 10, 7, 0, 17, 1],
          ['2018 - 2019', 23, 21, 0, 0, 2, 21, 11, 12, 0, 23, 0],
          ['2017 - 2018', 28, 24, 0, 0, 1, 27, 15, 13, 0, 28, 0],
          ['Total', 89, 73, 0, 0, 6, 83, 48, 41, 0, 88, 4],
        ]
        cy.checkTableStats(tableContents, 'study-tracks-and-class-statistics')
      })

      it('Links to class statistics page with study track info included work', () => {
        cy.cs('2020-population-link-button').first().click()

        cy.contains('Matemaattisten tieteiden kandiohjelma 2020 - 2021')
        cy.contains('studytrack MAT-MAT')
        cy.contains('Class size 30 students')
        cy.contains('10 students out of 30 shown')
      })

      it('Info message about missing progress stats is displayed', () => {
        cy.contains('Progress of students of the study track MAT-MAT by starting year')
        cy.contains('Progress data is currently only available for all students of the study programme.')
      })

      it.skip('Average graduation times are displayed correctly', () => {
        cy.get("[data-cy='Section-averageGraduationTimesStudyTracks']")
        cy.get("[data-cy='graduation-times-graph-breakdownBachelor']").within(() => {
          cy.contains('Start year')
          cy.contains('2020 - 2021')
          cy.get('[aria-label="2020 - 2021, 9. On time."]').trigger('mouseover')
          cy.contains('Graduated On time: 9 students')
        })

        cy.cs('graduation-time-toggle').click()
        cy.cs('bachelor-median-time-bar-chart').within(() => {
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

  describe('Programme courses tab works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click()
      cy.cs('programme-courses-tab').click()

      cy.cs('by-credit-type-section')
      cy.cs('by-credit-type-tab')
      cy.cs('by-semester-tab')
    })

    describe('By credit type tab', () => {
      beforeEach(() => {
        cy.get('tbody').within(() => {
          cy.get('tr')
            .eq(0)
            .within(() => {
              cy.get('td').eq(0).contains('Course')
              cy.get('td').eq(1).contains('MAT21001')
              cy.get('td').eq(2).contains('Lineaarialgebra ja matriisilaskenta II')
              cy.get('td').eq(3).contains('341')
            })
        })
      })

      it('time range selection works', () => {
        cy.cs('from-year-select').click()
        cy.cs('from-year-select-option-2021').click()
        cy.cs('to-year-select').click()
        cy.cs('to-year-select-option-2022').click()

        cy.get('tbody').within(() => {
          cy.get('tr')
            .eq(0)
            .within(() => {
              cy.get('td').eq(0).contains('Course')
              cy.get('td').eq(1).contains('MAT21001')
              cy.get('td').eq(2).contains('Lineaarialgebra ja matriisilaskenta II')
              cy.get('td').eq(3).contains('121')
            })
        })
      })

      it('year toggle works', () => {
        cy.cs('year-toggle').click()

        cy.cs('from-year-select').click()
        cy.cs('from-year-select-option-2017').click()
        cy.cs('to-year-select').click()
        cy.cs('to-year-select-option-2023').click()

        cy.get('tbody').within(() => {
          cy.get('tr')
            .eq(0)
            .within(() => {
              cy.get('td').eq(0).contains('Course')
              cy.get('td').eq(1).contains('MAT21001')
              cy.get('td').eq(2).contains('Lineaarialgebra ja matriisilaskenta II')
              cy.get('td').eq(3).contains('311')
            })
        })
      })

      // TODO: Fix sorting / filters
      it.skip('different sorting options work', () => {
        cy.cs('CoursesSortableTable').within(() => {
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
        cy.get('thead tr').within(() => {
          cy.get('th').should('have.length', 8)
          const headers = ['Type', 'Code', 'Name', 'Total', 'Major', 'Non-major', 'Non-degree', 'Transferred']
          headers.forEach((header, index) => {
            cy.get('th').eq(index).contains(header)
          })
        })

        cy.cs('show-credits-students-toggle').click()

        cy.get('thead tr')
          .eq(1)
          .within(() => {
            cy.get('th').should('have.length', 10)
            const headers = [
              'Type',
              'Code',
              'Name',
              'Total',
              'Passed',
              'Not',
              'Major',
              'Non-major',
              'Non-degree',
              'Transferred',
            ]
            headers.forEach((header, index) => {
              cy.get('th').eq(index).contains(header)
            })
          })

        cy.get('tbody').within(() => {
          cy.get('tr')
            .eq(0)
            .within(() => {
              cy.get('td').eq(0).contains('Course')
              cy.get('td').eq(1).contains('MAT21001')
              cy.get('td').eq(2).contains('Lineaarialgebra ja matriisilaskenta II')
              cy.get('td').eq(3).contains('341')
            })
        })
      })
    })

    describe('By semester tab', () => {
      beforeEach(() => {
        cy.cs('by-semester-tab').click()
      })

      it('test', () => {
        // TODO: Implement some real tests for this tab
        cy.contains('From')
      })
    })
  })

  describe('Degree courses tab works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click()
      cy.cs('degree-courses-tab').click()
    })

    it('Curriculum section', () => {
      cy.cs('curriculum-section')
      cy.contains('Select curriculum to edit:')
      cy.cs('curriculum-picker').contains('2023–2026')
      // TODO: Test changing the curriculum
    })

    describe('Credit criteria section', () => {
      it('info box', () => {
        cy.cs('credit-criteria-section')
        cy.cs('credit-criteria-info-box-button').click()
        cy.cs('credit-criteria-info-box-content').contains('Here you can change')
      })

      it.skip('changing the credit criteria works', () => {
        // TODO: Test using the inputs
        // TODO: Button status
        // TODO: Test "previously set to _" text changing when saving
      })
    })

    it('Degree course table', () => {
      cy.cs('degree-course-table')
      // TODO: Test clicking the arrow buttons
      // TODO: Test toggling visibility for MODULES and COURSES
      // TODO: Test changing criterion labels
    })
  })

  describe('Tags tab works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click({ force: true })
      cy.cs('tags-tab').click()
    })

    it('info box', () => {
      cy.cs('create-new-tag-info-box-button').click()
      cy.cs('create-new-tag-info-box-content').contains('Here you can create')
    })

    describe('Adding tags to populations and removing them works', () => {
      beforeEach(() => {
        cy.contains('This study programme does not have any tags yet')
        cy.cs('tag-name-text-field').type(tagName)
      })

      afterEach(() => {
        deleteTag(tagName)
        cy.contains('This study programme does not have any tags yet')
      })

      it('can create and delete tags without start year', () => {
        cy.cs('create-button').click()
        cy.contains(tagName)
        cy.contains('No associated start year')
      })

      it.skip('can create and delete tags with start year', () => {
        // TODO: This test fails in the pipeline, but works locally. Investigate.
        selectYear('2022')
        cy.cs('create-button').click()
        cy.contains(tagName)
        cy.contains('Associated start year 2022')
      })

      it.skip('population link works', () => {
        // TODO: This test fails in the pipeline, but works locally. Investigate.
        selectYear('2022')
        cy.cs('create-button').click()
        cy.contains(tagName)
        cy.cs('population-link-button').click()
        cy.contains(`Tagged with: ${tagName}`)
        cy.go('back')
      })

      it('can create personal tags', () => {
        cy.cs('personal-tag-toggle').click()
        cy.cs('create-button').click()
        cy.contains(tagName)
        cy.cs(`${tagName}-visibility-icon`)
      })
    })

    describe('Adding tags to students and removing them works', () => {
      const studentInput = '477806,478275;   478953  479239\n   480080'
      const studentNumbers = studentInput.match(/[^\s,;]+/g)

      it.skip('can add tags to students', () => {
        // TODO: This test fails in the pipeline, but works locally. Investigate.
        cy.cs('tag-name-text-field').type(tagName)
        selectYear('2022')
        cy.cs('create-button').click()
        cy.contains(tagName)

        cy.cs('add-students-button').click()
        cy.cs('add-students-text-field').type(studentInput)
        cy.cs('add-students-confirm-button').click()
        cy.contains('Students added to tag')

        cy.cs('population-link-button').click()
        cy.contains('Matemaattisten tieteiden kandiohjelma 2022 - 2023')
        cy.contains(`Tagged with: ${tagName}`)
        cy.contains('Students (5)')
          .parent()
          .then($parentDiv => {
            if (!$parentDiv.hasClass('active')) cy.contains('Students (5)').click()
          })

        for (const studentNumber of studentNumbers) {
          cy.contains(studentNumber)
        }

        for (const studentNumber of studentNumbers) {
          cy.visit(`/students/${studentNumber}`)
          cy.contains('Tags')
          cy.contains(tagName)
        }

        cy.get('a').contains('Matemaattisten tieteiden kandiohjelma').invoke('removeAttr', 'target').click()
        cy.url().should('include', '/study-programme/KH50_001?tab=4')

        deleteTag(tagName)
      })

      it('deleting a tag from tag view also removes it from students', () => {
        cy.contains(tagName).should('not.exist')
        for (const studentNumber of studentNumbers) {
          cy.visit(`/students/${studentNumber}`)
          cy.contains('Tags').should('not.exist')
          cy.contains(tagName).should('not.exist')
        }
      })
    })
  })

  describe('IAM user', () => {
    beforeEach(() => {
      cy.init('/study-programme', 'onlyiamrights')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click()
    })

    it.skip('year selector', () => {
      // TODO: Implement this test
      // Things to test:
      // - Clicking the button works
      // - Selecting a study track works
      // - The button is disabled if only one year is selected
      // - The slider is not visible if the user does not have correct programme rights
    })

    it('can access programme and correct tabs are visible', () => {
      cy.contains('Basic information')
      cy.contains('Study tracks and class statistics')

      cy.contains('Update statistics').should('not.exist')
      cy.contains('Degree courses').should('not.exist')
    })

    it('can access basic information', () => {
      cy.cs('basic-information-tab').click()

      cy.cs('students-of-the-study-programme-section')
      cy.cs('credits-produced-by-the-study-programme-section')
      cy.cs('graduated-and-thesis-writers-of-the-programme-section')
      cy.cs('average-graduation-times-section')
      cy.cs('programmes-before-or-after-section')
    })

    it('can access study tracks', () => {
      cy.cs('study-tracks-and-class-statistics-tab').click()

      cy.cs('study-track-overview-section')
      cy.cs('progress-of-students-section')
      cy.cs('average-graduation-times-section')
    })

    it("doesn't see other tabs", () => {
      cy.cs('degree-courses-tab').should('not.exist')
      cy.cs('tags-tab').should('not.exist')
      cy.cs('update-statistics-tab').should('not.exist')
    })
  })
})
