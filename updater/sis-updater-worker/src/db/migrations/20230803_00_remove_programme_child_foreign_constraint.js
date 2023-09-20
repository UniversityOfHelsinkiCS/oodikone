module.exports = {
  up: async queryInterface => {
    await queryInterface.removeConstraint('programme_module_children', 'programme_module_children_child_id_fkey')
  },
  down: async queryInterface => {
    await queryInterface.addConstraint('programme_module_children', 'programme_module_children_child_id_fkey')
  },
}
