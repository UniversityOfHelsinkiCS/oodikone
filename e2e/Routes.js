const { test, expect } = require('@playwright/test')

const userHeaders = [
  {
    uid: 'admin',
    displayname: 'Admin User',
    'shib-session-id': 'mock-playwright-session',
    hygroupcn: 'grp-oodikone-users;grp-oodikone-basic-users;grp-toska',
    mail: 'grp-toska+mockadminuser@helsinki.fi',
    hypersonsisuid: 'hy-hlo-6666666',
  },
  {
    uid: 'basic',
    displayname: 'Basic User',
    'shib-session-id': 'mock-playwright-session',
    hygroupcn: 'grp-oodikone-users;grp-oodikone-basic-users',
    mail: 'grp-toska+mockbasicuser@helsinki.fi',
    hypersonsisuid: 'hy-hlo-1234567',
  },
  {
    uid: 'onlycoursestatistics',
    displayname: 'Onlycoursestatistics User',
    'shib-session-id': 'mock-playwright-session',
    hygroupcn: 'grp-oodikone-basic-users',
    mail: 'grp-toska+mockonlycoursestatisticsuser@helsinki.fi',
    hypersonsisuid: 'hy-hlo-7654321',
  },
  {
    uid: 'norights',
    displayname: 'Norights User',
    'shib-session-id': 'mock-playwright-session',
    hygroupcn: 'grp-oodikone-users',
    mail: 'grp-toska+mocknorightuser@helsinki.fi',
    hypersonsisuid: 'hy-hlo-0000000',
  },
  {
    uid: 'onlyiamrights',
    displayname: 'Only IAM rights user',
    'shib-session-id': 'mock-playwright-session',
    hygroupcn: 'hy-employees;hy-mltdk-mat-jory',
    mail: 'grp-toska+mockonlyiamrightsuser@helsinki.fi',
    hypersonsisuid: 'hy-hlo-1111111',
  },
  {
    uid: 'onlystudyguidancegroups',
    displayname: 'Study Guidance Groups User',
    'shib-session-id': 'mock-playwright-session',
    hygroupcn: 'grp-oodikone-users',
    mail: 'grp-toska+mockonlystudyguidancegroupsuser@helsinki.fi',
    hypersonsisuid: 'hy-hlo-2222222',
  },
]

const getBaseRoutes = [
  ['/', {}],
  ['/changelog', {}],
  ['/completedcoursessearch', {}],
  ['/university', {}],
  ['/feedback', {}],
  ['/populations', { roles: ['fullSisuAccess'], programmeRights: [] }],
  ['/study-programme', { roles: ['fullSisuAccess'], programmeRights: [] }],
  ['/study-programme/KH50_001', { roles: ['fullSisuAccess'], programmeRights: ['KH50_001'] }],
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

const specialNeedsRoutes = [
  'populations',
  'study-programme',
  'coursepopulation',
  'coursestatistics',
  'students',
  'custompopulation',
]

const initAs = async (page, path, userId = 'basic') => {
  const headers = userHeaders.find(user => user.uid === userId)
  if (!headers) throw new Error(`${userId} is not valid user id`)

  await page.setExtraHTTPHeaders(headers)
  await page.goto(path)
}

for (const user of userHeaders) {
  if (user.uid === 'admin') continue

  test.describe(`${user.displayname} has access only to views that were intended`, () => {
    let userInfo

    test.beforeAll(async ({ request }) => {
      const response = await request.get('/api/login', { headers: user })
      const body = await response.json()
      userInfo = body?.user
    })

    for (const [route, requirements] of getBaseRoutes) {
      test(`Checking access ${route}`, async ({ page }) => {
        await initAs(page, route, user.uid)

        const requiredUserId = !requirements.userId || requirements.userId === userInfo.userId
        const requiredRoles = !requirements.roles || requirements.roles.some(role => userInfo.roles?.includes(role))
        const requiredRights =
          !requirements.requireProgrammeRights ||
          userInfo.roles?.includes('fullSisuAccess') ||
          requirements.programmeRights.every(role => userInfo.programmeRights?.includes(role))

        const isSpecialRoute = specialNeedsRoutes.some(path => route.includes(path))
        const hasCoreAccess = isSpecialRoute ? requiredRoles || requiredRights : requiredRoles && requiredRights
        const shouldHaveAccess = hasCoreAccess && requiredUserId

        if (shouldHaveAccess) {
          await expect(page.getByText('Something broke')).toHaveCount(0)
          await expect(page.getByText('Access denied')).toHaveCount(0)
        } else {
          await expect(page.getByText('Access denied')).toBeVisible()
        }
      })
    }
  })
}
