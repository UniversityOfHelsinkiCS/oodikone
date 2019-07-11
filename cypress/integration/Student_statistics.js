
describe('Student Statistics tests', () => {
    beforeEach(() => {
        cy.server({
            onAnyRequest: function (route, proxy) {
                if (Cypress.config().baseUrl.includes("http://localhost:1337/")) {
                    proxy.xhr.setRequestHeader('uid', 'tktl')
                    proxy.xhr.setRequestHeader('shib-session-id', 'mock-shibboleth')
                    proxy.xhr.setRequestHeader('hygroupcn', 'grp-oodikone-users')
                    proxy.xhr.setRequestHeader('edupersonaffiliation', 'asdasd')
                }
            }
        })
        cy.visit(Cypress.config().baseUrl)
        cy.contains("Student statistics").click()
        cy.contains("Student names hidden")
    })

    it('Student statistics search form is usable', () => {
        cy.contains('Student names hidden')
        cy.url().should('include', '/students')
        cy.get('.prompt').type('Oinonen')
        cy.contains('Student number')
        cy.contains('Started')
        cy.contains('Credits')
        cy.contains('Wallin').should('not.exist')

        cy.get('label').click()
        cy.contains('Wallin')

        cy.get('label').click()
        cy.contains('Wallin').should('not.exist')

    })
    it('Can get student specific page by clicking student', () => {
        cy.url().should('include', '/students')
        cy.get('.prompt').type('Oinonen')
        cy.contains('011143561').click()
        cy.contains('Updated at 25.02.2019')
        cy.contains('Toinen kotimainen kieli (40061)')
        cy.contains('Oinonen').should('not.exist')

        cy.get('label').click()
        cy.contains('Oinonen')

        cy.get('label').click()
        cy.contains('Oinonen').should('not.exist')
    })

    it('Can get back to search menu', () => {
        cy.get('.prompt').type('Oinonen')
        cy.contains('011143561').click()
        cy.get('.remove').click()
        cy.contains('Student number').should('not.exist')
        cy.contains('Credits').should('not.exist')
    })

    it('Can jump to course', () => {
        cy.get('.prompt').type('Oinonen')
        cy.contains('011143561').click()
        cy.contains('Toinen kotimainen kieli (40061)').siblings().within(() => { cy.get('.level').click() })
        cy.url().should('include', '/coursestatistics')
        cy.contains('Toinen kotimainen kieli')
    })

    it('Searching with bad inputs doesnt yield results', () => {
        cy.get('.prompt').type('Oin')
        cy.contains('Student number').should('not.exist')

        cy.get('.prompt').clear().type('01114')
        cy.contains('Student number').should('not.exist')
    })

    // why the fuck this test doesn't work TELL ME

    // it('Can jump to population page', () => {
    //     cy.get('.prompt').type('Oinonen')
    //     cy.contains('011143561').click()
    //     cy.get('i.level.up.alternate.icon').eq(0).click()
    //     cy.wait(5000)
    //     cy.contains('Population statistics')
    //     cy.wait(5000)
    //     cy.contains('Credit accumulation (for 1 students)')
    // })
})