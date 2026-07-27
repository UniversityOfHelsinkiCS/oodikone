import { test, expect } from '@playwright/test'
/// <reference types="cypress" />
// Now "Class statistics" in UI
const selectStudyProgramme = async (page, programme) => {
  cy.cs('population-programme-selector').within(() =>
    cy.get('input').should('have.attr', 'placeholder', 'Select degree programme')
  )
  cy.cs('population-programme-selector-parent').click()
  cy.cs('population-programme-selector-parent').within(() => cy.contains(programme).click())
}
const selectStudyTrack = async (page, studyTrack) => {
  cy.cs('population-studytrack-selector').within(() =>
    cy.get('input').should('have.attr', 'placeholder', 'Select study track')
  )
  cy.cs('population-studytrack-selector-parent').click()
  cy.cs('population-studytrack-selector-parent').within(() => cy.contains(studyTrack).click())
}
test.describe('Population statistics tests', () => {
  const getPath = programme => {
    return `/populations?months=49&semesters=FALL&semesters=SPRING&programme=${programme}&years=2020`
  }
  const pathToMathBSc2020 = getPath('KH50_001')
  const pathToMathMSc2020 = getPath('MH50_001')
  test.describe('When using basic user', () => {
    test.beforeEach(async ({ page }) => {
      cy.init('/populations')
      cy.intercept('/api/populationstatistics/studyprogrammes').as('studyprogrammes')
      cy.intercept('/api/studyprogrammes/**/studytracks').as('studytracks')
    })
    test.describe('Population search', () => {
      test('Info box works', async ({ page }) => {
        cy.cs('PopulationSearch-info-box-content').should('not.exist')
        cy.cs('PopulationSearch-info-box-button').hover()
        cy.cs('PopulationSearch-info-box-content').should('be.visible')
        cy.cs('PopulationSearch-info-box-content').contains('Tässä osiossa voi tarkastella')
        cy.cs('PopulationSearch-info-box-button').trigger('mouseout')
        cy.cs('PopulationSearch-info-box-content').should('not.exist')
      })
      test.skip('Form is usable', async ({ page }) => {
        cy.contains('Search for class')
        cy.contains('See class').should('be.disabled')
        cy.cs('population-year-selector').as('yearSelect')
        cy.cs('population-year-decrement').as('yearDecrement')
        cy.cs('population-year-increment').as('yearIncrement')
        page.locator('@yearSelect').click()
        page.locator('text=2018 - 2019').click()
        cy.get('@yearSelect').within(() => cy.contains('2018 - 2019'))
        page.locator('@yearDecrement').click()
        cy.get('@yearSelect').within(() => cy.contains('2017 - 2018'))
        page.locator('@yearIncrement').click()
        cy.get('@yearSelect').within(() => cy.contains('2018 - 2019'))
        cy.cs('population-studytrack-selector').within(() => {
          expect(page.locator('input')).toHaveAttribute('placeholder', 'No study tracks available')
        })
        selectStudyProgramme(page)
        cy.contains('See class').should('be.enabled')
        selectStudyTrack(page)
        cy.contains('See class').should('be.enabled')
      })
      test.describe('Correct population is shown for programme', () => {
        test.skip('without study tracks', async ({ page }) => {
          cy.wait('@studyprogrammes').its('response.statusCode').should('be.oneOf', [200, 304])
          selectStudyProgramme(page)
          cy.wait('@studytracks').its('response.statusCode').should('be.oneOf', [200, 304])
          page.locator('text=See class').click()
          cy.contains('Matemaattisten tieteiden kandiohjelma')
          cy.contains('Class of 2017 - 2018, 47 students')
        })
        test.skip('with study tracks', async ({ page }) => {
          selectStudyProgramme(page)
          cy.wait('@studytracks').its('response.statusCode').should('be.oneOf', [200, 304])
          selectStudyTrack(page)
          page.locator('text=See class').click()
          cy.contains('Matematiikan ja tilastotieteen maisteriohjelma 2017 - 2018')
          cy.contains('studytrack MAST-MSM')
          cy.contains('Class size 1 students')
        })
      })
    })
    test('Population statistics is usable on general level', async ({ page }) => {
      page.goto(pathToMathBSc2020)
      cy.cs('filtered-students')
      cy.contains('Matemaattisten tieteiden kandiohjelma')
      cy.contains('Class of 2020 - 2021, 30 students')
      cy.contains('Excludes exchange students')
      cy.contains('Excludes students with non-degree study right')
      cy.contains('Excludes students who have transferred out of this programme')
      cy.cs('filtered-students')
    })
    test('Advanced settings work', async ({ page }) => {
      page.goto(pathToMathMSc2020)
      page.locator('[data-cy=advanced-toggle]').click()
      // only spring
      cy.cs('toggle-fall').click()
      page.locator('text=Fetch class').click()
      cy.contains('Credit accumulation (for 17 students)')
      cy.url().should('not.include', 'semesters=FALL')
      page.locator('[data-cy=advanced-toggle]').click()
      cy.cs('toggle-fall').click()
      cy.cs('toggle-spring').click()
      page.locator('text=Fetch class').click()
      cy.contains('Credit accumulation (for 9 students)')
      cy.url().should('not.include', 'semesters=SPRING')
      page.locator('[data-cy=advanced-toggle]').click()
      cy.cs('toggle-spring').click()
      page.locator('text=Fetch class').click()
      cy.contains('Credit accumulation (for 26 students)')
      cy.url().should('include', 'semesters=FALL&semesters=SPRING')
    })
    test.describe('Credit statistics', () => {
      test("'Credits gained' tab shows correct statistics for all students of the class and also students grouped by admission type", async ({
        page,
      }) => {
        cy.clock(new Date('2024-08-30').getTime(), ['Date'])
        page.goto(pathToMathBSc2020)
        const totalStudents = 27
        cy.contains('Credit statistics')
          .parent()
          .then($parentDiv => {
            if (!$parentDiv.hasClass('active')) page.locator('text=Credit statistics').click()
          })
        page.locator('text=Credits gained').click()
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
        cy.cs('credits-gained-table-All students of the class').within(() => {
          cy.get('th').eq(1).contains('Credits gained between 01.08.2020 and 30.08.2024')
          cy.get('th').eq(1).contains('(49 months)')
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
      test("'Statistics' tab shows correct statistics for all students of the class and also students grouped by admission type", async ({
        page,
      }) => {
        page.goto(pathToMathBSc2020)
        cy.contains('Credit statistics')
          .parent()
          .then($parentDiv => {
            if (!$parentDiv.hasClass('active')) page.locator('text=Credit statistics').click()
          })
        cy.cs('credit-statistics-tab').click()
        const rows = ['Total credits', 'Average', 'Median', 'Standard deviation', 'Minimum', 'Maximum']
        const categories = [
          {
            selector: 'All students of the population',
            data: ['6136.50', '227.28', '197.00', '117.94', '60', '533'],
            size: 27,
          },
          {
            selector: 'Muu',
            data: ['580.00', '193.33', '192.00', '36.75', '149', '239'],
            size: 3,
          },
          {
            selector: 'Todistusvalinta',
            data: ['3657.50', '203.19', '193.50', '98.35', '60', '460'],
            size: 18,
          },
          {
            selector: 'Avoin väylä',
            data: ['1899.00', '316.50', '257.00', '150.43', '150', '533'],
            size: 6,
          },
        ]
        for (const { selector, data, size } of categories) {
          cy.get(`[data-cy='statistics-table-${selector}']`).within(() => {
            cy.contains('h5', selector)
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
    test.describe('Courses of class', () => {
      test('Is displayed and link to individual course stats page works', async ({ page }) => {
        page.goto(pathToMathBSc2020)
        page.locator('text=Courses of class').click()
        cy.intercept('/api/courseyearlystats**').as('coursePage')
        cy.cs('toggle-group-module-MAT110').click()
        cy.contains('td', 'MAT11001').siblings().find('[data-testid="NorthEastIcon"]').click()
        page.waitForTimeout('@coursePage')
        cy.url().should('include', '/coursestatistics')
        cy.contains('MAT11001') // Johdatus yliopistomatematiikkaan
        cy.contains('AYMAT11001') // Avoin yo: Johdatus yliopistomatematiikkaan
        cy.contains('57033') // Johdatus yliopistomatematiikkaan
        cy.contains('A57033') // Avoin yo: Johdatus yliopistomatematiikkaan
      })
      test('Curriculum selection works', async ({ page }) => {
        page.goto(pathToMathBSc2020)
        page.locator('text=Courses of class').click()
        cy.get('[data-cy=curriculum-picker]').contains('2020–2023')
        cy.get('[data-cy=toggle-group-module-MAT-tyo]')
        page.locator('[data-cy=curriculum-picker]').click()
        page.locator('text=2023\u20132026').click()
        cy.get('[data-cy=toggle-group-module-MAT-tyo]').should('not.exist')
      })
      test('Courses data is changed when curriculum is changed', async ({ page }) => {
        page.goto(pathToMathBSc2020)
        page.locator('text=Courses of class').click()
        cy.cs('curriculum-picker').scrollIntoView()
        cy.cs('curriculum-picker').should('be.visible')
        cy.cs('curriculum-picker').click()
        page.locator('text=2020\u20132023').click({ force: true })
        cy.contains('Students (27)')
        cy.cs('toggle-group-module-DIGI-k').should('exist')
        cy.cs('toggle-group-module-DIGI-k').scrollIntoView()
        cy.cs('toggle-group-module-DIGI-k').should('be.visible')
        cy.cs('toggle-group-module-DIGI-k').click({ force: true })
        cy.contains('DIGI-100').should('exist')
        cy.cs('curriculum-picker').scrollIntoView()
        cy.cs('toggle-group-module-DIGI-k').should('be.visible')
        cy.cs('curriculum-picker').click()
        page.locator('text=2023\u20132026').click({ force: true })
        cy.cs('toggle-group-module-DIGI-k').should('exist')
        cy.contains('DIGI-100').should('not.exist')
      })
      test('Courses data is changed when filtered students change', async ({ page }) => {
        page.goto(pathToMathBSc2020)
        cy.cs('graduatedFromProgrammeFilter-filter-card').within(() => {
          cy.cs('graduatedFromProgrammeFilter-header').click()
          page.locator('input[name="graduatedFromProgrammeFilter"][value="1"]').click()
          expect(page.locator('input[name="graduatedFromProgrammeFilter"][value="1"]')).toBeChecked()
        })
        cy.contains('Students (16)')
      })
    })
    test.describe('Students', () => {
      test.beforeEach(async ({ page }) => {
        page.goto(pathToMathBSc2020)
        cy.contains('Students (27)')
          .parent()
          .then($parentDiv => {
            if (!$parentDiv.hasClass('active')) page.locator('text=Students (27)').click()
          })
      })
      test("'General tab' is usable", async ({ page }) => {
        cy.cs('ooditable-general').within(() => {
          cy.contains('522142')
          cy.contains('Tilastotiede')
          cy.contains('Matematiikka')
          cy.contains('Taloustieteen maisteriohjelma')
          cy.contains('Todistusvalinta')
          cy.contains('Saksa')
          cy.contains('Female')
        })
      })
      test("'Courses tab' is usable", async ({ page }) => {
        cy.cs('student-table-tabs').within(() => {
          page.locator('text=Courses').click()
        })
        cy.cs('ooditable-courses').within(() => {
          cy.contains('MAT12001')
          cy.contains('MAT21001')
        })
      })
      test("'Modules tab' Displays correct modules based on the selected programme", async ({ page }) => {
        cy.cs('student-table-tabs').contains('Modules').click()
        cy.cs('ooditable-modules').within(() => {
          cy.contains('MAT011')
          cy.contains('MAT110')
        })
        page.locator('text=Courses of class').click()
        cy.cs('curriculum-picker').click()
        page.locator('text=2023\u20132026').click()
        page.locator('text=Courses of class').click()
        cy.cs('ooditable-modules').within(() => {
          cy.contains('MAT011').should('not.exist')
          cy.contains('MAT110')
        })
      })
      test("Empty 'tags' tab has a link to the page where tags can be created", async ({ page }) => {
        cy.cs('student-table-tabs').within(() => {
          page.locator('text=Tags').click()
        })
        cy.contains('No tags defined. You can define them here.').find('a').click()
        cy.url().should('include', '/study-programme/KH50_001?tab=4')
        cy.contains('Matemaattisten tieteiden kandiohjelma')
        cy.contains('Create new tag')
        cy.cs('create-button').should('be.disabled')
      })
    })
  })
  test.describe('When using admin', () => {
    test('Student list checking works as intended', async ({ page }) => {
      cy.init(pathToMathBSc2020, 'admin')
      const existing = '433237'
      const nonExisting = '550004'
      cy.contains('Students (27)')
        .parent()
        .then($parentDiv => {
          if (!$parentDiv.hasClass('active')) page.locator('text=Students (27)').click()
        })
      cy.contains(existing)
      cy.contains(nonExisting).should('not.exist')
      page.locator('text=button', 'text=Check student numbers').click()
      cy.contains('Check for student numbers')
      cy.cs('check-student-numbers').type(`${existing}{enter}${nonExisting}`)
      page.locator('text=button', 'text=Check students').click()
      cy.get('#checkstudentsresults').within(() => {
        cy.cs('found-title').click()
        cy.cs('found-data').contains(existing)
        cy.cs('not-found-title').click()
        cy.cs('not-found-data').contains(nonExisting)
        cy.cs('not-searched-title').click()
        cy.cs('not-searched-data').contains('457144')
      })
      page.locator('text=button', 'text=Close').click()
      cy.contains('Student numbers in list and in Sisu').should('not.exist')
    })
  })
  test.describe('When using IAM user', () => {
    test.beforeEach(async ({ page }) => {
      cy.init(pathToMathBSc2020, 'onlyiamrights')
      cy.contains('Matemaattisten tieteiden kandiohjelma')
      cy.contains('Class of 2020 - 2021, 30 students')
    })
    test('Population statistics is visible', async ({ page }) => {
      cy.cs('PopulationQueryCard').within(() => {
        cy.contains('Excludes exchange students')
        cy.contains('Excludes students with non-degree study right')
        cy.contains('Excludes students who have transferred out of this programme')
      })
    })
    test('Only correct panels are visible', async ({ page }) => {
      cy.cs('panelview-parent').within(() => {
        cy.cs('Credit accumulation (for 27 students)')
        cy.cs('Credit statistics')
        cy.cs('Age distribution')
        cy.cs('Courses of class')
      })
    })
    test('Ages cannot be ungrouped', async ({ page }) => {
      cy.contains('Age distribution')
        .parent()
        .then($parentDiv => {
          if (!$parentDiv.hasClass('active')) page.locator('text=Age distribution').click()
        })
      cy.contains('ui.checked.toggle.checkbox', 'Group ages').should('not.exist')
    })
    test('Age filter is not visible', async ({ page }) => {
      cy.get("[data-cy='filtered-students']")
      cy.get("[data-cy='Age-filter-card']").should('not.exist')
    })
    test('Students tab is not available', async ({ page }) => {
      cy.contains('Students (27)').should('not.exist')
    })
  })
})
