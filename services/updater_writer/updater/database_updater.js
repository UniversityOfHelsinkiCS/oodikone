const { sequelize } = require('../database/connection')

const { Student } = require('../models/index')


const updateStudent = async (student) => {
  const { studentInfo } = student
  return sequelize.transaction(t => {

    return Student.upsert({
      ...studentInfo
    }, { transaction: t })

      // .then(user => {
      //   return user.setShooter({
      //     firstName: 'John',
      //     lastName: 'Boothe'
      //   }, {transaction: t});
      // });

      .then(result => {
        return result
      }).catch(err => {
        console.log(err)
      })
  })
}

module.exports = {
  updateStudent
}