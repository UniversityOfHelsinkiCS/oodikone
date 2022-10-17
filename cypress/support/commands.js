/// <reference types="Cypress" />
//
// Note: here we need to set keys to be all lowercase, since
// we're replacing headers after they've left browser / frontend.
// All of these users are available in anon user-db
const adminUserHeaders = {
  uid: 'admin',
  displayname: 'Admin User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-users;grp-oodikone-basic-users;grp-toska',
  edupersonaffiliation: 'member;employee;faculty',
  mail: 'grp-toska+mockadminuser@helsinki.fi',
  hypersonsisuid: 'hy-hlo-6666666',
}

const basicUserHeaders = {
  uid: 'basic',
  displayname: 'Basic User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-users;grp-oodikone-basic-users',
  edupersonaffiliation: 'member',
  mail: 'grp-toska+mockbasicuser@helsinki.fi',
  hypersonsisuid: 'hy-hlo-1234567',
}

const onlycoursestatisticsUserHeaders = {
  uid: 'onlycoursestatistics',
  displayName: 'Onlycoursestatistics User',
  'shib-session-id': 'mock-session',
  hyGroupCn: 'grp-oodikone-basic-users',
  eduPersonAffiliation: 'member',
  mail: 'grp-toska+mockonlycoursestatisticsuser@helsinki.fi',
  hypersonsisuid: 'hy-hlo-7654321',
}

const norightsUserHeaders = {
  uid: 'norights',
  displayname: 'Norights User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-users',
  edupersonaffiliation: 'member',
  mail: 'grp-toska+mocknorightuser@helsinki.fi',
  hypersonsisuid: 'hy-hlo-0000000',
}

const onlyIamRightsUserHeaders = {
  uid: 'onlyiamrights',
  displayname: 'Only IAM rights user',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'hy-employees;hy-mltdk-tkt-jory',
  edupersonaffiliation: 'member',
  mail: 'grp-toska+mockonlyiamrightsuser@helsinki.fi',
  hypersonsisuid: 'hy-hlo-1111111',
}

const userHeaders = [
  adminUserHeaders,
  basicUserHeaders,
  onlycoursestatisticsUserHeaders,
  norightsUserHeaders,
  onlyIamRightsUserHeaders,
]

/**
 Set up headers to login, set up correct user (admin / basic / etc.) and open given path.
 */
Cypress.Commands.add('init', (path = '', userId = 'basic') => {
  cy.intercept('', req => {
    const headersToUse = userHeaders.find(({ uid }) => uid === userId)
    if (!headersToUse) throw Error(`${userId} is not valid user id!`)
    req.headers = headersToUse
  })
  const baseUrl = Cypress.config().baseUrl
  cy.visit(baseUrl.concat(path))
})

/**
 * Shorthand for using "Cypress Selectors" (CS), i.e., `data-cy` attributes.
 */
Cypress.Commands.add('cs', { prevSubject: 'optional' }, (subject, name) => {
  const selector = `[data-cy="${name}"]`

  if (subject === undefined) {
    return cy.get(selector)
  } else {
    return cy.wrap(subject).find(selector)
  }
})

/**
 * Select item specified by `index` number from a semantic-ui dropdown with
 * `data-cy` attribute value `name`.
 */
Cypress.Commands.add('selectFromDropdown', { prevSubject: true }, (s, index) => {
  const subject = cy.wrap(s)
  const indexes = Array.isArray(index) ? index : [index]

  indexes.forEach(i => {
    subject.click()

    if (typeof i === 'number') {
      subject.children('.menu').children().eq(i).click({ force: true })
    } else {
      subject.children('.menu').containing(i).eq(0).click({ force: true })
    }
  })

  // Close multiple selection so it does not block elements underneath it.
  if (Array.isArray(index)) {
    cy.wrap(s).children('.icon').click({ force: true })
  }
})

/**
 * Move to page with studyProgramme population
 */
Cypress.Commands.add('selectStudyProgramme', name => {
  cy.cs('navbar-studyProgramme').click()
  cy.cs('navbar-class').click()
  cy.cs('select-study-programme').click().children().contains(name).click()
  cy.contains('See class').click()
})

Cypress.Commands.add('checkTableStats', (correctStats, tableName) => {
  cy.get(`[data-cy=Table-${tableName}]>tbody`).within(() => {
    correctStats.forEach((values, trIndex) => {
      cy.get('tr')
        .eq(trIndex)
        .within(() => {
          values.forEach((value, tdIndex) => {
            cy.get('td').eq(tdIndex).contains(value)
          })
        })
    })
    cy.get('tr').should('have.length', correctStats.length)
  })
})
