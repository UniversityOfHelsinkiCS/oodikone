/// <reference types="cypress" />

const { getEmptyYears } = require('../support/commands')

describe('Evaluation overview', () => {
  describe('Programme view', () => {
    beforeEach(() => {
      cy.init('/evaluationoverview/programme/KH50_005', 'admin')
    })

    it('Page opens correctly', () => {
      cy.contains('Tietojenkäsittelytieteen kandiohjelma')
      cy.contains('KH50_005')
      cy.contains("This view is an abridged version of Oodikone's Studyprogramme Overview")
    })

    it('Progress data is shown correctly with graduated included', () => {
      cy.get('[data-cy="Graph-StudytrackProgress"]').within(() => {
        const stats = ['30.6', '38.8', '24.7', '5.9']
        for (const stat of stats) {
          cy.contains(`${stat}%`)
        }
      })
      const years = getEmptyYears(true)
      const tableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
        ['2021 - 2022', 0, 0, 0, 0, 0, 0, 0, 0],
        ['2020 - 2021', 10, 10, 0, 0, 0, 0, 0, 0],
        ['2019 - 2020', 85, 26, 33, 21, 5, 0, 0, 0],
        ['2018 - 2019', 159, 10, 27, 47, 34, 25, 12, 4],
        ['2017 - 2018', 170, 20, 21, 26, 22, 22, 32, 27],
        ['Total', 424, 66, 81, 94, 61, 47, 44, 31],
      ]

      cy.checkTableStats(tableContents, 'StudytrackProgress')
    })

    it('Progress data is shown correctly with graduated excluded', () => {
      cy.get('[data-cy=GraduatedToggle]').click()
      cy.get('[data-cy="Graph-StudytrackProgress"]').within(() => {
        const stats = ['31.0', '38.1', '25.0', '6.0']
        for (const stat of stats) {
          cy.contains(`${stat}%`)
        }
      })
      const years = getEmptyYears(true)
      const tableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
        ['2021 - 2022', 0, 0, 0, 0, 0, 0, 0, 0],
        ['2020 - 2021', 10, 10, 0, 0, 0, 0, 0, 0],
        ['2019 - 2020', 84, 26, 32, 21, 5, 0, 0, 0],
        ['2018 - 2019', 148, 10, 26, 43, 34, 24, 11, 0],
        ['2017 - 2018', 129, 20, 21, 26, 20, 18, 17, 7],
        ['Total', 371, 66, 79, 90, 59, 42, 28, 7],
      ]

      cy.checkTableStats(tableContents, 'StudytrackProgress')
    })

    it('Graduation times breakdown data is shown correctly', () => {
      cy.get('[data-cy=graduation-times-graph-breakdown]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2019')
        cy.get('[aria-label="2020, 30. On time."]').trigger('mouseover')
        cy.contains('Graduated On time: 30 students')
      })

      cy.get('[data-cy=YearToggle]').click()

      cy.get('[data-cy=graduation-times-graph-breakdown]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2019 - 2020')
        cy.get('[aria-label="2019 - 2020, 38. On time."]').trigger('mouseover')
        cy.contains('Graduated On time: 38 students')
      })
    })

    it('Graduation times median time data is shown correctly', () => {
      cy.get('[data-cy=GraduationTimeToggle]').click()

      cy.get('[data-cy=graduation-times-graph]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2020')
        cy.contains('35 graduated').trigger('mouseover')
        cy.contains('35 students graduated in year 2020')
        cy.contains('median study time: 34 months')
        cy.contains('30 graduated on time')
        cy.contains('5 graduated max year overtime')
        cy.contains('0 graduated over year late')
      })

      cy.get('[data-cy=YearToggle]').click()

      cy.get('[data-cy=graduation-times-graph]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2020 - 2021')
        cy.contains('6 graduated').trigger('mouseover')
        cy.contains('6 students graduated in year 2020 - 2021')
        cy.contains('median study time: 37 months')
        cy.contains('1 graduated on time')
        cy.contains('5 graduated max year overtime')
        cy.contains('0 graduated over year late')
      })
    })

    it("'Programmes before or after' data is shown correctly", () => {
      cy.get('[data-cy=Graph-ProgrammesBeforeOrAfter]').within(() => {
        cy.contains('Matematiikan ja tilastotieteen maisteriohjelma')
        cy.contains('Tietojenkäsittelytieteen maisteriohjelma')
        cy.contains('Datatieteen maisteriohjelma')
        cy.contains('2020')
        cy.contains('24')
        cy.contains('11')
      })

      let emptyYears = new Array(getEmptyYears(false).length).fill(0)

      let tableContents = [
        ['MH50_001', 'MAST', 'Matematiikan ja tilastotieteen maisteriohjelma', 0, 0, 0, 1, 0, ...emptyYears],
        ['MH50_009', 'CSM', 'Tietojenkäsittelytieteen maisteriohjelma', 0, 0, 12, 24, 0, ...emptyYears],
        ['MH50_010', 'DATA', 'Datatieteen maisteriohjelma', 0, 1, 4, 11, 0, ...emptyYears],
      ]

      cy.checkTableStats(tableContents, 'undefined')

      cy.get('[data-cy=YearToggle]').click()

      cy.get('[data-cy=Graph-ProgrammesBeforeOrAfter]').within(() => {
        cy.contains('Matematiikan ja tilastotieteen maisteriohjelma')
        cy.contains('Tietojenkäsittelytieteen maisteriohjelma')
        cy.contains('Datatieteen maisteriohjelma')
        cy.contains('2019 - 2020')
        cy.contains('27')
        cy.contains('13')
      })

      emptyYears = new Array(getEmptyYears(true).length).fill(0)

      tableContents = [
        ['MH50_001', 'MAST', 'Matematiikan ja tilastotieteen maisteriohjelma', 0, 0, 1, 0, ...emptyYears],
        ['MH50_009', 'CSM', 'Tietojenkäsittelytieteen maisteriohjelma', 0, 4, 27, 5, ...emptyYears],
        ['MH50_010', 'DATA', 'Datatieteen maisteriohjelma', 1, 1, 13, 1, ...emptyYears],
      ]

      cy.checkTableStats(tableContents, 'undefined')
    })
  })

  describe('Faculty view', () => {
    beforeEach(() => {
      cy.init('/evaluationoverview/faculty/H50', 'admin')
    })

    it('Page opens correctly', () => {
      cy.contains('Matemaattis-luonnontieteellinen tiedekunta')
      cy.contains('H50')
      cy.contains("This view is an abridged version of Oodikone's Faculty Overview")
    })

    describe('Progress stats', () => {
      describe('Bachelor stats', () => {
        it('graph with graduated included is shown correctly', () => {
          cy.get('[data-cy="Graph-FacultyBachelorsProgress"]').within(() => {
            const totalStats = ['15.8', '19.1', '22.1', '14.4', '11.1', '10.4', '7.3']
            for (const stat of totalStats) {
              cy.contains(`${stat}%`)
            }
          })
        })

        it('graph with graduated excluded is shown correctly', () => {
          cy.get('[data-cy="GraduatedToggle"]').click()
          cy.get('[data-cy="Graph-FacultyBachelorsProgress"]').within(() => {
            const totalStats = ['18.0', '21.2', '24.2', '15.9', '11.3', '7.5', '1.9']
            for (const stat of totalStats) {
              cy.contains(`${stat}%`)
            }
          })
        })

        it('table with graduated included is shown correctly', () => {
          cy.get('[data-cy="Table-FacultyBachelorsProgress"]')
          const tableContents = [
            ...getEmptyYears(true).map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
            ['2021 - 2022', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2020 - 2021', 11, 11, 0, 0, 0, 0, 0, 0],
            ['2019 - 2020', 85, 26, 33, 21, 5, 0, 0, 0],
            ['2018 - 2019', 159, 10, 27, 47, 34, 25, 12, 4],
            ['2017 - 2018', 170, 20, 21, 26, 22, 22, 32, 27],
            ['Total', 425, 67, 81, 94, 61, 47, 44, 31],
          ]
          cy.checkTableStats(tableContents, 'FacultyBachelorsProgress')
        })

        it('table with graduated excluded is shown correctly', () => {
          cy.get('[data-cy="GraduatedToggle"]').click()
          cy.get('[data-cy="Table-FacultyBachelorsProgress"]')
          const tableContents = [
            ...getEmptyYears(true).map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
            ['2021 - 2022', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2020 - 2021', 11, 11, 0, 0, 0, 0, 0, 0],
            ['2019 - 2020', 84, 26, 32, 21, 5, 0, 0, 0],
            ['2018 - 2019', 148, 10, 26, 43, 34, 24, 11, 0],
            ['2017 - 2018', 129, 20, 21, 26, 20, 18, 17, 7],
            ['Total', 372, 67, 79, 90, 59, 42, 28, 7],
          ]
          cy.checkTableStats(tableContents, 'FacultyBachelorsProgress')
        })
      })

      describe('Bachelor + master stats', () => {
        it('graph with graduated included is shown correctly', () => {
          cy.get('[data-cy=Graph-FacultyBachelorMastersProgress]').within(() => {
            const stats = ['72.7', '9.1', '9.1', '0.0', '9.1']
            for (const stat of stats) {
              cy.contains(`${stat}%`)
            }
          })
        })

        it('graph with graduated excluded is shown correctly', () => {
          cy.get('[data-cy="GraduatedToggle"]').click()
          cy.get('[data-cy=Graph-FacultyBachelorMastersProgress]').within(() => {
            const stats = ['74.1', '11.1', '5.6', '3.7', '1.9']
            for (const stat of stats) {
              cy.contains(`${stat}%`)
            }
          })
        })

        it('table with graduated included is shown correctly', () => {
          cy.get('[data-cy="Table-FacultyBachelorMastersProgress"]')
          const tableContents = [
            ...getEmptyYears(true).map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
            ['2021 - 2022', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2020 - 2021', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2019 - 2020', 1, 1, 0, 0, 0, 0, 0, 0],
            ['2018 - 2019', 11, 8, 1, 1, 0, 1, 0, 0],
            ['2017 - 2018', 42, 31, 5, 2, 2, 0, 1, 1],
            ['Total', 54, 40, 6, 3, 2, 1, 1, 1],
          ]
          cy.checkTableStats(tableContents, 'FacultyBachelorMastersProgress')
        })
      })

      describe('Master stats', () => {
        it('graph with graduated included is shown correctly', () => {
          cy.get('[data-cy=Graph-FacultyMastersProgress]').within(() => {
            cy.contains('100.0%')
            cy.contains('0.0%')
          })
        })

        it('table with graduated included is shown correctly', () => {
          cy.get('[data-cy="Table-FacultyMastersProgress"]')
          const tableContents = [
            ...getEmptyYears(true).map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
            ['2021 - 2022', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2020 - 2021', 2, 2, 0, 0, 0, 0, 0, 0],
            ['2019 - 2020', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2018 - 2019', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2017 - 2018', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Total', 2, 2, 0, 0, 0, 0, 0, 0],
          ]
          cy.checkTableStats(tableContents, 'FacultyMastersProgress')
        })
      })

      it('Years in the tables can be clicked to show programme level breakdown', () => {
        cy.get('[data-cy="Table-FacultyBachelorsProgress"]').within(() => {
          cy.contains('2017 - 2018').click()
          cy.contains('16.5%').trigger('mouseover', { force: true })
          cy.contains('Tietojenkäsittelytieteen kandiohjelma')
          cy.contains('TKT - KH50_005')
          cy.contains('0 Credits: 0')
          cy.contains('1 ≤ Credits < 45: 28')
          cy.contains('45 ≤ Credits < 90: 39')
          cy.contains('90 ≤ Credits < 135: 30')
          cy.contains('135 ≤ Credits < 180: 46')
          cy.contains('180 ≤ Credits: 27')
        })
      })
    })

    describe('Graduation times stats', () => {
      it('All the correct sections are displayed', () => {
        const checkSections = breakdown => {
          const sections = ['bachelor', 'bcMsCombo', 'master']
          for (const section of sections) {
            cy.get(`[data-cy=Section-${section}]`).within(() => {
              cy.get('div.graduations-chart-container').within(() => {
                cy.get(`div.faculty-${breakdown ? 'breakdown-' : ''}graph`)
                cy.get('div.graduations-message').contains("Click a bar to view that year's programme level breakdown")
              })
            })
          }
        }

        checkSections(true)
        cy.get('[data-cy=GraduationTimeToggle]').click()
        checkSections(false)
      })

      it('Graduation times breakdown data is shown correctly', () => {
        cy.get('[data-cy=Section-bachelor]').within(() => {
          cy.contains('Graduation year')
          cy.contains('2020')

          cy.get('[aria-label="2020, 31. On time."]').trigger('mouseover')
          cy.contains('On time: 31')

          cy.get('[aria-label="2020, 31. On time."]').trigger('click')
          cy.contains('Year 2020 by graduation year')

          cy.get('[aria-label="TKT, 30. On time."]').trigger('mouseover')
          cy.contains('Tietojenkäsittelytieteen kandiohjelma')
          cy.contains('KH50_005')
          cy.contains('On time: 30')
        })
      })

      it('Graduation times median time data is shown correctly', () => {
        cy.get('[data-cy=GraduationTimeToggle]').click()

        cy.get('[data-cy=Section-bachelor]').within(() => {
          cy.contains('Graduation year')
          cy.contains('2019')

          cy.contains('18 graduated').trigger('mouseover')
          cy.contains('18 students graduated in year 2019')
          cy.contains('median study time: 24 months')
          cy.contains('17 graduated on time')
          cy.contains('1 graduated max year overtime')
          cy.contains('0 graduated over year late')

          cy.contains('18 graduated').trigger('click')
          cy.contains('Year 2019 by graduation year')

          cy.get('[aria-label="FYS, 40."]').trigger('mouseover')
          cy.contains('Fysikaalisten tieteiden kandiohjelma')
          cy.contains('KH50_002')
          cy.contains('1 students graduated in year 2019')
          cy.contains('median study time: 40 months')
          cy.contains('0 graduated on time')
          cy.contains('1 graduated max year overtime')
          cy.contains('0 graduated over year late')
        })
      })
    })
  })
})
