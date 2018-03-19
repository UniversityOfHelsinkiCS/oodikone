module.exports = {
  up: async (queryInterface) => {

    // Bachelor's Programme is with like because SQL doesn't like escaping '.
    // Also whitespace
    // eslint-disable-next-line
    return queryInterface.sequelize.query(`UPDATE unit SET enabled=true WHERE
    name like 'Bachelor of Science, Bachelor_s Programme in Computer Science' OR
    name like 'Bachelor of Science, Bachelor_s Programme in Mathematical Sciences' OR
    name like 'Bachelor of Science, Teacher in Mathematics' OR
    name like 'Bachelor of Science, Bachelor_s Programme for Teachers of Mathematics, Physics and Chemistry' OR
    name like 'Master of Science   (science), Master_s Programme in Computer Science' OR
    name like 'Master of Science   (science), Teacher in Mathematics' OR
    name like 'Master of Science   (science), Mathematics'
    `)
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.query(`UPDATE unit SET enabled=false WHERE
    name like 'Bachelor of Science, Bachelor_s Programme in Computer Science' OR
    name like 'Bachelor of Science, Bachelor_s Programme in Mathematical Sciences' OR
    name like 'Bachelor of Science, Teacher in Mathematics' OR
    name like 'Bachelor of Science, Bachelor_s Programme for Teachers of Mathematics, Physics and Chemistry' OR
    name like 'Master of Science   (science), Master_s Programme in Computer Science' OR
    name like 'Master of Science   (science), Teacher in Mathematics' OR
    name like 'Master of Science   (science), Mathematics'
    `)
  }
}