// ! IMPORTANT: here we need to set keys to be all lowercase, since
// ! we're replacing headers after they've left browser / frontend.

import { BrowserContext, expect, Page } from '@playwright/test'

// All of these users are available in anon user-db
const adminUserHeaders = {
  uid: 'admin',
  displayname: 'Admin User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-users;grp-oodikone-basic-users;grp-toska',
  mail: 'grp-toska+mockadminuser@helsinki.fi',
  hypersonsisuid: 'hy-hlo-6666666',
}

const basicUserHeaders = {
  uid: 'basic',
  displayname: 'Basic User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-users;grp-oodikone-basic-users',
  mail: 'grp-toska+mockbasicuser@helsinki.fi',
  hypersonsisuid: 'hy-hlo-1234567',
}

const onlycoursestatisticsUserHeaders = {
  uid: 'onlycoursestatistics',
  displayname: 'Onlycoursestatistics User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-basic-users',
  mail: 'grp-toska+mockonlycoursestatisticsuser@helsinki.fi',
  hypersonsisuid: 'hy-hlo-7654321',
}

const norightsUserHeaders = {
  uid: 'norights',
  displayname: 'Norights User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-users',
  mail: 'grp-toska+mocknorightuser@helsinki.fi',
  hypersonsisuid: 'hy-hlo-0000000',
}

const onlyIamRightsUserHeaders = {
  uid: 'onlyiamrights',
  displayname: 'Only IAM rights user',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'hy-employees;hy-mltdk-mat-jory',
  mail: 'grp-toska+mockonlyiamrightsuser@helsinki.fi',
  hypersonsisuid: 'hy-hlo-1111111',
}

// Also has element detail of "KH50_005" for the study guidance groups to work
const onlyStudyGuidanceGroupsUser = {
  uid: 'onlystudyguidancegroups',
  displayname: 'Study Guidance Groups User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-users',
  mail: 'grp-toska+mockonlystudyguidancegroupsuser@helsinki.fi',
  hypersonsisuid: 'hy-hlo-2222222',
}

export const userHeaders = [
  adminUserHeaders,
  basicUserHeaders,
  onlycoursestatisticsUserHeaders,
  norightsUserHeaders,
  onlyIamRightsUserHeaders,
  onlyStudyGuidanceGroupsUser,
]

export const testMockTime = '2026-03-01'

type UserId = 'admin' | 'basic' | 'onlycoursestatistics' | 'norights' | 'onlyiamrights' | 'onlystudyguidancegroups'

export const init = async (page: Page, path: string, userId: UserId = 'basic', context?: BrowserContext) => {
  const headersToUse = userHeaders.find(({ uid }) => uid === userId)
  if (!headersToUse) throw Error(`${userId} is not valid user id!`)

  // Prefer context-level routing when provided so new tabs inherit header injection.
  const routeTarget = context ?? page

  await routeTarget.route('**/api/**', async route => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        ...headersToUse,
        'x-test-now': testMockTime,
      },
    })
  })

  await page.clock.install({ time: testMockTime })
  await page.goto(path || '/')
}

export const checkTableStats = async (page: Page, correctStats: (string | number)[][], tableName: string) => {
  const testId = tableName + '-data-table'
  await expect(page.getByTestId(testId).getByText('Loading content')).not.toBeVisible()

  const table = page.getByTestId(testId).locator('tbody')
  await expect(table).toBeVisible()
  await expect(table.locator('tr > td')).toHaveText(correctStats.flatMap(stats => stats.map(value => value.toString())))
}
