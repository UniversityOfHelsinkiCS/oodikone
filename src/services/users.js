const Sequelize = require('sequelize')
const { User, Unit } = require('../models')

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

const byId = (id) => {
  return User.findOne({
    where: { 
      id:{
        [Op.eq]: id
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
    username: username,
    full_name: fullname,
    is_enabled: false
  })
}

const updateUser = (userObject, values) => {
  return userObject.update(values)
}

const getUnits = async (id) => {
  return await Unit.findAll({
    include: [{
      model: User,
      through:{
        where: {user_id: id}
      }
    }]
  })
} 

const findAll = () => {
  return User.findAll()
}

module.exports = {
  byUsername,
  withUsername,
  createUser,
  updateUser,
  findAll,
  getUnits,
  byId
}