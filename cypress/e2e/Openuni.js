/// <reference types="Cypress" />

const deleteAllSearches = () => {
  cy.contains('Saved populations')
    .parent()
    .parent()
    .parent()
    .parent()
    .get('.dropdown')
    .then(d => {
      const searchItems = d.find('div[role=option] > span[class=text]')
      for (let i = 0; i < searchItems.length; i++) {
        if (searchItems[i].textContent.includes('TEST-')) {
          cy.get('[data-cy="history-search"]').children().eq(0).type(searchItems[i].textContent).type('{enter}')
          cy.get('button').contains('Delete').click()
        }
      }
    })
}

describe('Open uni population tests', () => {
  describe('Open uni form can be used', () => {
    // When openUniUser is created, change it here
    beforeEach(() => {
      cy.init('/openunipopulation', 'admin')
    })
    after(() => {
      cy.init('/openunipopulation', 'admin')
      cy.url().should('include', '/openunipopulation')
      cy.contains('Open uni student population')
      cy.get('[data-cy="open-uni-search-button"]').click()
      deleteAllSearches()
    })

    it('Finds a proper population', () => {
      cy.fixture('openUniPopulation').then(({ courseCodesSet1 }) => {
        cy.get('[data-cy="open-uni-search-button"]').click()
        cy.contains('Insert course code(s)').siblings().get('textarea').type(courseCodesSet1.join('\n'))
        cy.get('[data-cy="begin-of-search"]').clear().type('01.01.2015')
        cy.get('[data-cy="end-of-search"]').clear().type('01.01.2020')
        cy.get('button').contains('Search population').click()
        cy.contains('Beginning of the search for all fields:')
        cy.contains('01.01.2015')
        cy.contains('End of the search for enrollments:')
        cy.contains('01.01.2020')
        cy.url().should(
          'include',
          '/openunipopulation?courseCode=TKT10001&courseCode=TKT10002&enddate=01-01-2020&startdate=01-01-2015'
        )
        cy.get('[data-cy="open-uni-table-div"]').should('contain.text', courseCodesSet1[0])
        cy.get('[data-cy="open-uni-table-div"]').should('contain.text', courseCodesSet1[1])
      })
    })

    it('Textarea can handle different kinds of input', () => {
      cy.get('[data-cy="open-uni-search-button"]').click()
      cy.contains('Insert course code(s)')
        .siblings()
        .get('textarea')
        .type('tkt10001    tkt10002,tkt10003\n TKT10004,,TKt10005\nTKT-1234')
      cy.get('button').contains('Search population').click()
      cy.get('[data-cy="open-uni-table-div"]').should('contain.text', 'TKT10001')
      cy.get('[data-cy="open-uni-table-div"]').should('contain.text', 'TKT10002')
      cy.get('[data-cy="open-uni-table-div"]').should('contain.text', 'TKT10003')
      cy.get('[data-cy="open-uni-table-div"]').should('contain.text', 'TKT10004')
      cy.get('[data-cy="open-uni-table-div"]').should('contain.text', 'TKT10005')
      cy.get('[data-cy="open-uni-table-div"]').should('not.contain', 'TKT-1234')
    })

    it('Saves a custom population search', () => {
      cy.fixture('openUniPopulation').then(({ courseCodesSet1 }) => {
        cy.get('[data-cy="open-uni-search-button"]').click()
        cy.get('[data-cy="search-name"]').type('TEST-Avoimen-populaatio')
        cy.contains('Insert course code(s)').siblings().get('textarea').type(courseCodesSet1.join('\n'))
        cy.get('[data-cy="save-search"]').click()
        cy.get('[data-cy="history-search"]').children().eq(0).type('TEST-Avoimen-populaatio').type('{enter}')
        cy.contains('TEST-Avoimen-populaatio')
        cy.get('button').contains('Search population').click()
        cy.get('[data-cy="open-uni-table-div"]').should('contain.text', courseCodesSet1[0])
        cy.get('[data-cy="open-uni-table-div"]').should('contain.text', courseCodesSet1[1])
      })
    })

    it('Updates a custom population search', () => {
      cy.fixture('openUniPopulation').then(({ courseCodesSet1, courseCodesSet2 }) => {
        cy.get('[data-cy="open-uni-search-button"]').click()
        cy.get('[data-cy="search-name"]').type('TEST-Avoimen-populaatio')
        cy.contains('Insert course code(s)').siblings().get('textarea').type(courseCodesSet1.join('\n'))
        cy.get('[data-cy="save-search"]').click()
        cy.get('button').contains('Search population').click()
        cy.get('[data-cy="open-uni-table-div"]').should('contain.text', courseCodesSet1[0])
        cy.get('[data-cy="open-uni-table-div"]').should('contain.text', courseCodesSet1[1])

        cy.get('[data-cy="open-uni-search-button"]').click()
        cy.get('[data-cy="history-search"]').children().eq(0).type('TEST-Avoimen-populaatio').type('{enter}')
        cy.contains('Insert course code(s)').siblings().get('textarea').should('contain', courseCodesSet1.join(', '))
        cy.contains('Insert course code(s)').siblings().get('textarea').type('\n')
        cy.contains('Insert course code(s)').siblings().get('textarea').type(courseCodesSet2.join('\n'))
        cy.get('[data-cy="save-search"]').click()
        cy.get('button').contains('Search population').click()
        cy.get('[data-cy="open-uni-table-div"]').should('contain.text', courseCodesSet1[0])
        cy.get('[data-cy="open-uni-table-div"]').should('contain.text', courseCodesSet1[1])
        cy.get('[data-cy="open-uni-table-div"]').should('contain.text', courseCodesSet2[0])
        cy.get('[data-cy="open-uni-table-div"]').should('contain.text', courseCodesSet2[1])
        cy.get('[data-cy="open-uni-table-div"]').should('contain.text', courseCodesSet2[2])
      })
    })

    it('View does not crash with non-existing courses', () => {
      cy.get('[data-cy="open-uni-search-button"]').click()
      cy.contains('Insert course code(s)').siblings().get('textarea').type('cypress-fun')
      cy.get('button').contains('Search population').click()
      cy.get('[data-cy="open-uni-table-div"]').should('not.contain', 'cypress-fun')
    })
  })
})
