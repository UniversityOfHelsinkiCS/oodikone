/// <reference types="Cypress" />

Cypress.Commands.add("init", (path = '') => {
  cy.server({
    onAnyRequest: function (route, proxy) {
      if (Cypress.config().baseUrl.includes("http://nginx/")) {
        proxy.xhr.setRequestHeader('uid', 'tktl')
        proxy.xhr.setRequestHeader('shib-session-id', 'mock-shibboleth')
        proxy.xhr.setRequestHeader('hygroupcn', 'grp-oodikone-users')
        proxy.xhr.setRequestHeader('edupersonaffiliation', 'asdasd')
      }
    }
  })
  cy.visit(Cypress.config().baseUrl.concat(path))
})
