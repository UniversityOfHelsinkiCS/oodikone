/// <reference types="cypress" />
// Now "Class statistics" in UI

describe('Population Statistics tests', () => {
  const pathToMathBSc2020 =
    '/populations?months=49&semesters=FALL&semesters=SPRING&studyRights=%7B"programme"%3A"KH50_001"%7D&year=2020'
  const pathToMathMSc2020 =
    '/populations?months=49&semesters=FALL&semesters=SPRING&studyRights=%7B"programme"%3A"MH50_001"%7D&year=2020'
  describe('when using basic user', () => {
    beforeEach(() => {
      cy.init('/populations')
    })

    it('Population statistics search infobox works', () => {
      cy.get('[data-cy="PopulationSearch-info-content"]').should('not.exist')
      cy.get('[data-cy="PopulationSearch-open-info"]').click()
      cy.get('[data-cy="PopulationSearch-info-content"]').should('be.visible')
      cy.get('[data-cy="PopulationSearch-info-content"]').should(
        'contain',
        'lukuvuosi, jolloin opiskelija on ilmoittautunut'
      )
      cy.get('[data-cy="PopulationSearch-close-info"]').click()
      cy.get('[data-cy="PopulationSearch-info-content"]').should('not.exist')
    })

    it('Population statistics search form is usable', () => {
      cy.contains('See class').should('be.disabled')
      cy.contains('Search for class')
      cy.contains('Class of')
        .parent()
        .within(() => {
          cy.get('.form-control').as('enrollmentSelect')
        })

      cy.get('@enrollmentSelect')
        .its(`${[0]}.value`)
        .then(beforeVal => {
          cy.get('@enrollmentSelect').click()
          cy.get('.yearSelectInput .rdtPrev').click({ force: true })
          cy.get('.yearSelectInput table').contains('2018-2019').click({ force: true })
          cy.get('@enrollmentSelect').should('not.have.value', beforeVal)
        })

      cy.contains('Select study programme')
      cy.get('[data-cy=select-study-programme]')
        .click()
        .children()
        .contains('Matematiikan ja tilastotieteen maisteriohjelma')
        .click()
      cy.contains('See class').should('be.enabled')

      cy.contains('Select study track')
      cy.get('[data-cy=select-study-track]')
        .click()
        .children()
        .contains('Matematiikka ja soveltava matematiikka')
        .click()
      cy.contains('See class').should('be.enabled')
    })

    it('Searching for population really shows population', () => {
      cy.contains('Select study programme')
      cy.get('[data-cy=select-study-programme]')
        .click()
        .children()
        .contains('Matemaattisten tieteiden kandiohjelma')
        .click()
      cy.contains('See class').click()
      cy.contains('Matemaattisten tieteiden kandiohjelma 2017 - 2018')
      cy.contains('class size 47 students')
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

    it('Courses of class is displayed and link to individual course stats page works', () => {
      cy.visit(pathToMathBSc2020)
      cy.contains('Courses of class').click()
      cy.intercept('/api/v3/courseyearlystats**').as('coursePage')
      cy.get('[data-cy=toggle-group-module-MAT110]').click()
      cy.contains('td', 'MAT11001').siblings().find('i.level.up').click()
      cy.wait('@coursePage')
      cy.url().should('include', '/coursestatistics')
      cy.contains('MAT11001 Johdatus yliopistomatematiikkaan')
      cy.contains('AYMAT11001 Avoin yo: Johdatus yliopistomatematiikkaan')
      cy.contains('57033 Johdatus yliopistomatematiikkaan')
      cy.contains('A57033 Avoin yo: Johdatus yliopistomatematiikkaan')
    })

    it('Courses of class curriculum selection works', () => {
      cy.visit(pathToMathBSc2020)
      cy.contains('Courses of class').click()
      cy.get('[data-cy=curriculum-picker]').contains('2020 - 2023')
      cy.get('[data-cy=toggle-group-module-MAT-tyo]')
      cy.get('[data-cy=curriculum-picker]').click().contains('2023 - 2026').click()
      cy.get('[data-cy=toggle-group-module-MAT-tyo]').should('not.exist')
    })

    it('New fetch of courses data is done when curriculum is changed', () => {
      cy.visit(pathToMathBSc2020)
      cy.contains('Courses of class').click()
      cy.intercept('/api/v2/populationstatistics/courses').as('courseData')
      cy.get('[data-cy=curriculum-picker]').click().contains('2020 - 2023').click()
      cy.wait('@courseData').then(({ response }) => {
        expect(response.body).to.have.property('allStudents')
        expect(response.body).to.have.property('coursestatistics')
        expect(response.body.allStudents).to.equal(27)
        expect(response.body.coursestatistics.some(stat => stat.course.code === 'DIGI-100')).to.equal(true)
      })
      cy.get('[data-cy=curriculum-picker]').click().contains('2023 - 2026').click()
      cy.wait('@courseData').then(({ response }) => {
        expect(response.body).to.have.property('allStudents')
        expect(response.body).to.have.property('coursestatistics')
        expect(response.body.allStudents).to.equal(27)
        expect(response.body.coursestatistics.some(stat => stat.course.code === 'DIGI-100')).to.equal(false)
      })
    })

    it('New fetch of courses data is done when filtered students change', () => {
      cy.visit(pathToMathBSc2020)
      cy.contains('Courses of class').click()
      cy.intercept('/api/v2/populationstatistics/courses').as('courseData')
      cy.wait('@courseData').then(({ response }) => {
        expect(response.body).to.have.property('allStudents')
        expect(response.body).to.have.property('coursestatistics')
        expect(response.body.allStudents).to.equal(27)
      })
      cy.get('[data-cy=GraduatedFromProgramme-filter-card]').within(() => {
        cy.get('[data-cy=GraduatedFromProgramme-header]').click()
        cy.get('[data-cy=option-graduated-true]').click()
        cy.wait('@courseData').then(({ response }) => {
          expect(response.body).to.have.property('allStudents')
          expect(response.body).to.have.property('coursestatistics')
          expect(response.body.allStudents).to.equal(16)
        })
      })
    })

    it("Empty 'tags' tab has a link to the page where tags can be created", { retries: 2 }, () => {
      cy.visit(pathToMathBSc2020)
      cy.contains('Students (27)')
        .parent()
        .then($parentDiv => {
          if (!$parentDiv.hasClass('active')) cy.contains('Students (27)').click()
        })
      cy.get('[data-cy=student-table-tabs]').within(() => {
        cy.contains('Tags').click()
      })
      cy.contains('No tags defined. You can define them here.').find('a').click()
      cy.url().should('include', '/study-programme/KH50_001?p_m_tab=0&p_tab=4')
      cy.contains('Matemaattisten tieteiden kandiohjelma')
      cy.contains('Create tags for study programme')
      cy.contains('button', 'Create a new tag').should('be.disabled')
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

    it("'Credits gained' tab of 'Credit statistics' shows correct statistics for all students of the class and also students grouped by admission type", () => {
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

    it("'Statistics' tab of 'Credit statistics' shows correct statistics for all students of the class and also students grouped by admission type", () => {
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

  describe('when using admin', () => {
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
      cy.get('textarea').type(existing).type('{enter}').type(nonExisting)
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

  describe('when using IAM user', () => {
    beforeEach(() => {
      cy.init(pathToMathBSc2020, 'onlyiamrights')
      cy.contains('Matemaattisten tieteiden kandiohjelma 2020 - 2021')
      cy.contains('class size 30 students')
    })

    it('Population statistics is visible', () => {
      cy.get('.card').within(() => {
        cy.contains('Excludes exchange students')
        cy.contains('Excludes students with non-degree study right')
        cy.contains('Excludes students who have transferred out of this programme')
      })
    })

    it('Only correct panes are visible', () => {
      const correctPanes = [
        'Credit accumulation (for 27 students)',
        'Credit statistics',
        'Age distribution',
        'Courses of class',
      ]
      cy.get('.accordion.ui.fluid.styled').within(() => {
        cy.get('.title').should('have.length', correctPanes.length)
        correctPanes.forEach((pane, index) => {
          cy.get('.title').eq(index).contains(pane)
        })
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
