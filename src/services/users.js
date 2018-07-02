const Sequelize = require('sequelize')
const { User, Unit, UserUnit, ElementDetails } = require('../models')
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

const getUnits = async (id) => {
  return Unit.findAll({
    include: [{
      model: User,
      through: {
        where: {
          user_id: {
            [Op.eq]: id
          }
        }
      },
      where: {
        id: {
          [Op.eq]: id
        }
      }
    }],
    where: {
      enabled: {
        [Op.eq]: true
      }
    }
  })
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

const deleteUnit = async (userId, unitId) => {
  await UserUnit.destroy(
    {
      where: {
        user_id:
          {
            [Op.eq]: userId
          },
        unit_id:
          {
            [Op.eq]: unitId
          }
      }
    }
  )
}

const addUnit = async (userId, unitId) => {
  await UserUnit.create(
    {
      user_id: userId,
      unit_id: unitId
    }
  )
}

module.exports = {
  byUsername,
  createUser,
  updateUser,
  findAll,
  deleteUnit,
  addUnit,
  getUnits,
  byId,
  getUnitsFromElementDetails
}