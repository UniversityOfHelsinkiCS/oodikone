/// <reference types="cypress" />
// Now "Class statistics" in UI

const selectStudyProgramme = programme => {
  cy.cs('population-programme-selector').within(() =>
    cy.get('input').should('have.attr', 'placeholder', 'Select degree programme')
  )
  cy.cs('population-programme-selector-parent').click()
  cy.cs('population-programme-selector-parent').within(() => cy.contains(programme).click())
}

const selectStudyTrack = studyTrack => {
  cy.cs('population-studytrack-selector').within(() =>
    cy.get('input').should('have.attr', 'placeholder', 'Select study track')
  )
  cy.cs('population-studytrack-selector-parent').click()
  cy.cs('population-studytrack-selector-parent').within(() => cy.contains(studyTrack).click())
}

describe('Population statistics tests', () => {
  const getPath = programme => {
    return `/populations?months=49&semesters=FALL&semesters=SPRING&studyRights=%7B"programme"%3A"${programme}"%7D&year=2020`
  }
  const pathToMathBSc2020 = getPath('KH50_001')
  const pathToMathMSc2020 = getPath('MH50_001')

  describe('When using basic user', () => {
    beforeEach(() => {
      cy.init('/populations')
      cy.intercept('/api/v3/populationstatistics/studyprogrammes').as('studyprogrammes')
      cy.intercept('/api/v2/studyprogrammes/**/studytracks').as('studytracks')
    })

    describe('Population search', () => {
      it('Info box works', () => {
        cy.cs('PopulationSearch-info-box-content').should('not.exist')
        cy.cs('PopulationSearch-info-box-button').trigger('mouseover')
        cy.cs('PopulationSearch-info-box-content').should('be.visible')
        cy.cs('PopulationSearch-info-box-content').contains('Tässä osiossa voi tarkastella')
        cy.cs('PopulationSearch-info-box-button').trigger('mouseout')
        cy.cs('PopulationSearch-info-box-content').should('not.exist')
      })

      it('Form is usable', () => {
        cy.contains('Search for class')
        cy.contains('See class').should('be.disabled')

        cy.cs('population-year-selector').as('yearSelect')
        cy.cs('population-year-decrement').as('yearDecrement')
        cy.cs('population-year-increment').as('yearIncrement')

        cy.get('@yearSelect')
          .click()
          .then(() => cy.contains('2018 - 2019').trigger('click', { force: true }))
        cy.get('@yearSelect').within(() => cy.contains('2018 - 2019'))
        cy.get('@yearDecrement').click()
        cy.get('@yearSelect').within(() => cy.contains('2017 - 2018'))
        cy.get('@yearIncrement').click()
        cy.get('@yearSelect').within(() => cy.contains('2018 - 2019'))

        cy.cs('population-studytrack-selector').within(() => {
          cy.get('input').should('have.attr', 'placeholder', 'No study tracks available')
        })
        selectStudyProgramme('Matematiikan ja tilastotieteen maisteriohjelma')
        cy.contains('See class').should('be.enabled')
        selectStudyTrack('Matematiikka ja soveltava matematiikka')
        cy.contains('See class').should('be.enabled')
      })

      describe('Correct population is shown for programme', () => {
        beforeEach(() => {
          cy.wait('@studyprogrammes').its('response.statusCode').should('be.oneOf', [200, 304])
        })

        it('without study tracks', () => {
          selectStudyProgramme('Matemaattisten tieteiden kandiohjelma')
          cy.contains('See class').click()
          cy.contains('Matemaattisten tieteiden kandiohjelma 2017 - 2018')
          cy.contains('class size 47 students')
        })

        it('with study tracks', () => {
          selectStudyProgramme('Matematiikan ja tilastotieteen maisteriohjelma')
          cy.wait('@studytracks').its('response.statusCode').should('be.oneOf', [200, 304])
          selectStudyTrack('Matematiikka ja soveltava matematiikka')
          cy.contains('See class').click()
          cy.contains('Matematiikan ja tilastotieteen maisteriohjelma 2017 - 2018')
          cy.contains('studytrack MAST-MSM')
          cy.contains('class size 1 students')
        })
      })
    })

    it('Population statistics is usable on general level', () => {
      cy.visit(pathToMathBSc2020)
      cy.cs('filtered-students')
      cy.contains('Matemaattisten tieteiden kandiohjelma')
      cy.contains('class size 30 students')
      cy.contains('Excludes exchange students')
      cy.contains('Excludes students with non-degree study right')
      cy.contains('Excludes students who have transferred out of this programme')
      cy.cs('filtered-students')
    })

    // This test sometimes fails on headless mode. It seems that the click on the
    // 'Fetch class with new settings' button doesn't always trigger history.push()
    // so the page doesn't reload. This is why waiting also doesn't help.
    it('Advanced settings work', { retries: 2 }, () => {
      cy.visit(pathToMathMSc2020)
      cy.get('[data-cy=advanced-toggle]').click()
      // only spring
      cy.cs('toggle-fall').click()
      cy.contains('Fetch class').click()
      cy.contains('Credit accumulation (for 17 students)')
      cy.url().should('not.include', 'semesters=FALL')
      // only fall
      cy.get('[data-cy=advanced-toggle]').click()
      cy.cs('toggle-fall').click()
      cy.cs('toggle-spring').click()
      cy.contains('Fetch class').click()
      cy.contains('Credit accumulation (for 9 students)')
      cy.url().should('not.include', 'semesters=SPRING')
      // spring + fall
      cy.get('[data-cy=advanced-toggle]').click()
      cy.cs('toggle-spring').click()
      cy.contains('Fetch class').click()
      cy.contains('Credit accumulation (for 26 students)')
      cy.url().should('include', 'semesters=FALL&semesters=SPRING')
    })

    describe('Credit statistics', () => {
      it("'Credits gained' tab shows correct statistics for all students of the class and also students grouped by admission type", () => {
        cy.clock(new Date('2024-08-30').getTime(), ['Date'])
        cy.visit(pathToMathBSc2020)
        const totalStudents = 27
        cy.contains('Credit statistics')
          .parent()
          .then($parentDiv => {
            if (!$parentDiv.hasClass('active')) cy.contains('Credit statistics').click()
          })
        cy.contains('Credits gained').click()
        cy.get("[data-cy='credits-gained-main-table']").should('contain', 'All students of the class')
        const limits = [1, 45, 90, 135, 180, null]
        const ranges = limits.map((limit, i) => (i === 0 ? [null, 0] : [limits[i - 1], limit])).reverse()

        const getTableData = (selector, numbersOfStudents) => {
          const studentsInCategory = numbersOfStudents.reduce((acc, val) => acc + val, 0)
          return ranges.map((range, index) => ({
            selector: `[data-cy='credits-gained-table-${selector}']`,
            start: range[0],
            end: range[1],
            students: numbersOfStudents[index],
            percentage: `${((numbersOfStudents[index] / studentsInCategory) * 100).toFixed(1)}%`,
          }))
        }

        cy.get("[data-cy='credits-gained-table-All students of the class'] table thead tr").within(() => {
          cy.get('th').eq(1).contains('Credits gained between 01.08.2020 and 30.08.2024 (49 months)')
          cy.get('th').eq(2).contains('Number of students')
          cy.get('th').eq(2).contains(`(n = ${totalStudents})`)
          cy.get('th').eq(3).contains('Percentage of population')
        })

        for (const category of [
          getTableData('All students of the class', [9, 5, 7, 4, 2, 0]),
          getTableData('Avoin väylä', [0, 1, 3, 2, 0, 0]),
          getTableData('Muu', [0, 1, 1, 1, 0, 0]),
          getTableData('Todistusvalinta', [9, 3, 3, 1, 2, 0]),
        ]) {
          category.forEach(({ selector, start, end, students, percentage }, index) => {
            let value
            if (start === null) {
              value = '0'
            } else if (end === null) {
              value = `${start} ≤ credits`
            } else {
              value = `${start} ≤ credits < ${end}`
            }
            cy.get(`${selector} [data-cy='credits-gained-table-body']`).within(() => {
              cy.get('tr')
                .eq(index)
                .within(() => {
                  cy.get('td').eq(1).contains(value)
                  cy.get('td').eq(2).contains(students)
                  cy.get('td').eq(3).contains(percentage)
                })
            })
          })
        }

        cy.get(
          "[data-cy='credits-gained-table-All students of the class'] [data-cy='credits-gained-table-body'] td:nth-child(3)"
        ).then(tds => {
          const sum = [...tds].reduce((acc, td) => acc + parseInt(td.innerText, 10), 0)
          expect(sum).to.equal(totalStudents)
        })
      })

      it("'Statistics' tab shows correct statistics for all students of the class and also students grouped by admission type", () => {
        cy.visit(pathToMathBSc2020)
        cy.contains('Credit statistics')
          .parent()
          .then($parentDiv => {
            if (!$parentDiv.hasClass('active')) cy.contains('Credit statistics').click()
          })
        cy.get("[data-cy='credit-stats-tab'] > .menu > :nth-child(2)").click()
        const rows = ['Total credits', 'Average', 'Median', 'Standard deviation', 'Minimum', 'Maximum']
        const categories = [
          {
            selector: 'All students of the population',
            data: ['3773.50', '139.76', '141.00', '60.07', '19', '268'],
            size: 27,
          },
          {
            selector: 'Muu',
            data: ['359.00', '119.67', '111.00', '43.71', '71', '177'],
            size: 3,
          },
          {
            selector: 'Todistusvalinta',
            data: ['2742.50', '152.36', '178.00', '65.75', '19', '268'],
            size: 18,
          },
          {
            selector: 'Avoin väylä',
            data: ['672.00', '112.00', '104.00', '29.40', '82', '169'],
            size: 6,
          },
        ]

        for (const { selector, data, size } of categories) {
          cy.get(`[data-cy='statistics-table-${selector}']`).within(() => {
            cy.contains('h3', selector)
            cy.contains("[data-cy='credit-stats-population-size']", `n = ${size}`)
            cy.get('table tbody').within(() => {
              rows.forEach((text, index) => {
                cy.get('tr')
                  .eq(index)
                  .within(() => {
                    cy.get('td').eq(0).contains(text)
                    cy.get('td').eq(1).contains(data[index])
                  })
              })
            })
          })
        }
      })
    })

    describe('Courses of class', () => {
      it('Is displayed and link to individual course stats page works', () => {
        cy.visit(pathToMathBSc2020)
        cy.contains('Courses of class').click()
        cy.intercept('/api/v3/courseyearlystats**').as('coursePage')
        cy.get('[data-cy=toggle-group-module-MAT110]').click()
        cy.contains('td', 'MAT11001').siblings().find('i.level.up').click()
        cy.wait('@coursePage')
        cy.url().should('include', '/coursestatistics')
        cy.contains('MAT11001 • Johdatus yliopistomatematiikkaan')
        cy.contains('AYMAT11001 • Avoin yo: Johdatus yliopistomatematiikkaan')
        cy.contains('57033 • Johdatus yliopistomatematiikkaan')
        cy.contains('A57033 • Avoin yo: Johdatus yliopistomatematiikkaan')
      })

      it('Curriculum selection works', () => {
        cy.visit(pathToMathBSc2020)
        cy.contains('Courses of class').click()
        cy.get('[data-cy=curriculum-picker]').contains('2020–2023')
        cy.get('[data-cy=toggle-group-module-MAT-tyo]')
        cy.get('[data-cy=curriculum-picker]').click()
        cy.contains('2023–2026').click()
        cy.get('[data-cy=toggle-group-module-MAT-tyo]').should('not.exist')
      })

      it('Courses data is changed when curriculum is changed', () => {
        cy.visit(pathToMathBSc2020)
        cy.contains('Courses of class').click()

        cy.get('[data-cy=curriculum-picker]').scrollIntoView().should('be.visible').click()
        cy.contains('2020–2023').click({ force: true })
        cy.contains('Students (27)')
        cy.get('[data-cy=toggle-group-module-DIGI-k]')
          .should('exist')
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true })
        cy.contains('DIGI-100').should('exist')

        cy.get('[data-cy=curriculum-picker]').scrollIntoView().should('be.visible').click()
        cy.contains('2023–2026').click({ force: true })
        cy.get('[data-cy=toggle-group-module-DIGI-k]').should('exist')
        cy.contains('DIGI-100').should('not.exist')
      })

      it('Courses data is changed when filtered students change', () => {
        cy.visit(pathToMathBSc2020)

        cy.get('[data-cy=GraduatedFromProgramme-filter-card]').within(() => {
          cy.get('[data-cy=GraduatedFromProgramme-header]').click()
          cy.get('[data-cy=option-graduated-true]').click()
        })

        cy.contains('Students (16)')
      })
    })

    describe('Students', () => {
      beforeEach(() => {
        cy.visit(pathToMathBSc2020)
        cy.contains('Students (27)')
          .parent()
          .then($parentDiv => {
            if (!$parentDiv.hasClass('active')) cy.contains('Students (27)').click()
          })
      })

      it("'General tab' is usable", () => {
        cy.cs('student-table-tabs').within(() => {
          cy.contains('522142')
          cy.contains('Tilastotiede')
          cy.contains('Matematiikka')
          cy.contains('Taloustieteen maisteriohjelma')
          cy.contains('Todistusvalinta')
          cy.contains('Saksa')
          cy.contains('Female')
        })
      })

      it("'Courses tab' is usable", () => {
        cy.cs('student-table-tabs').within(() => {
          cy.contains('Courses').click()
          cy.contains('MAT12001')
          cy.contains('MAT21001')
        })
      })

      it("'Modules tab' Displays correct modules based on the selected programme", () => {
        cy.cs('student-table-tabs').within(() => {
          cy.contains('Modules').click()
          cy.contains('MAT011')
          cy.contains('MAT110')
        })
        cy.contains('Courses of class').click()
        cy.cs('curriculum-picker').click()
        cy.contains('2023–2026').click()
        cy.contains('Courses of class').click()
        cy.cs('student-table-tabs').within(() => {
          cy.contains('MAT011').should('not.exist')
          cy.contains('MAT110')
        })
      })

      it.skip("Empty 'tags' tab has a link to the page where tags can be created", () => {
        // TODO: This fails in the pipeline, but works locally. Investigate.
        cy.cs('student-table-tabs').within(() => {
          cy.contains('Tags').click()
          cy.contains('No tags defined. You can define them here.').find('a').click()
        })
        cy.url().should('include', '/study-programme/KH50_001?tab=4')
        cy.contains('Matemaattisten tieteiden kandiohjelma')
        cy.contains('Create new tag')
        cy.cs('create-button').should('be.disabled')
      })
    })
  })

  describe('When using admin', () => {
    it('Student list checking works as intended', () => {
      cy.init(pathToMathBSc2020, 'admin')
      const existing = '433237'
      const nonExisting = '550004'
      cy.contains('Students (27)')
        .parent()
        .then($parentDiv => {
          if (!$parentDiv.hasClass('active')) cy.contains('Students (27)').click()
        })
      cy.contains(existing)
      cy.contains(nonExisting).should('not.exist')
      cy.contains('button', 'Check student numbers').click()
      cy.contains('Check for student numbers')
      cy.get('textarea').type(existing)
      cy.get('textarea').type('{enter}')
      cy.get('textarea').type(nonExisting)
      cy.contains('button', 'Check students').click()
      cy.contains('#checkstudentsresults', 'Results').within(() => {
        cy.contains('Student numbers in list and in Sisu').click()
        cy.contains('#found', existing)
        cy.contains('Student numbers in list but not in Sisu').click()
        cy.contains('#notfound', nonExisting)
        cy.contains('Student numbers in Sisu but not in list').click()
        cy.contains('#notsearched', '457144')
      })
      cy.contains('button', 'Close').click()
      cy.contains('Student numbers in list and in Sisu').should('not.exist')
    })
  })

  describe('When using IAM user', () => {
    beforeEach(() => {
      cy.init(pathToMathBSc2020, 'onlyiamrights')
      cy.contains('Matemaattisten tieteiden kandiohjelma 2020 - 2021')
      cy.contains('class size 30 students')
    })

    it('Population statistics is visible', () => {
      cy.cs('PopulationSearch-section').within(() => {
        cy.contains('Excludes exchange students')
        cy.contains('Excludes students with non-degree study right')
        cy.contains('Excludes students who have transferred out of this programme')
      })
    })

    it('Only correct panels are visible', () => {
      cy.cs('panelview-parent').within(() => {
        cy.cs('Credit accumulation (for 27 students)')
        cy.cs('Credit statistics')
        cy.cs('Age distribution')
        cy.cs('Courses of class')
      })
    })

    it('Ages cannot be ungrouped', () => {
      cy.contains('Age distribution')
        .parent()
        .then($parentDiv => {
          if (!$parentDiv.hasClass('active')) cy.contains('Age distribution').click()
        })
      cy.contains('ui.checked.toggle.checkbox', 'Group ages').should('not.exist')
    })

    it('Age filter is not visible', () => {
      cy.get("[data-cy='filtered-students']")
      cy.get("[data-cy='Age-filter-card']").should('not.exist')
    })

    it('Students tab is not available', () => {
      cy.contains('Students (27)').should('not.exist')
    })
  })
})
