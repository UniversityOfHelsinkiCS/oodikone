const Sequelize = require('sequelize')
const { User } = require('../models')

const Op = Sequelize.Op

const byUsername = (username) => {
  return User.findOne({
    where: { 
      username:{
        [Op.eq]: username
      } 
    }
  })
}

async function withUsername(username) {
  const user = await byUsername(username)

  if ( user ) {
    return user.password
  } else {  
    return null
  } 
}

const createUser = (username, fullname) => {
  return User.create({
    username,
    fullname,
    createdDate: new Date(),
  })
}

const updateUser = (userObject, values) => {
  return userObject.update(values)
}

module.exports = {
  byUsername,
  withUsername,
  createUser,
  updateUser
}