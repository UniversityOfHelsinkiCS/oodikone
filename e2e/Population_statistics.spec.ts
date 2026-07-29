import { test, expect, Page } from '@playwright/test'
import { init } from './support/commands'

// Now "Class statistics" in UI
const selectStudyProgramme = async (page: Page, programme: string) => {
  await expect(page.getByTestId('population-programme-selector').locator('input')).toHaveAttribute(
    'placeholder',
    'Select degree programme'
  )
  await page.getByTestId('population-programme-selector-parent').click()
  await page.getByTestId('population-programme-selector-parent').getByText(programme).click()
}

const selectStudyTrack = async (page: Page, studyTrack: string) => {
  await expect(page.getByTestId('population-studytrack-selector').locator('input')).toHaveAttribute(
    'placeholder',
    'Select study track'
  )
  await page.getByTestId('population-studytrack-selector-parent').click()
  await page.getByTestId('population-studytrack-selector-parent').getByText(studyTrack).click()
}

const getPath = (programme: string) => {
  return `/populations?months=49&semesters=FALL&semesters=SPRING&programme=${programme}&years=2020`
}

const pathToMathBSc2020 = getPath('KH50_001')
const pathToMathMSc2020 = getPath('MH50_001')

test.describe('Population statistics tests', () => {
  test.describe('When using basic user', () => {
    test.beforeEach(async ({ page }) => {
      await init(page, '/populations')
    })

    test.describe('Population search', () => {
      test('Info box works', async ({ page }) => {
        await expect(page.getByTestId('PopulationSearch-info-box-content')).not.toBeVisible()
        await page.getByTestId('PopulationSearch-info-box-button').hover()
        await expect(page.getByTestId('PopulationSearch-info-box-content')).toBeVisible()

        await expect(
          page.getByTestId('PopulationSearch-info-box-content').getByText('Tässä osiossa voi tarkastella')
        ).toBeVisible()

        await page.getByTestId('PopulationSearch-info-box-button').dispatchEvent('mouseout')
        await expect(page.getByTestId('PopulationSearch-info-box-content')).not.toBeVisible()
      })

      test('Form is usable', async ({ page }) => {
        await expect(page.getByText('Search for class')).toBeVisible()
        await expect(page.getByText('See class')).toBeDisabled()

        const yearSelect = page.getByTestId('population-year-selector')
        const yearDecrement = page.getByTestId('population-year-decrement')
        const yearIncrement = page.getByTestId('population-year-increment')

        await yearSelect.click()
        await page.getByText('2018 - 2019').click()
        await expect(yearSelect.getByText('2018 - 2019')).toBeVisible()

        await yearDecrement.click()
        await expect(yearSelect.getByText('2017 - 2018')).toBeVisible()

        await yearIncrement.click()
        await expect(yearSelect.getByText('2018 - 2019')).toBeVisible()

        await expect(page.getByTestId('population-studytrack-selector').locator('input')).toHaveAttribute(
          'placeholder',
          'No study tracks available'
        )

        await selectStudyProgramme(page, 'Matematiikan ja tilastotieteen maisteriohjelma')
        await expect(page.getByText('See class')).toBeEnabled()

        await selectStudyTrack(page, 'Matematiikka ja soveltava matematiikka')
        await expect(page.getByText('See class')).toBeEnabled()
      })

      test.describe('Correct population is shown for programme', () => {
        test('without study tracks', async ({ page }) => {
          await selectStudyProgramme(page, 'Matematiikan ja tilastotieteen maisteriohjelma')

          // Select year 2020 - 2021
          const yearSelect = page.getByTestId('population-year-selector')
          await yearSelect.click()
          await page.getByText('2020 - 2021').click()

          await page.getByText('See class').click()
          await expect(page.getByText('Matematiikan ja tilastotieteen maisteriohjelma')).toBeVisible()
          await expect(page.getByText('Class of 2020 - 2021, 26 students')).toBeVisible()
          await expect(page.getByText('Showing 26 out of 26 students')).toBeVisible()

          await expect(page.getByText('Studytrack MAST-MSM')).not.toBeVisible()
        })

        test('with study tracks', async ({ page }) => {
          await selectStudyProgramme(page, 'Matematiikan ja tilastotieteen maisteriohjelma')

          // Select year 2020 - 2021
          const yearSelect = page.getByTestId('population-year-selector')
          await yearSelect.click()
          await page.getByText('2020 - 2021').click()

          await selectStudyTrack(page, 'Matematiikka ja soveltava matematiikka')

          await page.getByText('See class').click()
          await expect(page.getByText('Matematiikan ja tilastotieteen maisteriohjelma')).toBeVisible()
          await expect(page.getByText('Class of 2020 - 2021, 26 students')).toBeVisible()
          await expect(page.getByText('Showing 15 out of 26 students')).toBeVisible()

          await expect(page.getByText('Studytrack MAST-MSM')).toBeVisible()
        })
      })
    })

    test('Population statistics is usable on general level', async ({ page }) => {
      await page.goto(pathToMathBSc2020)
      await expect(page.getByTestId('filtered-students')).toBeVisible()
      await expect(page.getByText('Matemaattisten tieteiden kandiohjelma')).toBeVisible()
      await expect(page.getByText('Class of 2020 - 2021, 30 students')).toBeVisible()
      await expect(page.getByText('Showing 27 out of 30 students')).toBeVisible()

      await expect(page.getByText('Excludes exchange students')).toBeVisible()
      await expect(page.getByText('Excludes students with non-degree study right')).toBeVisible()
      await expect(page.getByText('Excludes students who have transferred out of this programme')).toBeVisible()
      await expect(page.getByTestId('filtered-students')).toBeVisible()
    })

    test('Advanced settings work', async ({ page }) => {
      await page.goto(pathToMathMSc2020)

      await expect(page.getByText('Credit accumulation (for 26 students)')).toBeVisible()
      await expect(page).toHaveURL(/.*semesters=FALL&semesters=SPRING.*/)

      await page.getByTestId('advanced-toggle').click()

      // only spring
      await page.getByTestId('toggle-fall').click()
      await page.getByText('Fetch class').click()

      await expect(page.getByText('Credit accumulation (for 17 students)')).toBeVisible()
      await expect(page).not.toHaveURL(/.*semesters=FALL.*/)

      await page.getByTestId('advanced-toggle').click()
      await page.getByTestId('toggle-fall').click()
      await page.getByTestId('toggle-spring').click()
      await page.getByText('Fetch class').click()

      await expect(page.getByText('Credit accumulation (for 9 students)')).toBeVisible()
      await expect(page).not.toHaveURL(/.*semesters=SPRING.*/)

      await page.getByTestId('advanced-toggle').click()
      await page.getByTestId('toggle-spring').click()
      await page.getByText('Fetch class').click()

      await expect(page.getByText('Credit accumulation (for 26 students)')).toBeVisible()
      await expect(page).toHaveURL(/.*semesters=FALL&semesters=SPRING.*/)
    })

    test.describe('Credit statistics', () => {
      test("'Credits gained' tab shows correct statistics for all students of the class and also students grouped by admission type", async ({
        page,
      }) => {
        await page.goto(pathToMathBSc2020)
        const totalStudents = 27

        await expect(page.getByText('Credit statistics')).toBeVisible()
        await page.getByText('Credit statistics').click()

        await expect(page.getByTestId('credits-gained-tab')).toBeVisible()
        await page.getByTestId('credits-gained-tab').click()

        const limits = [1, 45, 90, 135, 180, null]
        const ranges = limits.map((limit, i) => (i === 0 ? [null, 0] : [limits[i - 1], limit])).reverse()

        const getTableData = (selector: string, numbersOfStudents: number[]) => {
          const studentsInCategory = numbersOfStudents.reduce((acc, val) => acc + val, 0)
          return ranges.map((range, index) => ({
            selector: `credits-gained-table-${selector}`,
            start: range[0],
            end: range[1],
            students: numbersOfStudents[index],
            percentage: `${((numbersOfStudents[index] / studentsInCategory) * 100).toFixed(1)}%`,
          }))
        }

        await expect(page.getByTestId('credits-gained-table-All students of the class')).toBeVisible()

        await expect(page.getByTestId('credits-gained-table-All students of the class').locator('th')).toHaveCount(4)
        await expect(page.getByTestId('credits-gained-table-All students of the class').locator('th')).toHaveText([
          '',
          'Credits gained between 01.08.2020 and 29.07.2026' + '(72 months)',
          `Number of students` + `(n = ${totalStudents})`,
          'Percentage of population',
        ])

        for (const category of [
          getTableData('All students of the class', [9, 5, 7, 4, 2, 0]),
          getTableData('Avoin väylä', [0, 1, 3, 2, 0, 0]),
          getTableData('Muu', [0, 1, 1, 1, 0, 0]),
          getTableData('Todistusvalinta', [9, 3, 3, 1, 2, 0]),
        ]) {
          category.forEach(async ({ selector, start, end, students, percentage }, index) => {
            let value
            if (start === null) {
              value = '0 credits'
            } else if (end === null) {
              value = `${start} ≤ credits`
            } else {
              value = `${start} ≤ credits < ${end}`
            }
            const bodyLocator = page.getByTestId(selector).getByTestId('credits-gained-table-body')
            await expect(bodyLocator).toBeVisible()
            const row = bodyLocator.locator('tr').nth(index)
            await expect(row.locator('td')).toHaveCount(4)
            await expect(row.locator('td')).toHaveText(['' /* Icon */, value, students.toString(), percentage])
          })
        }

        const numberOfStudentCounts = await page
          .getByTestId('credits-gained-table-All students of the class')
          .getByTestId('credits-gained-table-body')
          .locator('td:nth-child(3)')
          .allTextContents()
        const sum = numberOfStudentCounts.reduce((acc, t) => acc + parseInt(t, 10), 0)
        expect(sum).toBe(totalStudents)
      })

      test("'Statistics' tab shows correct statistics for all students of the class and also students grouped by admission type", async ({
        page,
      }) => {
        await page.goto(pathToMathBSc2020)
        await page.getByText('Credit statistics').click()

        await page.getByTestId('credit-statistics-tab').click()
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
          const tableLocator = page.getByTestId(`statistics-table-${selector}`)
          await expect(tableLocator).toBeVisible()
          await expect(tableLocator.getByRole('heading', { level: 5, name: selector })).toBeVisible()

          await expect(tableLocator.getByTestId('credit-stats-population-size')).toContainText(`n = ${size}`)

          for (let index = 0; index < rows.length; index++) {
            const row = tableLocator.locator('table tbody tr').nth(index)
            await expect(row.locator('td')).toHaveText([rows[index], data[index]])
          }
        }
      })
    })

    test.describe('Courses of class', () => {
      test('Is displayed and link to individual course stats page works and has substitutions enabled', async ({
        page,
      }) => {
        await page.goto(pathToMathBSc2020)
        await page.getByText('Courses of class').click()
        await page.getByTestId('toggle-group-module-MAT110').click()

        await page.getByRole('row', { name: 'MAT11001' }).getByRole('link').click()
        await expect(page).toHaveURL(/.*coursestatistics.*/)
        await expect(page.getByText('MAT11001', { exact: true })).toBeVisible()
        await expect(page.getByText('AYMAT11001')).toBeVisible()
        await expect(page.getByText('57033', { exact: true })).toBeVisible()
        await expect(page.getByText('A57033')).toBeVisible()
      })

      test('Curriculum selection works', async ({ page }) => {
        await page.goto(pathToMathBSc2020)
        await page.getByText('Courses of class').click()

        await expect(page.getByTestId('curriculum-picker')).toContainText('2020–2023')
        await expect(page.getByTestId('toggle-group-module-MAT-tyo')).toBeVisible()

        await page.getByTestId('curriculum-picker').click()
        await page.getByText('2023–2026').click()
        await expect(page.getByTestId('toggle-group-module-MAT-tyo')).not.toBeVisible()
      })

      test('Courses data is changed when curriculum is changed', async ({ page }) => {
        await page.goto(pathToMathBSc2020)
        await page.getByText('Courses of class').click()

        const curriculumPicker = page.getByTestId('curriculum-picker')
        await expect(curriculumPicker.getByText('2020–2023')).toBeVisible()

        await expect(page.getByText('Students (27)')).toBeVisible()

        await expect(page.getByTestId('toggle-group-module-DIGI-k')).toBeVisible()
        await page.getByTestId('toggle-group-module-DIGI-k').click()

        await expect(page.getByText('DIGI-100')).toBeVisible()
        await expect(page.getByTestId('toggle-group-module-DIGI-k')).toBeVisible()

        await curriculumPicker.click()
        await page.getByText('2023–2026').click()

        await expect(page.getByTestId('toggle-group-module-DIGI-k')).toBeVisible()
        await expect(page.getByText('DIGI-100')).not.toBeVisible()
      })

      test('Courses data is changed when filtered students change', async ({ page }) => {
        await page.goto(pathToMathBSc2020)
        const filterCard = page.getByTestId('graduatedFromProgrammeFilter-filter-card')
        await filterCard.getByTestId('graduatedFromProgrammeFilter-header').click()

        await page.getByRole('radio', { name: 'Graduated', exact: true }).click()
        await expect(page.getByRole('radio', { name: 'Graduated', exact: true })).toBeChecked()
        await expect(page.getByText('Students (16)')).toBeVisible()
      })
    })

    test.describe('Students', () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(pathToMathBSc2020)
        const studentsHeading = page.getByText('Students (27)')
        const parentHasActive = await studentsHeading.evaluate(el => el.parentElement?.classList.contains('active'))
        if (!parentHasActive) await page.getByText('Students (27)').click()
      })

      test("'General tab' is usable", async ({ page }) => {
        const general = page.getByTestId('ooditable-general')
        await expect(general).toBeVisible()

        const row = general.locator('tbody').locator('tr').filter({ hasText: '489963' })
        await expect(row.locator('td')).toHaveCount(24)
        await expect(row.locator('td')).toHaveText(
          [
            '489963' + 'Sisu',
            'Graduated',
            241,
            0,
            169,
            0,
            0,
            2020,
            '2020-08-01',
            '2020-08-01',
            '2022-06-13',
            23,
            '',
            'Matematiikka',
            'Matematiikan ja tilastotieteen maisteriohjelma',
            'Matematiikan ja tilastotieteen maisteriohjelma',
            '',
            'Avoin väylä',
            'Male',
            'Suomi',
            '',
            '',
            '',
            '',
          ].map(n => n.toString())
        )
      })

      test("'Courses tab' is usable", async ({ page }) => {
        await page.getByTestId('student-table-tabs').getByText('Courses').click()
        const courses = page.getByTestId('ooditable-courses')
        await expect(courses.getByText('MAT11001')).toBeVisible()
        await expect(courses.getByText('MAT11004')).toBeVisible()
      })

      test("'Modules tab' Displays correct modules based on the selected programme", async ({ page }) => {
        await page.getByTestId('student-table-tabs').getByText('Modules').click()
        const modules = page.getByTestId('ooditable-modules')

        await expect(modules.getByText('MAT011')).toBeVisible()
        await expect(modules.getByText('MAT110')).toBeVisible()

        await page.getByText('Courses of class').click()
        await page.getByTestId('curriculum-picker').click()
        await page.getByText('2023–2026').click()
        await page.getByText('Courses of class').click()

        await expect(page.getByTestId('ooditable-modules').getByText('MAT011')).not.toBeVisible()
        await expect(page.getByTestId('ooditable-modules').getByText('MAT110')).toBeVisible()
      })

      test("Empty 'tags' tab has a link to the page where tags can be created", async ({ page }) => {
        await page.getByTestId('student-table-tabs').getByText('Tags').click()
        await expect(page.getByText('No tags defined. You can define them')).toBeVisible()
        await page.getByRole('link', { name: 'here' }).click()

        await expect(page).toHaveURL(/.*study-programme\/KH50_001\?tab=4.*/)
        await expect(page.getByText('Matemaattisten tieteiden kandiohjelma')).toBeVisible()
        await expect(page.getByText('Create new tag')).toBeVisible()
        await expect(page.getByTestId('create-button')).toBeDisabled()
      })
    })
  })

  test.describe('When using admin', () => {
    test('Student list checking works as intended', async ({ page }) => {
      await init(page, pathToMathBSc2020, 'admin')
      const existing = '433237'
      const nonExisting = '550004'
      await expect(page.getByText('Students (27)')).toBeVisible()
      await page.getByText('Students (27)').click()

      await expect(page.getByText(existing)).toBeVisible()
      await expect(page.getByText(nonExisting)).not.toBeVisible()

      await page.getByRole('button', { name: 'Check student numbers' }).click()
      await expect(page.getByText('Check for student numbers')).toBeVisible()
      await page.getByTestId('check-student-numbers').getByRole('textbox').fill(`${existing}\n${nonExisting}`)
      await page.getByRole('button', { name: 'Check students' }).click()

      const results = page.locator('#checkstudentsresults')
      await results.getByTestId('found-title').click()
      await expect(results.getByTestId('found-data').getByText(existing)).toBeVisible()

      await results.getByTestId('not-found-title').click()
      await expect(results.getByTestId('not-found-data').getByText(nonExisting)).toBeVisible()

      await results.getByTestId('not-searched-title').click()
      await expect(results.getByTestId('not-searched-data').getByText('457144')).toBeVisible()

      await page.getByRole('button', { name: 'Close' }).click()
      await expect(page.getByText('Student numbers in list and in Sisu')).not.toBeVisible()
    })
  })

  test.describe('When using IAM user', () => {
    test.beforeEach(async ({ page }) => {
      await init(page, pathToMathBSc2020, 'onlyiamrights')
      await expect(page.getByText('Matemaattisten tieteiden kandiohjelma')).toBeVisible()
      await expect(page.getByText('Class of 2020 - 2021, 30 students')).toBeVisible()
    })

    test('Population statistics is visible', async ({ page }) => {
      const card = page.getByTestId('PopulationQueryCard')
      await expect(card.getByText('Excludes exchange students')).toBeVisible()
      await expect(card.getByText('Excludes students with non-degree study right')).toBeVisible()
      await expect(card.getByText('Excludes students who have transferred out of this programme')).toBeVisible()
    })

    test('Only correct panels are visible', async ({ page }) => {
      const panelParent = page.getByTestId('panelview-parent')
      await expect(panelParent.getByText('Credit accumulation (for 27 students)')).toBeVisible()
      await expect(panelParent.getByText('Credit statistics')).toBeVisible()
      await expect(panelParent.getByText('Age distribution')).toBeVisible()
      await expect(panelParent.getByText('Courses of class')).toBeVisible()
    })

    test('Ages cannot be ungrouped', async ({ page }) => {
      await expect(page.getByText('Age distribution')).toBeVisible()
      await page.getByText('Age distribution').click()
      await expect(page.getByText('Group ages')).not.toBeVisible()
    })

    test('Age filter is not visible', async ({ page }) => {
      await expect(page.locator("[data-cy='filtered-students']")).toBeVisible()
      await expect(page.locator("[data-cy='Age-filter-card']")).not.toBeVisible()
    })

    test('Students tab is not available', async ({ page }) => {
      await expect(page.getByText('Students (27)')).not.toBeVisible()
    })
  })
})
