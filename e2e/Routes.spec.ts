import { expect, test } from '@playwright/test'
import { userHeaders } from './support/commands'

type RouteRequirements = {
  userId?: string
  roles?: string[]
  requireProgrammeRights?: boolean
  programmeRights?: string[]
  iamGroups?: string[]
}

type UserInfo = {
  userId?: string
  roles?: string[]
  programmeRights?: unknown[]
  iamGroups?: string[]
}

const baseRoutes: [string, RouteRequirements][] = [
  ['/', {}],
  ['/changelog', {}],
  ['/completedcoursessearch', {}],
  ['/university', {}],
  ['/feedback', {}],
  ['/populations', { roles: ['fullSisuAccess'], programmeRights: [] }],
  ['/study-programme', { roles: ['fullSisuAccess'], programmeRights: [] }],
  // TODO: This should probably be allowed for user with programmeRight, not only fullSisuAccess
  ['/study-programme/KH50_001', { roles: ['fullSisuAccess'], programmeRights: [] }],
  ['/coursepopulation', { roles: ['fullSisuAccess'], programmeRights: [] }],
  ['/users', { roles: ['admin'] }],
  ['/users/334', { roles: ['admin'] }],
  ['/updater', { roles: ['admin'] }],
  ['/coursestatistics', { roles: ['fullSisuAccess', 'courseStatistics'], programmeRights: [] }],
  ['/faculties', { roles: ['fullSisuAccess', 'facultyStatistics'] }],
  ['/faculties/hy-org-1000000911', { roles: ['fullSisuAccess', 'facultyStatistics'] }],
  ['/students', { roles: ['fullSisuAccess', 'studyGuidanceGroups'], programmeRights: [] }],
  ['/students/545400', { roles: ['fullSisuAccess', 'studyGuidanceGroups'], programmeRights: [] }],
  ['/custompopulation', { roles: ['fullSisuAccess', 'studyGuidanceGroups'], programmeRights: [] }],
  ['/teachers', { roles: ['teachers'] }],
  ['/teachers/hy-hlo-1463447', { roles: ['teachers'] }],
  ['/studyguidancegroups', { roles: ['studyGuidanceGroups'] }],
  ['/studyguidancegroups/otm-b3b52ff5-88f6-4d52-bd18-0588023b6322', { userId: '', roles: ['studyGuidanceGroups'] }],
  ['/close-to-graduation', { roles: ['fullSisuAccess', 'studyGuidanceGroups'] }],
  ['/languagecenterview', { iamGroups: ['grp-kielikeskus-esihenkilot'] }],
]

for (const user of userHeaders) {
  if (user.uid === 'admin') continue
  test.describe(`${user.displayname} has access only to views that were intended`, () => {
    let userInfo: UserInfo | undefined

    test.beforeAll(async ({ request }) => {
      const response = await request.get('/api/login', { headers: user })
      userInfo = (await response.json())?.user
    })

    test.beforeEach(async ({ page }) => {
      expect(userInfo).toBeDefined()

      // Inject user headers into all API calls and fail if any of them results in a server error
      await page.route('**/api/**', async route => {
        const response = await route.fetch({
          headers: {
            ...route.request().headers(),
            ...user,
          },
        })
        expect(response.status(), `${route.request().method()} ${route.request().url()}`).toBeLessThan(500)
        await route.fulfill({ response })
      })
    })

    test.afterEach(async ({ page }) => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })

    for (const [route, requirements] of baseRoutes) {
      test(`Checking access ${route}`, async ({ page }) => {
        // TODO: JAMI mock needed to make this test deterministic
        test.skip(user.uid === 'onlyiamrights' && route === '/coursestatistics')

        await page.goto(route)

        const { userId, roles = [], programmeRights = [], iamGroups = [] } = userInfo ?? {}
        const hasProgrammeRights = programmeRights.length > 0

        const requiredUserId = !requirements.userId || requirements.userId === userId
        const requiredRoles = !requirements.roles || requirements.roles.some(role => roles.includes(role))
        const requiredIamGroups =
          !requirements.iamGroups || requirements.iamGroups.some(group => iamGroups.includes(group))
        let requiredRights = !requirements.requireProgrammeRights || hasProgrammeRights

        if (requirements.programmeRights) {
          requiredRights =
            requirements.programmeRights.length === 0
              ? hasProgrammeRights
              : roles.includes('fullSisuAccess') ||
                requirements.programmeRights.every(right => programmeRights.includes(right))
        }

        // This is defined in frontend ProtectedRoute component.
        const specialNeedsRoutes = [
          'populations',
          'study-programme',
          'coursepopulation',
          'coursestatistics',
          'students',
          'custompopulation',
        ]

        const mankeli = specialNeedsRoutes.some(path => route.includes(path))
          ? requiredRoles || requiredRights
          : requiredRoles && requiredRights

        const shouldHaveAccess = mankeli && requiredUserId && requiredIamGroups

        if (shouldHaveAccess) {
          await expect(page.getByRole('heading', { name: 'Something broke' })).not.toBeVisible()
          await expect(page.getByRole('heading', { name: 'Access denied' })).not.toBeVisible()
        } else {
          await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
        }
      })
    }
  })
}
