import { expect, test, type Page } from '@playwright/test'
import { init } from './support/commands'

const student = {
  firstNames: 'Varpu Roope',
  lastName: 'Mårtensson',
  studentNumber: '550003',
  sisPersonId: 'hy-hlo-115926826',
  email: 'sisutestidata134902@testisisudata.fi',
}

const searchFor = async (page: Page, value: string) => {
  await page.getByTestId('student-search').getByRole('textbox').fill(value)
}

const openStudent = async (page: Page, studentNumber: string) => {
  await searchFor(page, studentNumber)
  await page.getByRole('cell', { name: studentNumber }).click()
}

const expectNamesHidden = async (page: Page) => {
  await expect(page.getByText(student.firstNames)).toHaveCount(0)
  await expect(page.getByText(student.lastName)).toHaveCount(0)
}

test.describe('Students tests', () => {
  test.describe('When using basic user', () => {
    test.beforeEach(async ({ page }) => {
      await init(page, '/students')
      await expect(page).toHaveURL(/\/students/)
      await expect(page.getByText('Show student names')).toBeVisible()
    })

    test('Students search form is usable', async ({ page }) => {
      await searchFor(page, student.lastName)
      await expect(page.getByText('Student number')).toBeVisible()
      await expect(page.getByText('Last name')).toHaveCount(0)
      await expect(page.getByText('First names')).toHaveCount(0)
      await expect(page.getByText('Started')).toBeVisible()
      await expect(page.getByText('Credits')).toBeVisible()
      await expect(page.getByText('Active study rights')).toBeVisible()
      await expectNamesHidden(page)

      await page.getByTestId('toggleStudentNames').click()
      await expect(page.getByText(student.firstNames)).toBeVisible()
      await expect(page.getByText('Last name')).toBeVisible()
      await expect(page.getByText('First names')).toBeVisible()
      await expect(page.getByText(student.lastName)).toBeVisible()

      await page.getByTestId('toggleStudentNames').click()
      await expectNamesHidden(page)
    })

    test('Search term must be at least 4 characters long', async ({ page }) => {
      await searchFor(page, student.lastName.slice(0, 3))
      await expect(page.getByText('Search term is not accurate enough')).toBeVisible()
      await page.getByTestId('student-search').getByRole('textbox').pressSequentially(student.lastName.slice(3)) // Appends to input
      await expect(page.locator('table tbody tr')).toHaveCount(1)
    })

    test('Can search with student number too', async ({ page }) => {
      await searchFor(page, student.studentNumber)
      await expect(page.getByText(student.studentNumber)).toBeVisible()
    })

    test('Can get student specific page by clicking student', async ({ page }) => {
      await openStudent(page, student.studentNumber)
      await expect(page.getByText('Matemaattisten tieteiden kandiohjelma (01.08.2020–31.07.2027)')).toBeVisible()
      await expectNamesHidden(page)
      await expect(page.getByText(student.email, { exact: true })).toHaveCount(0)

      await page.getByTestId('toggleStudentNames').click()
      await expect(page.getByText(student.lastName)).toBeVisible()
      await expect(page.getByText(student.firstNames)).toBeVisible()
      await expect(page.getByText(student.email)).toBeVisible()
      await page.getByTestId('toggleStudentNames').click()
      await expectNamesHidden(page)
      await expect(page.getByText(student.email)).toHaveCount(0)
    })

    test("'Update student' button is not shown", async ({ page }) => {
      await openStudent(page, student.studentNumber)
      await expect(page.getByTestId('student-info-card').getByRole('button', { name: 'Update student' })).toHaveCount(0)
    })

    test('Can get back to search menu', async ({ page }) => {
      await openStudent(page, student.studentNumber)
      await page.goBack()
      await expect(page.getByText('Student number')).toHaveCount(0)
      await expect(page.getByText('Credits')).toHaveCount(0)
    })

    test('Can jump to course', async ({ page }) => {
      await openStudent(page, student.studentNumber)
      const courseRow = page.locator('tr').filter({ hasText: 'Tilastollinen päättely I (MAT12004)' })
      await courseRow.locator('a').click()
      await expect(page).toHaveURL(/\/coursestatistics/)
      await expect(page.getByText('MAT12004', { exact: true })).toBeVisible()
      await expect(page.getByText('AYMAT12004')).toBeVisible()
      await expect(page.getByText('57046', { exact: true })).toBeVisible()
    })

    test('Has correct Sisu link', async ({ page }) => {
      await openStudent(page, student.studentNumber)
      await expect(page.getByTestId('sisu-link')).toHaveAttribute(
        'href',
        `https://sisu.helsinki.fi/tutor/role/staff/student/${student.sisPersonId}/basic/basic-info`
      )
    })

    test('Semester enrollments can be toggled', async ({ page }) => {
      await openStudent(page, student.studentNumber)
      const programmes = [
        'Oikeustieteen tohtoriohjelma',
        'Matemaattisten tieteiden kandiohjelma',
        'Oikeustieteen maisterin koulutusohjelmaOikeusnotaarin koulutusohjelma',
      ]
      const card = page.getByTestId('student-info-card')
      await card.getByText('Enrollments').click()
      await expect(card.locator('table tbody tr')).toHaveCount(3)
      await expect(card.locator('table tbody tr td:first-child')).toHaveText(programmes)
    })

    test("Searching with bad name doesn't yield results", async ({ page }) => {
      await searchFor(page, 'SWAG LITTINEN')
      await expect(page.getByText('Student number')).toHaveCount(0)
    })

    test("Searching with bad student number doesn't yield results", async ({ page }) => {
      await searchFor(page, '01114')
      await expect(page.getByText('Student number')).toHaveCount(0)
    })

    test('Can jump to population page', async ({ page }) => {
      await openStudent(page, student.studentNumber)
      await page
        .getByTestId('study-rights-section')
        .getByText('Matemaattisten tieteiden kandiohjelma')
        .getByRole('link')
        .click()
      await expect(page.getByText('Class of 2020 - 2021, 30 students')).toBeVisible()
    })

    test('Grade graph works in all three different modes', async ({ page }) => {
      await openStudent(page, student.studentNumber)
      await page.getByRole('tab', { name: 'Grade graph' }).click()
      await page.getByRole('button', { name: 'Show group mean' }).click()

      const groupSize = page.getByTestId('group-size-input')
      await expect(groupSize.getByLabel('Group size')).toBeVisible()
      await expect(groupSize.locator('input')).toHaveValue('5')

      await groupSize.locator('input').fill('10')
      await expect(groupSize.locator('input')).toHaveValue('10')
      await page.getByRole('button', { name: 'Show semester mean' }).click()
      await expect(groupSize.getByLabel('Group size')).not.toBeVisible()
    })

    test.describe('Bachelor Honours section', () => {
      test('Shows qualified student details', async ({ page }) => {
        await page.goto('/students/495976')
        await expect(page.getByRole('heading', { name: 'Bachelor Honours' })).toBeVisible()
        await expect(page.getByTestId('honours-chip-qualified')).toContainText('Qualified for Honours')
        await page.getByText('Study modules').click()

        const rows = page.getByTestId('main-modules').locator('tbody tr')
        await expect(rows).toHaveCount(3)
        await expect(
          rows.filter({ hasText: 'Matemaattisten tieteiden kandiohjelma (KH50_001)' }).locator('td')
        ).toHaveText(['07.05.2020', 'Matemaattisten tieteiden kandiohjelma (KH50_001)', 'Hyv.'])
        await expect(rows.filter({ hasText: 'Matematiikka, perusopinnot (MAT110)' }).locator('td')).toHaveText([
          '08.05.2018',
          'Matematiikka, perusopinnot (MAT110)',
          '4',
        ])
        await expect(rows.filter({ hasText: 'Matematiikka, aineopinnot (MAT210)' }).locator('td')).toHaveText([
          '25.02.2020',
          'Matematiikka, aineopinnot (MAT210)',
          '4',
        ])
      })

      test('Shows Did not graduate in time', async ({ page }) => {
        await page.goto('/students/540355')
        await expect(page.getByTestId('honours-chip-not-qualified')).toHaveText('Not qualified for Honours')
        await expect(page.getByTestId('honours-chip-error')).toHaveText('Did not graduate in time')
      })

      test('Shows Module grades too low', async ({ page }) => {
        await page.goto('/students/547934')
        await expect(page.getByTestId('honours-chip-not-qualified')).toHaveText('Not qualified for Honours')
        await expect(page.getByTestId('honours-chip-error')).toHaveText('Module grades too low')
      })

      test('Shows Might need further inspection', async ({ page }) => {
        await page.goto('/students/478837')
        await expect(page.getByTestId('honours-chip-inspection')).toHaveText('Might need further inspection')
      })

      test('Shows Has not graduated', async ({ page }) => {
        await page.goto(`/students/${student.studentNumber}`)
        await expect(page.getByTestId('honours-chip-not-qualified')).toHaveText('Not qualified for Honours')
        await expect(page.getByTestId('honours-chip-error')).toHaveText('Has not graduated')
      })
    })
  })

  test.describe('When using admin user', () => {
    test.beforeEach(async ({ page }) => {
      await init(page, '/students', 'admin')
    })

    test('Does not crash if student has no study rights or courses', async ({ page }) => {
      await openStudent(page, '450730')
      await expect(page.getByText('Credits: 0')).toBeVisible()
    })

    test("'Update student' button is shown", async ({ page }) => {
      await openStudent(page, student.studentNumber)
      await expect(page.getByTestId('student-info-card').getByRole('button', { name: 'Update student' })).toBeVisible()
    })

    test('Bachelor Honours section is not shown outside Faculty of Science', async ({ page }) => {
      await page.goto('/students/453146')
      await expect(page.getByRole('heading', { name: 'Bachelor Honours' })).toHaveCount(0)
    })

    test('Study plan courses are highlighted with a blue background', async ({ page }) => {
      await page.goto('/students/550789')
      const studyPlan = page.getByTestId('KH40_005-0')
      await expect(studyPlan).toContainText('Kulttuurien tutkimuksen kandiohjelma')
      await studyPlan.locator('td').filter({ hasText: 'Kulttuurien tutkimuksen kandiohjelma' }).click()
      await expect(page.locator('table tbody tr').filter({ hasText: 'Kandidaatintutkielma (KUKA-LIS222)' })).toHaveCSS(
        'background-color',
        'rgb(232, 244, 255)'
      )
    })

    test('Completed credits are displayed for a matching study plan', async ({ page }) => {
      await page.goto('/students/550789')
      const studyPlan = page.getByTestId('KH40_005-0')
      await expect(studyPlan).toContainText('Kulttuurien tutkimuksen kandiohjelma')
      await expect(studyPlan).toContainText('185 cr')
    })

    test('Completion percentage is displayed for an unfinished matching study plan', async ({ page }) => {
      await page.goto('/students/458723')
      const studyPlan = page.getByTestId('KH20_001-0')
      await expect(studyPlan).toContainText('Oikeusnotaarin koulutusohjelma')
      await expect(studyPlan).toContainText('69% (125 cr)')
    })
  })
})
