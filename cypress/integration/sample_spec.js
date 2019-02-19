describe('My First Test', function() {
  it('Does not do much!', function() {
    cy.visit("localhost:8081")
    cy.contains("Population statistics").click()
    cy.url().should('include', '/populations')
  })
})