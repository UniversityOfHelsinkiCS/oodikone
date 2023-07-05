/* eslint-disable cypress/no-unnecessary-waiting */
/// <reference types="Cypress" />

describe('Course Statistics tests', () => {
  describe('when using basic user', () => {
    beforeEach(() => {
      cy.init('/coursestatistics')
    })
    it('Searching single course having substitution mappings shows course statistics', () => {
      cy.url().should('include', '/coursestatistics')
      cy.contains('Search for courses')
      cy.get("input[placeholder='Search by a course code']").type('TKT20001')
      // Click uni course, not avoin
      cy.contains('td', /^TKT20001/).click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Search for courses').should('not.exist')

      cy.contains('Tietorakenteet ja algoritmit')
      cy.contains('TKT20001')
      cy.contains('58131') // old mapped code

      cy.contains('.tabular.menu a', 'Table').click()
      cy.contains('All')
      cy.cs('viewMode-Attempts').click()
      cy.cs('viewMode-Students').click()

      cy.contains('.tabular.menu a', 'Pass rate chart').click()
      cy.contains('svg', 'Pass rate chart')

      cy.contains('.tabular.menu a', 'Grade distribution chart').click()
      cy.contains('svg', 'Grades')

      cy.contains('a', 'New query').click()
      cy.contains('Search for courses')
    })

    it('Searching multiple courses having substitution mappings shows course statistics', () => {
      cy.url().should('include', '/coursestatistics')
      cy.contains('Search for courses')
      cy.get("input[placeholder='Search by a course code']").type('TKT')
      cy.contains('td', /^TKT20001/).click()
      cy.contains('td', /^TKT10002/).click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Search for courses').should('not.exist')

      cy.contains('.courseNameCell', 'Tietorakenteet ja algoritmit').contains('TKT20001').click()
      cy.contains('.courseNameCell', 'Ohjelmoinnin perusteet').should('not.exist')
      cy.contains('TKT20001')
      cy.contains('58131') // old mapped code
      cy.contains('Summary').click()

      cy.contains('.courseNameCell', 'Ohjelmoinnin perusteet').contains('TKT10002').click()
      cy.contains('.courseNameCell', 'Käyttöjärjestelmät').should('not.exist')
      cy.contains('TKT10002')
      cy.contains('581325') // old mapped code
      cy.contains('Summary').click()

      cy.contains('a', 'New query').click()
      cy.contains('Search for courses')
    })

    it('On consecutive searches should not crash and search should work', () => {
      cy.url().should('include', '/coursestatistics')
      cy.contains('Search for courses')
      cy.get("input[placeholder='Search by a course code']").type('TKT20003')
      cy.contains('td', 'TKT20003').click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Show population')
      cy.contains('TKT20003')

      cy.contains('Course statistics').click()
      cy.contains('Search for courses')
      cy.get("input[placeholder='Search by a course code']").type('TKT20001')
      cy.contains('td', 'TKT20001').click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Show population')
      cy.contains('TKT20001')
    })

    it('Shows statistics when separating by semester', () => {
      const courseCode = 'DATA11002'
      cy.url().should('include', '/coursestatistics')
      cy.contains('Search for courses')
      cy.get("input[placeholder='Search by a course code']").type(courseCode)
      cy.contains('td', courseCode).click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.get('[data-cy=separateToggle]', { force: true }).click({ force: true })
      cy.contains('Syksy 2019')
      cy.contains('Syksy 2017')
      cy.get('tbody').contains('19')
      cy.contains(courseCode)
    })

    it('Searching course by name displays right courses', () => {
      cy.url().should('include', '/coursestatistics')
      cy.contains('Search for courses')
      cy.get("input[placeholder='Search by entering a course name']").type('tietokantojen perusteet')

      cy.contains('Tietokantojen perusteet')
      cy.contains('Tietokantojen perusteet')
      cy.contains('A581328')
      cy.contains('AYTKT10004')
      cy.contains('TKT10004, 581328')
      cy.contains('td', /^TKT10004/).click()

      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Search for courses').should('not.exist')

      cy.contains('TKT10004, 581328, AYTKT10004, A581328 Tietokantojen perusteet')
      cy.get('.right').click()
      cy.contains('No results')
    })

    it('Provider organization toggle works', () => {
      cy.url().should('include', '/coursestatistics')
      cy.contains('Search for courses')
      cy.get("input[placeholder='Search by entering a course name']").type('tietokantojen perusteet')

      cy.contains('td', /^TKT10004/).click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Search for courses').should('not.exist')

      cy.contains('TKT10004, 581328, AYTKT10004, A581328 Tietokantojen perusteet')
      cy.get('[data-cy=unify_radio_reqular]').click()
      cy.contains('TKT10004, 581328 Tietokantojen perusteet')
    })

    it('Searching course by name displays right courses, 10 credit courses', () => {
      cy.url().should('include', '/coursestatistics')
      cy.contains('Search for courses')
      cy.get("input[placeholder='Search by entering a course name']").type('tietorakenteet ja algoritmit')
      cy.contains('Tietorakenteet ja algoritmit')
      cy.contains('AYTKT20001')
      cy.contains('TKT20001, 58131')
      cy.contains('td', /^TKT20001/).click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Search for courses').should('not.exist')

      cy.contains('TKT20001, 58131, AYTKT20001 Tietorakenteet ja algoritmit')
      cy.get('.right').click()
      cy.contains('No results')
      cy.get("input[placeholder='Search by entering a course name']").type('tietorakenteet ja algoritmit')
      cy.contains('td', 'TKT20001, 58131, AYTKT20001').click()

      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Search for courses').should('not.exist')
      cy.contains('TKT20001, 58131, AYTKT20001 Tietorakenteet ja algoritmit')
    })

    it('Can find course population', () => {
      cy.url().should('include', '/coursestatistics')
      cy.contains('Search for courses')
      cy.get("input[placeholder='Search by a course code']").type('TKT20003')
      cy.contains('tr', 'TKT20003').click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Käyttöjärjestelmät')
      cy.contains('TKT20003')
      cy.wait(5000)
      cy.get('tbody > :nth-child(3) > :nth-child(2) .level').click()
      cy.contains('Population of course Käyttöjärjestelmät 2019-2020 (open and normal')
      cy.contains('TKT20003')

      cy.contains('Students (127)').click()
      cy.contains('010135486')
      cy.contains('010431753')
    })

    it('Population of course shows grades for each student', () => {
      cy.get("input[placeholder='Search by a course code']").type('TKT20001')
      cy.wait(2000)
      cy.contains(/^TKT20001, AYTKT20001$/).click({ force: true })
      cy.wait(2000)
      cy.contains('Fetch statistics').should('be.enabled').click({ force: true })
      cy.wait(2000)
      cy.contains('TKT20001, 58131, AYTKT20001 Tietorakenteet ja algoritmit')
      cy.get('tbody >:nth-child(3) > :nth-child(2) .level').click({ force: true })
      cy.wait(2000)
      cy.contains('Population of course Tietorakenteet ja algoritmit 2018-2019 (open and normal)')
      cy.contains('Students (204)').click({ force: true })
      cy.wait(2000)
      cy.contains('td', '010262566').siblings().contains('4')
      cy.contains('td', '010674989').siblings().contains('1')
    })

    it('Language distribution is correct', () => {
      cy.get("input[placeholder='Search by a course code']").type('TKT20003')
      cy.contains(/^TKT20003$/).click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('TKT20003, 582219 Käyttöjärjestelmät')
      cy.get('[data-cy=unify_radio_reqular]').click()
      cy.wait(5000)
      cy.get('tbody > :nth-child(3) > :nth-child(2) .level').click()
      cy.contains('Population of course Käyttöjärjestelmät 2019-2020')
      cy.contains('Language distribution').click()
      cy.contains('td', 'finnish').siblings().contains('122')
      cy.contains('td', 'english').siblings().contains('5')
    })

    describe('When searching unified course stats', () => {
      beforeEach(() => {
        cy.url().should('include', '/coursestatistics')
        cy.contains('Search for courses')
        cy.get("input[placeholder='Search by a course code']").type('TKT10002')
        cy.contains('td', 'TKT10002, AYTKT10002').click()
        cy.contains('Fetch statistics').should('be.enabled').click()
        cy.contains('Search for courses').should('not.exist')
        cy.contains('TKT10002, 581325, AYTKT10002, A581325 Ohjelmoinnin perusteet')
      })

      // Statistics
      const yearRange = { from: '2000-2001', to: '2020-2021' }
      const attemptsTableContents = [
        // [time, passed, failed, passrate]
        ['Total', null, 511, 486, 25],
      ]

      const attemptsTableContentsOpen = [
        // [time, passed, failed, passrate]
        ['Total', null, 175, 175, 0],
      ]

      const attemptsTableContentsReqular = [
        // [time, passed, failed, passrate]
        ['Total', null, 312, 298, 14],
      ]

      const gradesTableContents = [
        // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
        ['Total', null, 511, 25, 11, 17, 21, 59, 365, 13],
        ['2020-2021', null, 1, 0, 0, 0, 0, 0, 1, 0],
        ['2019-2020', null, 54, 4, 3, 1, 3, 4, 39, 0],
        ['2018-2019', null, 154, 7, 2, 6, 5, 15, 119, 0],
        ['2017-2018', null, 186, 9, 3, 5, 6, 16, 139, 8],
        ['2016-2017', null, 71, 2, 1, 2, 5, 13, 48, 0],
        ['2015-2016', null, 21, 1, 1, 1, 0, 7, 8, 3],
      ]

      it('shows stats', () => {
        // Time range
        cy.get("div[name='fromYear']").within(() => {
          cy.get("div[role='option']").first().should('have.text', yearRange.to)
          cy.contains("div[role='option']", yearRange.from).should('have.class', 'selected')
          cy.get("div[role='option']").last().should('have.text', '2000-2001')
          cy.get("div[role='option']").should('have.length', 21)
        })
        cy.get("div[name='toYear']").within(() => {
          cy.get("div[role='option']").first().should('have.text', '2020-2021')
          cy.contains("div[role='option']", yearRange.to).should('have.class', 'selected')
          cy.get("div[role='option']").last().should('have.text', yearRange.from)
          cy.get("div[role='option']").should('have.length', 21)
        })
        cy.contains('Show population').should('not.be.enabled')

        cy.contains('#CourseStatPanes a.item', 'Table').click()
        cy.contains('#CourseStatPanes a.item', 'Attempts').click()
        cy.get('#CourseStatPanes table>tbody').within(() => {
          attemptsTableContents.forEach((values, trIndex) => {
            cy.get('tr')
              .eq(trIndex)
              .within(() => {
                values.forEach((value, tdIndex) => {
                  if (value === null) return
                  cy.get('td').eq(tdIndex).contains(value)
                })
              })
          })
          cy.get('tr').should('have.length', 17)
        })
        cy.get('[data-cy=gradeToggle]', { force: true }).click({ force: true })
        cy.get('#CourseStatPanes table>tbody').within(() => {
          gradesTableContents.forEach((values, trIndex) => {
            cy.get('tr')
              .eq(trIndex)
              .within(() => {
                values.forEach((value, tdIndex) => {
                  if (value === null) return
                  cy.get('td').eq(tdIndex).contains(value)
                })
              })
          })
          cy.get('tr').should('have.length', 17)
        })
      })

      it('Toggling course provider changes stats correctly', () => {
        cy.get('[data-cy=unify_radio_reqular]').click()
        cy.get("div[name='toYear']").within(() => {
          cy.get("div[role='option']").first().should('have.text', '2020-2021')
          cy.contains("div[role='option']", yearRange.to).should('have.class', 'selected')
          cy.get("div[role='option']").last().should('have.text', yearRange.from)
          cy.get("div[role='option']").should('have.length', 21)
        })
        cy.contains('#CourseStatPanes a.item', 'Table').click()
        cy.contains('#CourseStatPanes a.item', 'Attempts').click()
        cy.get('#CourseStatPanes table>tbody').within(() => {
          attemptsTableContentsReqular.forEach((values, trIndex) => {
            cy.get('tr')
              .eq(trIndex)
              .within(() => {
                values.forEach((value, tdIndex) => {
                  if (value === null) return
                  cy.get('td').eq(tdIndex).contains(value)
                })
              })
          })
        })
        cy.get('[data-cy=unify_radio_open]').click()
        cy.get('#CourseStatPanes table>tbody').within(() => {
          attemptsTableContentsOpen.forEach((values, trIndex) => {
            cy.get('tr')
              .eq(trIndex)
              .within(() => {
                values.forEach((value, tdIndex) => {
                  if (value === null) return
                  cy.get('td').eq(tdIndex).contains(value)
                })
              })
          })
        })
        cy.get('[data-cy=unify_radio_unify]').click()
      })

      it('After changing time range shows same stats', () => {
        const newYearRange = { from: '2016-2017', to: '2019-2020' }
        cy.get("div[name='fromYear']")
          .click()
          .within(() => {
            cy.contains(newYearRange.from).click()
          })
        cy.get("div[name='toYear']")
          .click()
          .within(() => {
            cy.contains(newYearRange.to).click()
          })

        // Time range
        cy.get("div[name='fromYear']").within(() => {
          cy.get("div[role='option']").first().should('have.text', newYearRange.to)
          cy.contains("div[role='option']", newYearRange.from).should('have.class', 'selected')
          cy.get("div[role='option']").last().should('have.text', '2000-2001')
          cy.get("div[role='option']").should('have.length', 20)
        })
        cy.get("div[name='toYear']").within(() => {
          cy.get("div[role='option']").first().should('have.text', '2020-2021')
          cy.contains("div[role='option']", newYearRange.to).should('have.class', 'selected')
          cy.get("div[role='option']").last().should('have.text', newYearRange.from)
          cy.get("div[role='option']").should('have.length', 5)
        })
        cy.contains('Show population').should('be.enabled')
      })
    })

    it('If no data available, unify toggle is disabled', () => {
      cy.get("input[placeholder='Search by a course code']").type('AYCSM14111')
      cy.contains('AYCSM14111').click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('AYCSM14111 Avoin yo: Full Stack -websovelluskehitys: React Native')
      cy.get('[data-cy=unify_radio_reqular]').find('input').should('be.disabled')
      cy.get('[data-cy=unify_radio_unify]').find('input').should('not.be.disabled')
    })

    it('Has right to see all the sudents, because course provider is TKT', () => {
      cy.visit('coursestatistics?courseCodes=%5B%22TKT10004%22%5D&cs_tab=0&separate=false')
      cy.get('tbody > :nth-child(3) > :nth-child(2) .level').click()
      cy.contains('Students (154)').click()
      cy.contains('015224224')
    })
  })

  it.skip('Some features of Course Statistics are hidden for courseStatistics-users without other rights', () => {
    cy.init('/coursestatistics', 'onlycoursestatistics')
    cy.get('[data-cy=navbar-courseStatistics]').click()
    cy.get('[data-cy=course-code-input]').type('TKT20003')
    cy.contains('tr', 'TKT20003').click()
    cy.contains('Fetch statistics').should('be.enabled').click()
    cy.contains('Filter statistics by study programmes').should('not.exist')
    cy.contains('Faculty statistics').should('not.exist')
    cy.contains('Show population').should('not.exist')

    cy.cs('viewMode-Attempts').click()

    const attemptsTableContents = [
      // [time, passed, failed, passrate]
      ['Total', 288, 213, 75, '73.96 %'], //Somehow cypress in CI can't find the number even if it is present in the artifact video
      ['2020-2021', '5 or less students', 'NA', 'NA', 'NA'],
      // ['Total', null, 295, 216, 79, '73.22 %'],
      // ['2020-2021', null, 5, 2, 3, '40.00 %'],
      ['2019-2020', null, 164, 121, 43, '73.78 %'],
      ['2018-2019', null, 85, 60, 25, '70.59 %'],
      ['2017-2018', null, 39, 32, 7, '82.05 %'],
    ]

    cy.contains('#CourseStatPanes a.item', 'Attempts').click()
    cy.get('#CourseStatPanes table>tbody').within(() => {
      attemptsTableContents.forEach((values, trIndex) => {
        cy.get('tr')
          .eq(trIndex)
          .within(() => {
            values.forEach((value, tdIndex) => {
              if (value === null) return
              cy.get('td').eq(tdIndex).contains(value)
            })
          })
      })
      cy.get('tr').should('have.length', 7)
    })
  })
})
