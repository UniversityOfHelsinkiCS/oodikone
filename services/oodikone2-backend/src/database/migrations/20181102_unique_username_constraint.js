module.exports = {
  up: async (queryInterface) => {
    return queryInterface.addConstraint('users', ['username'], {
      type: 'unique'
    })
  },
  down: () => {
  }
}