const Sequelize = require('sequelize')
const { User, Unit, UserUnit } = require('../models')

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
    include: [Unit]
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

const findAll = async () => {
  return User.findAll({ include: [Unit] })
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
  byId
}