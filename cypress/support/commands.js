/// <reference types="cypress" />
//
// ! IMPORTANT: here we need to set keys to be all lowercase, since
// ! we're replacing headers after they've left browser / frontend.
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

// TODO add user into anon-DB (check the need for changing hypersonid)
// REMEMBER TO ADD ROLE openUniSearch
// const openUniUser = {
//   uid: 'openuniuser',
//   displayname: 'Open Uni User',
//   'shib-session-id': 'mock-cypress-session',
//   hygroupcn: 'grp-oodikone-basics-users;hy-ypa-opa-dojo',
//   mail: 'grp-toska+mockopenuniuser@helsinki.fi',
//   hypersonsisuid: 'hy-hlo-9999999',
// }

const userHeaders = [
  adminUserHeaders,
  basicUserHeaders,
  onlycoursestatisticsUserHeaders,
  norightsUserHeaders,
  onlyIamRightsUserHeaders,
  onlyStudyGuidanceGroupsUser,
]

/**
 * Set up headers to login, set up correct user (admin / basic / etc.) and open given path.
 */
Cypress.Commands.add('init', { prevSubject: false }, (path, userId = 'basic') => {
  const headersToUse = userHeaders.find(({ uid }) => uid === userId)
  if (!headersToUse) throw Error(`${userId} is not valid user id!`)

  cy.intercept({ hostname: 'localhost', url: '**', method: '*' }, req => {
    req.headers = headersToUse
  })

  const { baseUrl } = Cypress.config()
  const url = baseUrl.concat(path)

  // TODO: Add wait for visit url.
  //       This is block by course population query.
  cy.visit(url)
})

/**
 * Shorthand for using "Cypress Selectors" (CS), i.e., `data-cy` attributes.
 */
Cypress.Commands.add('cs', { prevSubject: 'optional' }, (subject, name) => {
  const selector = `[data-cy="${name}"]`

  if (subject === undefined) {
    return cy.get(selector)
  }
  return cy.wrap(subject).find(selector)
})

/**
 * Select item from FilterSelect dropdown.
 * If the index is a number, select index-th item.
 * Otherwise select the item containing index text.
 */
Cypress.Commands.add('selectFromDropdown', { prevSubject: false }, (label, index, isMultiSelect = false) => {
  cy.cs(`${label}-selector`).click()

  cy.get(`[role="listbox"][aria-labelledby="${label}"]`).within(() => {
    if (typeof index === 'number') cy.get('li').eq(index).click()
    else cy.get('li').contains(index).click()
  })

  if (isMultiSelect) cy.get('#menu- > .MuiModal-backdrop').click()
})

/**
 * Set range selector values FilterRange.
 * If the reset flag is set, the function tries to reset the original values.
 */
Cypress.Commands.add('setRangeSelect', { prevSubject: false }, (filter, min, max, expected, reset) => {
  const minText = min.toString()
  const maxText = max.toString()
  const expectedText = expected.toString()

  const parent = `${filter}-filter-card`

  cy.cs(parent)
    .cs('FilterRangeStart')
    .find('input')
    .invoke('val')
    .then(initialMin => {
      cy.cs(parent)
        .cs('FilterRangeEnd')
        .find('input')
        .invoke('val')
        .then(initialMax => {
          cy.cs(parent).cs('FilterRangeStart').find('input').clear()
          cy.cs(parent).cs('FilterRangeStart').find('input').type(minText)
          cy.cs(parent).cs('FilterRangeEnd').find('input').clear()
          cy.cs(parent).cs('FilterRangeEnd').find('input').type(maxText)

          // This should be linked to other checking functions.
          // Maybe one day.
          cy.contains(`Students (${expectedText})`)

          if (reset) {
            cy.cs(parent).cs('FilterRangeStart').find('input').clear()
            cy.cs(parent).cs('FilterRangeStart').find('input').type(initialMin)
            cy.cs(parent).cs('FilterRangeEnd').find('input').clear()
            cy.cs(parent).cs('FilterRangeEnd').find('input')?.type(initialMax)
          }
        })
    })
})

Cypress.Commands.add('checkTableStats', (correctStats, tableName) => {
  cy.get(`[data-cy=${tableName}-data-table] tbody`).within(() => {
    correctStats.forEach((values, trIndex) => {
      cy.get('tr')
        .filter(':visible')
        .eq(trIndex)
        .within(() => {
          values.forEach((value, tdIndex) => {
            cy.get('td').eq(tdIndex).contains(value)
          })
        })
    })
    cy.get('tr').filter(':visible').should('have.length', correctStats.length)
  })
})

const getEmptyYears = isAcademicYear => {
  const today = new Date()
  const latestYear = isAcademicYear && today.getMonth() < 7 ? today.getFullYear() - 1 : today.getFullYear()

  const years = []
  for (let year = latestYear; year >= 2024; year--) {
    if (isAcademicYear) {
      years.push(`${year} - ${year + 1}`)
    } else {
      years.push(year)
    }
  }
  return years
}

module.exports = {
  getEmptyYears,
}
