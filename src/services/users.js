const Sequelize = require('sequelize')
const { User, ElementDetails } = require('../models')
const UnitService = require('./units')

const Op = Sequelize.Op

const byUsername = async (username) => {
  return User.findOne({
    where: {
      username: {
        [Op.eq]: username
      }
    }
  })
}

const byId = async (id) => {
  return User.findOne({
    where: {
      id: {
        [Op.eq]: id
      }
    },
    include: [{ 
      model: ElementDetails,
      as: 'elementdetails'
    }]
  })
}

const createUser = async (username, fullname) => {
  return User.create({
    username: username,
    full_name: fullname,
    is_enabled: false
  })
}

const updateUser = async (userObject, values) => {
  return userObject.update(values)
}

const getUnitsFromElementDetails = async username => {
  const user = await byUsername(username)
  const elementDetails = await user.getElementdetails()
  return elementDetails.map(element => UnitService.parseUnitFromElement(element))
}

const findAll = async () => {
  return User.findAll({ 
    include: [{ 
      model: ElementDetails,
      as: 'elementdetails'
    }] 
  })
}

module.exports = {
  byUsername,
  createUser,
  updateUser,
  findAll,
  byId,
  getUnitsFromElementDetails
}