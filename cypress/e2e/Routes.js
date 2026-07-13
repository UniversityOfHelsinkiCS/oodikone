import { userHeaders } from '../support/commands.js'

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

for (const user of userHeaders) {
  if (user.uid === 'admin') continue
  describe(`${user.displayname} has access only to views that were intended`, () => {
    let userInfo
    before(() => {
      cy.request({ method: 'GET', url: '/api/login', headers: user }).then(({ body }) => (userInfo = body?.user))
    })

    beforeEach(() => cy.wrap(userInfo).should('not.be.undefined'))
    beforeEach(() => {
      cy.intercept('**/api/**', req => {
        req.on('response', res => {
          expect(res.statusCode, `${req.method} ${req.url}`).to.be.lessThan(500)
        })
      })
    })

    for (const [route, requirements] of getBaseRoutes) {
      it(`Checking access ${route}`, () => {
        cy.init(route, user.uid)

        const requiredUserId = !requirements.userId || requirements.userId === userInfo.userId

        const requiredRoles = !requirements.roles || requirements.roles?.some(role => userInfo.roles?.includes(role))

        const requiredRights =
          !requirements.requireProgrammeRights ||
          userInfo.roles?.includes('fullSisuAccess') ||
          requirements.programmeRights.every(role => userInfo.programmeRights?.includes(role))

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

        const shouldHaveAccess = mankeli && requiredUserId

        if (shouldHaveAccess) {
          cy.contains('Something broke').should('not.exist')
          cy.contains('Access denied').should('not.exist')
        } else {
          cy.contains('Access denied')
        }
      })
    }
  })
}
