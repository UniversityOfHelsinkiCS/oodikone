import { test, expect } from '@playwright/test'
/// <reference types="cypress" />
const student = {
  firstNames: 'Varpu Roope',
  lastName: 'Mårtensson',
  studentNumber: '550003',
  sisPersonId: 'hy-hlo-115926826',
  email: 'sisutestidata134902@testisisudata.fi',
}
const typeToSearch = async (page, text) => {
  cy.cs('student-search').type(text)
}
const typeStudentNumberAndClick = async (page, studentNumber) => {
  typeToSearch(page)
  page.locator('text=td', studentNumber).click()
}
test.describe('Students tests', () => {
  test.describe('When using basic user', () => {
    test.beforeEach(async ({ page }) => {
      cy.init('')
      page.locator('text=Students').click()
      cy.url().should('include', '/students')
      cy.contains('Show student names')
    })
    test('Students search form is usable', async ({ page }) => {
      typeToSearch(page)
      cy.contains('Student number')
      cy.contains('Last name').should('not.exist')
      cy.contains('First names').should('not.exist')
      cy.contains('Started')
      cy.contains('Credits')
      cy.contains('Active study rights')
      cy.contains(student.firstNames).should('not.exist')
      cy.contains(student.lastName).should('not.exist')
      cy.cs('toggleStudentNames').click()
      cy.contains(student.firstNames)
      cy.contains('Student number')
      cy.contains('Last name')
      cy.contains('First names')
      cy.contains('Started')
      cy.contains('Credits')
      cy.contains('Active study rights')
      cy.contains(student.firstNames)
      cy.contains(student.lastName)
      cy.cs('toggleStudentNames').click()
      cy.contains('Student number')
      cy.contains('Last name').should('not.exist')
      cy.contains('First names').should('not.exist')
      cy.contains('Started')
      cy.contains('Credits')
      cy.contains('Active study rights')
      cy.contains(student.firstNames).should('not.exist')
      cy.contains(student.lastName).should('not.exist')
    })
    test('Search term must be at least 4 characters long', async ({ page }) => {
      typeToSearch(page)
      cy.contains('Search term is not accurate enough')
      typeToSearch(page)
      expect(page.locator('table tbody tr')).toHaveCount(1)
    })
    test('Can search with student number too', async ({ page }) => {
      typeToSearch(page)
      cy.contains(student.studentNumber)
    })
    test('Can get student specific page by clicking student', async ({ page }) => {
      typeStudentNumberAndClick(page)
      cy.contains('Matemaattisten tieteiden kandiohjelma (01.08.2020–31.07.2027)')
      cy.contains(student.lastName).should('not.exist')
      cy.contains(student.firstNames).should('not.exist')
      cy.contains(student.email).should('not.exist')
      cy.cs('toggleStudentNames').click()
      cy.contains(student.lastName)
      cy.contains(student.firstNames)
      cy.contains(student.email)
      cy.cs('toggleStudentNames').click()
      cy.contains(student.lastName).should('not.exist')
      cy.contains(student.firstNames).should('not.exist')
      cy.contains(student.email).should('not.exist')
    })
    test("'Update student' button is not shown", async ({ page }) => {
      typeStudentNumberAndClick(page)
      cy.cs('student-info-card').within(() => {
        cy.contains('button', 'Update student').should('not.exist')
      })
    })
    test('Can get back to search menu', async ({ page }) => {
      typeStudentNumberAndClick(page)
      cy.go('back')
      cy.contains('Student number').should('not.exist')
      cy.contains('Credits').should('not.exist')
    })
    test('Can jump to course', async ({ page }) => {
      typeStudentNumberAndClick(page)
      cy.contains('Tilastollinen päättely I (MAT12004)')
        .parent()
        .siblings()
        .last()
        .within(() => {
          page.locator('a').click()
        })
      cy.url().should('include', '/coursestatistics')
      cy.contains('MAT12004') // Tilastollinen päättely I
      cy.contains('AYMAT12004') // Avoin yo: Tilastollinen päättely I
      cy.contains('57046') // Johdatus tilastolliseen päättelyyn
    })
    test('Has correct Sisu link', async ({ page }) => {
      typeStudentNumberAndClick(page)
      cy.cs('sisu-link')
        .should('have.attr', 'href')
        .and('include', `https://sisu.helsinki.fi/tutor/role/staff/student/${student.sisPersonId}/basic/basic-info`)
    })
    test('Semester enrollments can be toggled', async ({ page }) => {
      typeStudentNumberAndClick(page)
      const programmes = [
        'Oikeustieteen tohtoriohjelma',
        'Matemaattisten tieteiden kandiohjelma',
        'Oikeustieteen maisterin koulutusohjelmaOikeusnotaarin koulutusohjelma',
      ]
      cy.cs('student-info-card').within(() => {
        page.locator('text=Enrollments').click()
        cy.get('table tbody tr')
          .should('have.length', 3)
          .each(($tr, index) => {
            cy.wrap($tr).within(() => {
              cy.get('td').eq(0).should('have.text', programmes[index])
            })
          })
      })
    })
    test("Searching with bad name doesn't yield results", async ({ page }) => {
      typeToSearch(page)
      cy.contains('Student number').should('not.exist')
    })
    test("Searching with bad student number doesn't yield results", async ({ page }) => {
      typeToSearch(page)
      cy.contains('Student number').should('not.exist')
    })
    test('Can jump to population page', async ({ page }) => {
      typeStudentNumberAndClick(page)
      cy.cs('study-rights-section').within(() => {
        cy.contains('Matemaattisten tieteiden kandiohjelma')
          .parent()
          .within(() => cy.get('a').click())
      })
      cy.contains('Matemaattisten tieteiden kandiohjelma')
      cy.contains('Class of 2020 - 2021, 30 students')
    })
    test('Grade graph works in all three different modes', async ({ page }) => {
      typeStudentNumberAndClick(page)
      page.locator('text=button', 'text=Grade graph').click()
      page.locator('text=button', 'text=Show group mean').click()
      cy.cs('group-size-input').within(() => {
        cy.contains('label', 'Group size')
        expect(page.locator('input')).toHaveValue('5')
      })
      cy.cs('group-size-input').within(() => {
        cy.contains('label', 'Group size')
        page.locator('input').fill('')
        page.locator('input').type('10')
        expect(page.locator('input')).toHaveValue('10')
      })
      page.locator('text=button', 'text=Show semester mean').click()
    })
    test.describe('Bachelor Honours section', () => {
      test("Shows 'Qualified for Honours' tag and main modules info when the student is qualified", async ({
        page,
      }) => {
        page.goto('/students/495976')
        cy.contains('h2', 'Bachelor Honours')
        cy.contains('[data-cy=honours-chip-qualified]', 'Qualified for Honours')
        page.locator('text=Study modules').click()
        cy.get('[data-cy=main-modules] tbody tr')
          .should('have.length', 3)
          .each(($tr, index) => {
            const info = [
              ['07.05.2020', 'Matemaattisten tieteiden kandiohjelma (KH50_001)', 'Hyv.'],
              ['08.05.2018', 'Matematiikka, perusopinnot (MAT110)', '4'],
              ['25.02.2020', 'Matematiikka, aineopinnot (MAT210)', '4'],
            ]
            cy.wrap($tr).within(() => {
              info[index].forEach((text, i) => {
                cy.get('td').eq(i).contains(text)
              })
            })
          })
      })
      test("Shows 'Did not graduate in time' when the student has graduated but not in time", async ({ page }) => {
        page.goto('/students/540355')
        cy.contains('h2', 'Bachelor Honours')
        cy.contains('[data-cy=honours-chip-not-qualified]', 'Not qualified for Honours')
        cy.contains('[data-cy=honours-chip-error]', 'Did not graduate in time')
      })
      test("Shows 'Module grades too low' when the student has graduated in time but has too low grades", async ({
        page,
      }) => {
        page.goto('/students/547934')
        cy.contains('h2', 'Bachelor Honours')
        cy.contains('[data-cy=honours-chip-not-qualified]', 'Not qualified for Honours')
        cy.contains('[data-cy=honours-chip-error]', 'Module grades too low')
      })
      test("Shows 'Might need further inspection' when the student has graduated in time but has more than four main modules", async ({
        page,
      }) => {
        page.goto('/students/478837')
        cy.contains('h2', 'Bachelor Honours')
        cy.contains('[data-cy=honours-chip-inspection]', 'Might need further inspection')
      })
      test("Shows 'Has not graduated' when the student has not graduated", async ({ page }) => {
        page.goto(`students/${student.studentNumber}`)
        cy.contains('h2', 'Bachelor Honours')
        cy.contains('[data-cy=honours-chip-not-qualified]', 'Not qualified for Honours')
        cy.contains('[data-cy=honours-chip-error]', 'Has not graduated')
      })
    })
  })
  test.describe('When using admin user', () => {
    test.beforeEach(async ({ page }) => {
      cy.init('/students', 'admin')
    })
    test('Does not crash if student has no study rights or courses', async ({ page }) => {
      typeStudentNumberAndClick(page)
      cy.contains('Credits: 0')
    })
    test("'Update student' button is shown", async ({ page }) => {
      typeStudentNumberAndClick(page)
      cy.cs('student-info-card').within(() => {
        cy.contains('button', 'Update student')
      })
    })
    test('Bachelor Honours section is not shown for students outside of Faculty of Science', async ({ page }) => {
      page.goto('/students/453146')
      cy.contains('h2', 'Bachelor Honours').should('not.exist')
    })
    test('When a study plan is selected, courses included in the study plan are highlighted with a blue background', async ({
      page,
    }) => {
      page.goto('/students/550789')
      cy.contains('Study rights')
      cy.get('[data-cy=KH40_005-0]').contains('Kulttuurien tutkimuksen kandiohjelma')
      cy.get('[data-cy=KH40_005-0]').within(() => {
        cy.get('td').eq(1).click()
      })
      cy.contains('table tbody tr', 'Kandidaatintutkielma (KUKA-LIS222)').should(
        'have.css',
        'background-color',
        'rgb(232, 244, 255)'
      )
    })
    test("If there's a study plan corresponding to the degree programme, completed credits are displayed", async ({
      page,
    }) => {
      page.goto('/students/550789')
      cy.contains('Study rights')
      cy.get('[data-cy=KH40_005-0]').contains('Kulttuurien tutkimuksen kandiohjelma')
      cy.get('[data-cy=KH40_005-0]').within(() => {
        cy.get('td')
          .eq(4)
          .contains(/^185 cr$/)
      })
    })
    test("If there's a study plan corresponding to the degree programme and the student hasn't graduated, percentage of completion is also displayed", async ({
      page,
    }) => {
      page.goto('/students/458723')
      cy.contains('Study rights')
      cy.get('[data-cy=KH20_001-0]').contains('Oikeusnotaarin koulutusohjelma')
      cy.get('[data-cy=KH20_001-0]').within(() => {
        cy.get('td').eq(4).contains('69% (125 cr)')
      })
    })
  })
})
