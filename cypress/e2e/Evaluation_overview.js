/// <reference types="cypress" />

const { getEmptyYears } = require('../support/commands')

describe('Evaluation overview', () => {
  describe('Programme view', () => {
    beforeEach(() => {
      cy.init('/evaluationoverview/programme/KH50_001', 'admin')
    })

    it('Page opens correctly', () => {
      cy.contains('Matemaattisten tieteiden kandiohjelma')
      cy.contains('KH50_001')
      cy.contains("This view is an abridged version of Oodikone's Studyprogramme Overview")
    })

    it('Progress data is shown correctly with graduated included', () => {
      cy.get('[data-cy="Graph-StudytrackProgress"]').within(() => {
        const totalStats = ['13.4%', '6.9%', '9.2%', '9.2%', '4.6%', '6.0%', '50.7%']
        for (const stat of totalStats) {
          cy.contains(stat)
        }
      })

      const years = getEmptyYears(true)

      const tableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
        ['2023 - 2024', 8, 8, 0, 0, 0, 0, 0, 0],
        ['2022 - 2023', 26, 9, 9, 4, 3, 0, 1, 0],
        ['2021 - 2022', 32, 9, 2, 8, 8, 5, 0, 0],
        ['2020 - 2021', 27, 2, 1, 3, 6, 2, 4, 9],
        ['2019 - 2020', 33, 1, 1, 1, 1, 1, 3, 25],
        ['2018 - 2019', 44, 0, 1, 1, 2, 0, 4, 36],
        ['2017 - 2018', 47, 0, 1, 3, 0, 2, 1, 40],
        ['Total', 217, 29, 15, 20, 20, 10, 13, 110],
      ]

      cy.checkTableStats(tableContents, 'StudytrackProgress')
    })

    it('Progress data is shown correctly with graduated excluded', () => {
      cy.get('[data-cy=GraduatedToggle]').click()
      cy.get('[data-cy="Graph-StudytrackProgress"]').within(() => {
        const totalStats = ['31.9%', '15.4%', '20.9%', '20.9%', '5.5%', '4.4%']
        for (const stat of totalStats) {
          cy.contains(stat)
        }
      })

      const years = getEmptyYears(true)

      const tableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
        ['2023 - 2024', 8, 8, 0, 0, 0, 0, 0, 0],
        ['2022 - 2023', 24, 9, 8, 4, 3, 0, 0, 0],
        ['2021 - 2022', 31, 9, 2, 8, 8, 4, 0, 0],
        ['2020 - 2021', 11, 2, 1, 2, 5, 0, 0, 1],
        ['2019 - 2020', 7, 1, 1, 1, 1, 0, 1, 2],
        ['2018 - 2019', 5, 0, 1, 1, 2, 0, 0, 1],
        ['2017 - 2018', 5, 0, 1, 3, 0, 1, 0, 0],
        ['Total', 91, 29, 14, 19, 19, 5, 1, 4],
      ]

      cy.checkTableStats(tableContents, 'StudytrackProgress')
    })

    it('Graduation times breakdown data is shown correctly', () => {
      cy.get('[data-cy=graduation-times-graph-breakdown]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2021')
        cy.get('[aria-label="2021, 8. Overtime."]')
        cy.get('[aria-label="2021, 24. Max. year overtime."]')
        cy.get('[aria-label="2021, 14. On time."]').trigger('mouseover')
        cy.contains('Graduated On time: 14 students')
      })

      cy.get('[data-cy=YearToggle]').click()

      cy.get('[data-cy=graduation-times-graph-breakdown]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2021 - 2022')
        cy.get('[aria-label="2021 - 2022, 13. Overtime."]')
        cy.get('[aria-label="2021 - 2022, 21. Max. year overtime."]')
        cy.get('[aria-label="2021 - 2022, 21. On time."]').trigger('mouseover')
        cy.contains('Graduated On time: 21 students')
      })
    })

    it('Graduation times median time data is shown correctly', () => {
      cy.get('[data-cy=GraduationTimeToggle]').click()

      cy.get('[data-cy=graduation-times-graph]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2021')
        cy.contains('46 graduated').trigger('mouseover')
        cy.contains('46 students graduated in year 2021')
        cy.contains('median study time: 41 months')
        cy.contains('14 graduated on time')
        cy.contains('24 graduated max year overtime')
        cy.contains('8 graduated over year late')
      })

      cy.get('[data-cy=YearToggle]').click()

      cy.get('[data-cy=graduation-times-graph]').within(() => {
        cy.contains('Graduation year')
        cy.contains('2021 - 2022')
        cy.contains('55 graduated').trigger('mouseover')
        cy.contains('55 students graduated in year 2021 - 2022')
        cy.contains('median study time: 40 months')
        cy.contains('21 graduated on time')
        cy.contains('21 graduated max year overtime')
        cy.contains('13 graduated over year late')
      })
    })

    it("'Programmes before or after' data is shown correctly", () => {
      cy.get('[data-cy=Graph-ProgrammesBeforeOrAfter]').within(() => {
        cy.contains('Matematiikan ja tilastotieteen maisteriohjelma')
        cy.contains('Tietojenkäsittelytieteen maisteriohjelma')
        cy.contains('Datatieteen maisteriohjelma')
        cy.contains('2021')
        cy.contains('32')
        cy.contains('19')
      })

      let emptyYears = new Array(getEmptyYears(false).length).fill(0)

      let tableContents = [
        ['MH50_001', 'MAST', 'Matematiikan ja tilastotieteen maisteriohjelma', 0, 0, 1, 9, 32, 19, 15, ...emptyYears],
        ['MH50_002', 'LSI', 'Life Science Informatics -maisteriohjelma', 0, 0, 0, 1, 2, 1, 1, ...emptyYears],
        [
          'MH50_003',
          'TCM',
          'Teoreettisten ja laskennallisten menetelmien maisteriohjelma',
          0,
          0,
          0,
          0,
          1,
          2,
          1,
          ...emptyYears,
        ],
        ['MH50_009', 'CSM', 'Tietojenkäsittelytieteen maisteriohjelma', 0, 0, 0, 0, 2, 3, 2, ...emptyYears],
        ['MH50_010', 'DATA', 'Datatieteen maisteriohjelma', 0, 0, 0, 1, 5, 10, 1, ...emptyYears],
        ['MH70_009', 'ECON', 'Taloustieteen maisteriohjelma', 0, 0, 0, 0, 4, 7, 4, ...emptyYears],
      ]

      cy.checkTableStats(tableContents, 'undefined')

      cy.get('[data-cy=YearToggle]').click()

      cy.get('[data-cy=Graph-ProgrammesBeforeOrAfter]').within(() => {
        cy.contains('Matematiikan ja tilastotieteen maisteriohjelma')
        cy.contains('Tietojenkäsittelytieteen maisteriohjelma')
        cy.contains('Datatieteen maisteriohjelma')
        cy.contains('2021 - 2022')
        cy.contains('28')
        cy.contains('16')
      })

      emptyYears = new Array(getEmptyYears(true).length).fill(0)

      tableContents = [
        ['MH50_001', 'MAST', 'Matematiikan ja tilastotieteen maisteriohjelma', 0, 0, 4, 24, 28, 16, 4, ...emptyYears],
        ['MH50_002', 'LSI', 'Life Science Informatics -maisteriohjelma', 0, 0, 1, 0, 3, 1, 0, ...emptyYears],
        [
          'MH50_003',
          'TCM',
          'Teoreettisten ja laskennallisten menetelmien maisteriohjelma',
          0,
          0,
          0,
          1,
          1,
          2,
          0,
          ...emptyYears,
        ],
        ['MH50_009', 'CSM', 'Tietojenkäsittelytieteen maisteriohjelma', 0, 0, 0, 0, 4, 3, 0, ...emptyYears],
        ['MH50_010', 'DATA', 'Datatieteen maisteriohjelma', 0, 0, 1, 0, 12, 4, 0, ...emptyYears],
        ['MH70_009', 'ECON', 'Taloustieteen maisteriohjelma', 0, 0, 0, 4, 6, 5, 0, ...emptyYears],
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
            const totalStats = ['12.5%', '5.6%', '6.9%', '8.5%', '5.6%', '6.6%', '54.2%']
            for (const stat of totalStats) {
              cy.contains(stat)
            }
          })
        })

        it('graph with graduated excluded is shown correctly', () => {
          cy.get('[data-cy="GraduatedToggle"]').click()
          cy.get('[data-cy="Graph-FacultyBachelorsProgress"]').within(() => {
            const totalStats = ['31.3%', '13.3%', '16.4%', '20.3%', '7.0%', '3.1%', '8.6%']
            for (const stat of totalStats) {
              cy.contains(stat)
            }
          })
        })

        it('table with graduated included is shown correctly', () => {
          cy.get('[data-cy="Table-FacultyBachelorsProgress"]')
          const years = getEmptyYears(true)
          const tableContents = [
            ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
            ['2023 - 2024', 14, 13, 0, 0, 0, 0, 0, 1],
            ['2022 - 2023', 32, 11, 10, 6, 4, 0, 1, 0],
            ['2021 - 2022', 44, 11, 4, 8, 11, 7, 1, 2],
            ['2020 - 2021', 38, 3, 1, 3, 7, 3, 8, 13],
            ['2019 - 2020', 50, 2, 1, 1, 2, 4, 6, 34],
            ['2018 - 2019', 75, 0, 1, 1, 2, 2, 4, 65],
            ['2017 - 2018', 66, 0, 1, 3, 1, 2, 1, 58],
            ['Total', 319, 40, 18, 22, 27, 18, 21, 173],
          ]
          cy.checkTableStats(tableContents, 'FacultyBachelorsProgress')
        })

        it('table with graduated excluded is shown correctly', () => {
          cy.get('[data-cy="GraduatedToggle"]').click()
          cy.get('[data-cy="Table-FacultyBachelorsProgress"]')
          const years = getEmptyYears(true)
          const tableContents = [
            ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
            ['2023 - 2024', 14, 13, 0, 0, 0, 0, 0, 1],
            ['2022 - 2023', 30, 11, 9, 6, 4, 0, 0, 0],
            ['2021 - 2022', 41, 11, 4, 8, 11, 6, 0, 1],
            ['2020 - 2021', 14, 3, 1, 2, 6, 0, 1, 1],
            ['2019 - 2020', 14, 2, 1, 1, 2, 2, 3, 3],
            ['2018 - 2019', 6, 0, 1, 1, 2, 0, 0, 2],
            ['2017 - 2018', 9, 0, 1, 3, 1, 1, 0, 3],
            ['Total', 128, 40, 17, 21, 26, 9, 4, 11],
          ]
          cy.checkTableStats(tableContents, 'FacultyBachelorsProgress')
        })
      })

      describe('Bachelor + master stats', () => {
        it('graph with graduated included is shown correctly', () => {
          cy.get('[data-cy=Graph-FacultyBachelorMastersProgress]').within(() => {
            const totalStats = ['23.6%', '9.6%', '10.7%', '12.9%', '12.4%', '11.2%', '19.7%']
            for (const stat of totalStats) {
              cy.contains(stat)
            }
          })
        })

        it('graph with graduated excluded is shown correctly', () => {
          cy.get('[data-cy="GraduatedToggle"]').click()
          cy.get('[data-cy=Graph-FacultyBachelorMastersProgress]').within(() => {
            const totalStats = ['31.8%', '12.4%', '14.7%', '16.3%', '14.7%', '3.9%', '6.2%']
            for (const stat of totalStats) {
              cy.contains(stat)
            }
          })
        })

        it('table with graduated included is shown correctly', () => {
          cy.get('[data-cy="Table-FacultyBachelorMastersProgress"]')
          const years = getEmptyYears(true)
          const tableContents = [
            ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
            ['2023 - 2024', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2022 - 2023', 2, 2, 0, 0, 0, 0, 0, 0],
            ['2021 - 2022', 4, 2, 0, 0, 0, 1, 0, 1],
            ['2020 - 2021', 23, 14, 3, 3, 0, 3, 0, 0],
            ['2019 - 2020', 32, 7, 7, 7, 4, 4, 3, 0],
            ['2018 - 2019', 63, 12, 1, 6, 13, 5, 11, 15],
            ['2017 - 2018', 54, 5, 6, 3, 6, 9, 6, 19],
            ['Total', 178, 42, 17, 19, 23, 22, 20, 35],
          ]
          cy.checkTableStats(tableContents, 'FacultyBachelorMastersProgress')
        })

        it('table with graduated excluded is shown correctly', () => {
          cy.get('[data-cy="GraduatedToggle"]').click()
          cy.get('[data-cy="Table-FacultyBachelorMastersProgress"]')
          const years = getEmptyYears(true)
          const tableContents = [
            ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
            ['2023 - 2024', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2022 - 2023', 2, 2, 0, 0, 0, 0, 0, 0],
            ['2021 - 2022', 4, 2, 0, 0, 0, 1, 0, 1],
            ['2020 - 2021', 21, 14, 2, 3, 0, 2, 0, 0],
            ['2019 - 2020', 31, 7, 7, 7, 4, 4, 2, 0],
            ['2018 - 2019', 41, 11, 1, 6, 12, 5, 2, 4],
            ['2017 - 2018', 30, 5, 6, 3, 5, 7, 1, 3],
            ['Total', 129, 41, 16, 19, 21, 19, 5, 8],
          ]
          cy.checkTableStats(tableContents, 'FacultyBachelorMastersProgress')
        })
      })

      describe('Master stats', () => {
        it('graph with graduated included is shown correctly', () => {
          cy.get('[data-cy=Graph-FacultyMastersProgress]').within(() => {
            const totalStats = ['16.1%', '12.9%', '6.5%', '12.9%', '9.7%', '19.4%', '22.6%']
            for (const stat of totalStats) {
              cy.contains(stat)
            }
          })
        })

        it('graph with graduated excluded is shown correctly', () => {
          cy.get('[data-cy="GraduatedToggle"]').click()
          cy.get('[data-cy=Graph-FacultyMastersProgress]').within(() => {
            const totalStats = ['23.8%', '19.0%', '9.5%', '9.5%', '9.5%', '14.3%', '14.3%']
            for (const stat of totalStats) {
              cy.contains(stat)
            }
          })
        })

        it('table with graduated included is shown correctly', () => {
          cy.get('[data-cy="Table-FacultyMastersProgress"]')
          const years = getEmptyYears(true)
          const tableContents = [
            ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
            ['2023 - 2024', 4, 4, 0, 0, 0, 0, 0, 0],
            ['2022 - 2023', 5, 0, 1, 1, 2, 0, 0, 1],
            ['2021 - 2022', 8, 1, 2, 0, 2, 1, 1, 1],
            ['2020 - 2021', 3, 0, 0, 0, 0, 0, 3, 0],
            ['2019 - 2020', 7, 0, 0, 1, 0, 1, 1, 4],
            ['2018 - 2019', 2, 0, 0, 0, 0, 1, 0, 1],
            ['2017 - 2018', 2, 0, 1, 0, 0, 0, 1, 0],
            ['Total', 31, 5, 4, 2, 4, 3, 6, 7],
          ]
          cy.checkTableStats(tableContents, 'FacultyMastersProgress')
        })

        it('table with graduated excluded is shown correctly', () => {
          cy.get('[data-cy="GraduatedToggle"]').click()
          cy.get('[data-cy="Table-FacultyMastersProgress"]')
          const years = getEmptyYears(true)
          const tableContents = [
            ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0]),
            ['2023 - 2024', 4, 4, 0, 0, 0, 0, 0, 0],
            ['2022 - 2023', 5, 0, 1, 1, 2, 0, 0, 1],
            ['2021 - 2022', 5, 1, 2, 0, 0, 0, 1, 1],
            ['2020 - 2021', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2019 - 2020', 3, 0, 0, 1, 0, 1, 1, 0],
            ['2018 - 2019', 2, 0, 0, 0, 0, 1, 0, 1],
            ['2017 - 2018', 2, 0, 1, 0, 0, 0, 1, 0],
            ['Total', 21, 5, 4, 2, 2, 2, 3, 3],
          ]
          cy.checkTableStats(tableContents, 'FacultyMastersProgress')
        })
      })

      describe('Doctor stats', () => {
        it('graph with graduated included is shown correctly', () => {
          cy.get('[data-cy=Graph-FacultyDoctoralProgress]').within(() => {
            const totalStats = ['6.0%', '20.0%', '14.0%', '18.0%', '42.0%']
            for (const stat of totalStats) {
              cy.contains(stat)
            }
          })
        })

        it('graph with graduated excluded is shown correctly', () => {
          cy.get('[data-cy="GraduatedToggle"]').click()
          cy.get('[data-cy=Graph-FacultyDoctoralProgress]').within(() => {
            const totalStats = ['9.1%', '24.2%', '12.1%', '18.2%', '36.4%']
            for (const stat of totalStats) {
              cy.contains(stat)
            }
          })
        })

        it('table with graduated included is shown correctly', () => {
          cy.get('[data-cy="Table-FacultyDoctoralProgress"]')
          const years = getEmptyYears(true)
          const tableContents = [
            ...years.map(year => [year, 0, 0, 0, 0, 0, 0]),
            ['2023 - 2024', 1, 1, 0, 0, 0, 0],
            ['2022 - 2023', 9, 1, 7, 1, 0, 0],
            ['2021 - 2022', 3, 1, 1, 0, 0, 1],
            ['2020 - 2021', 5, 0, 0, 2, 2, 1],
            ['2019 - 2020', 11, 0, 0, 1, 4, 6],
            ['2018 - 2019', 14, 0, 2, 3, 2, 7],
            ['2017 - 2018', 7, 0, 0, 0, 1, 6],
            ['Total', 50, 3, 10, 7, 9, 21],
          ]
          cy.checkTableStats(tableContents, 'FacultyDoctoralProgress')
        })

        it('table with graduated excluded is shown correctly', () => {
          cy.get('[data-cy="GraduatedToggle"]').click()
          cy.get('[data-cy="Table-FacultyDoctoralProgress"]')
          const years = getEmptyYears(true)
          const tableContents = [
            ...years.map(year => [year, 0, 0, 0, 0, 0, 0]),
            ['2023 - 2024', 1, 1, 0, 0, 0, 0],
            ['2022 - 2023', 9, 1, 7, 1, 0, 0],
            ['2021 - 2022', 3, 1, 1, 0, 0, 1],
            ['2020 - 2021', 4, 0, 0, 2, 1, 1],
            ['2019 - 2020', 9, 0, 0, 1, 4, 4],
            ['2018 - 2019', 5, 0, 0, 0, 1, 4],
            ['2017 - 2018', 2, 0, 0, 0, 0, 2],
            ['Total', 33, 3, 8, 4, 6, 12],
          ]
          cy.checkTableStats(tableContents, 'FacultyDoctoralProgress')
        })
      })

      it('Years in the tables can be clicked to show programme level breakdown', () => {
        cy.get('[data-cy="Table-FacultyBachelorsProgress"]').within(() => {
          cy.contains('2021 - 2022').click()
          cy.contains('31.3%').trigger('mouseover', { force: true })
          cy.contains('Matemaattisten tieteiden kandiohjelma')
          cy.contains('MAT - KH50_001')
          cy.contains('0 Credits: 0')
          cy.contains('1 ≤ Credits < 45: 10')
          cy.contains('45 ≤ Credits < 90: 9')
          cy.contains('90 ≤ Credits < 135: 11')
          cy.contains('135 ≤ Credits < 180: 2')
          cy.contains('180 ≤ Credits: 0')
        })
      })
    })

    describe('Graduation times stats', () => {
      it('All the correct sections are displayed', () => {
        const checkSections = breakdown => {
          const sections = ['bachelor', 'bcMsCombo', 'master', 'doctor']
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
          cy.contains('2022')

          cy.get('[aria-label="2022, 29. On time."]').trigger('mouseover')
          cy.contains('On time: 29')

          cy.get('[aria-label="2022, 29. On time."]').trigger('click')
          cy.contains('Year 2022 by graduation year')

          cy.get('[aria-label="MAT, 22. On time."]').trigger('mouseover')
          cy.contains('Matemaattisten tieteiden kandiohjelma')
          cy.contains('KH50_001')
          cy.contains('On time: 22')

          cy.get('[aria-label="MFKK, 7. On time."]').trigger('mouseover')
          cy.contains('Matematiikan, fysiikan ja kemian opettajan kandiohjelma')
          cy.contains('KH50_004')
          cy.contains('On time: 7')
        })
      })

      it('Graduation times median time data is shown correctly', () => {
        cy.get('[data-cy=GraduationTimeToggle]').click()

        cy.get('[data-cy=Section-bachelor]').within(() => {
          cy.contains('Graduation year')
          cy.contains('2021')

          cy.contains('70 graduated').trigger('mouseover')
          cy.contains('70 students graduated in year 2021')
          cy.contains('median study time: 39.5 months')
          cy.contains('28 graduated on time')
          cy.contains('32 graduated max year overtime')
          cy.contains('10 graduated over year late')

          cy.contains('70 graduated').trigger('click')
          cy.contains('Year 2021 by graduation year')

          cy.get('[aria-label="MAT, 41."]').trigger('mouseover')
          cy.contains('Matemaattisten tieteiden kandiohjelma')
          cy.contains('KH50_001')
          cy.contains('47 students graduated in year 2021')
          cy.contains('median study time: 41 months')
          cy.contains('14 graduated on time')
          cy.contains('25 graduated max year overtime')
          cy.contains('8 graduated over year late')
        })
      })
    })
  })
})
