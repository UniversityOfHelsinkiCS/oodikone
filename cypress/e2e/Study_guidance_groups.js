/// <reference types="Cypress" />

describe('Study guidance group tests', () => {
  describe('Study guidance group overview page', () => {
    describe('without study guidance groups', () => {
      it('shows the correct notification', () => {
        cy.init('/studyguidancegroups', 'admin')
        cy.contains('Study guidance groups')
        cy.contains('You do not have access to any study guidance groups.')
      })
    })

    describe('without correct rights', () => {
      it('shows the correct notification', () => {
        cy.init('/studyguidancegroups')
        cy.contains('Access denied')
        cy.contains(
          "You're currently not allowed to see this page. Please contant oodikone@helsinki.fi, if this is a mistake."
        )
      })
    })

    describe('with study guidance groups', () => {
      beforeEach(() => {
        cy.init('/studyguidancegroups', 'onlystudyguidancegroups')
        cy.intercept('/api/studyguidancegroups', { fixture: 'studyGuidanceGroups.json' })
      })

      it('shows the correct data', () => {
        cy.contains('Study guidance groups')

        const studyGuidanceGroupsTableContent = [
          ['TKT kandit 2018', 3, 'Tietojenkäsittelytieteen kandiohjelma', '2018 - 2019'],
          ['Oma ohjausryhmä', 2, 'Add study programme', 'Add year'],
        ]

        cy.checkTableStats(studyGuidanceGroupsTableContent, 'study-guidance-group-overview')
      })

      it('has working links to single study guidance groups', () => {
        cy.cs('study-guidance-group-link-sgg-cypress-1').click()
        cy.url().should('eq', `${Cypress.config().baseUrl}/studyguidancegroups/sgg-cypress-1`)
      })
    })
  })

  describe('Page for single study guidance group', () => {
    beforeEach(() => {
      cy.intercept('/api/studyguidancegroups', { fixture: 'studyGuidanceGroups.json' })
    })

    it('has a working back button', () => {
      cy.init('/studyguidancegroups/sgg-cypress-1', 'onlystudyguidancegroups')

      cy.get('button.ui.button').contains('Back').click()
      cy.url().should('eq', `${Cypress.config().baseUrl}/studyguidancegroups`)
    })

    describe('without associated study programme and year', () => {
      beforeEach(() => {
        cy.init('/studyguidancegroups/sgg-cypress-2', 'onlystudyguidancegroups')
      })

      it('shows the correct panes', () => {
        cy.contains('Oma ohjausryhmä')
        cy.cs('Credit accumulation (for 2 students)')
        cy.cs('Age distribution')
        cy.cs('Courses of population')
        cy.cs('Students (2)')
        cy.cs('Credit statistics').should('not.exist')
      })

      it('students table has the correct tabs', () => {
        cy.cs('Students (2)').click()
        cy.get('[data-cy="student-table-tabs"] .ui.attached.tabular.menu').then($menu => {
          const tabNames = Array.from($menu[0].children).map(elem => elem.innerText)
          expect(tabNames).to.deep.equal(['General'])
        })
      })

      it('general tab of the students table has the correct columns', () => {
        const firstRowHeadings = [
          'Phone number',
          'Student number',
          'Credits',
          'Start year at uni',
          'Study programmes',
          'Tags',
        ]
        const secondRowHeadings = ['All', 'Since 1.1.1970']
        cy.cs('Students (2)').click()
        cy.get('[data-cy="student-table-tabs"] table thead tr').then($tr => {
          const firstRowTexts = Array.from($tr[0].children).map(elem => elem.innerText.replace('\n', ' '))
          expect(firstRowTexts).to.deep.equal(firstRowHeadings)
          const secondRowTexts = Array.from($tr[1].children).map(elem => elem.innerText)
          expect(secondRowTexts).to.deep.equal(secondRowHeadings)
        })
      })
    })

    describe('with associated study programme and year', () => {
      beforeEach(() => {
        cy.init('/studyguidancegroups/sgg-cypress-1', 'onlystudyguidancegroups')
      })

      it('shows the correct labels', () => {
        cy.get('.ui.medium.header').contains('TKT kandit 2018')
        cy.get('.ui.blue.tag.label:first').contains('Tietojenkäsittelytieteen kandiohjelma')
        cy.get('.ui.blue.tag.label:last').contains('2018 - 2019')
      })

      it('shows the correct panes', () => {
        cy.cs('Credit accumulation (for 3 students)')
        cy.cs('Credit statistics')
        cy.cs('Age distribution')
        cy.cs('Courses of population')
        cy.cs('Students (3)')
      })

      it("clicking the 'Show starting from associated year' button activates the 'Date of Course Credits' filter", () => {
        cy.get('[data-cy="CreditDate-filter-card"][data-open="false"]')
        cy.get('.ui.primary.button').contains('Show starting from associated year').click()
        cy.get('[data-cy="CreditDate-filter-card"][data-open="true"]')
        cy.get('.ui.mini.icon.button.credit-date-filter-input').contains('01.08.2018')
        cy.contains('Reset All Filters')
        cy.get('.ui.primary.button').contains('Show all credits').click()
        cy.get('[data-cy="CreditDate-filter-card"][data-open="false"]')
      })

      it('students table has the correct tabs', () => {
        cy.cs('Students (3)').click()
        cy.get('[data-cy="student-table-tabs"] .ui.attached.tabular.menu').then($menu => {
          const tabNames = Array.from($menu[0].children).map(elem => elem.innerText)
          expect(tabNames).to.deep.equal(['General', 'Courses', 'Progress'])
        })
      })

      it('general tab of the students table has the correct columns', () => {
        const firstRowHeadings = [
          'Phone number',
          'Student number',
          'Credits',
          'Start of studyright',
          'Started in programme',
          'Semesters present',
          'Graduation date',
          'Start year at uni',
          'Other programmes',
          'Semesters present amount',
          'Transferred from',
          'Citizenship',
          'Latest attainment date',
          'Curriculum version',
          'Tags',
        ]
        const secondRowHeadings = ['All', 'HOPS', 'Since 1.8.2018']
        cy.cs('Students (3)').click()
        cy.get('[data-cy="student-table-tabs"] table thead tr').then($tr => {
          const firstRowTexts = Array.from($tr[0].children).map(elem => elem.innerText.replace('\n', ' '))
          expect(firstRowTexts).to.deep.equal(firstRowHeadings)
          const secondRowTexts = Array.from($tr[1].children).map(elem => elem.innerText)
          expect(secondRowTexts).to.deep.equal(secondRowHeadings)
        })
      })
    })
  })
})
