const Sequelize = require('sequelize')
const { User, Unit, UserUnit } = require('../models')

const Op = Sequelize.Op

const byUsername = (username) => {
  return User.findOne({
    where: {
      username: {
        [Op.eq]: username
      }
    }
  })
}

const byId = (id) => {
  return User.findOne({
    where: {
      id: {
        [Op.eq]: id
      }
    },
    include: [Unit]
  })
}

async function withUsername(username) {
  const user = await byUsername(username)

  if (user) {
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
  return Unit.findAll({
    include: [{
      model: User,
      through: {
        where: {
          user_id:
            {
              [Op.eq]: id
            }
        }
      },
      where: {
        id:
          {
            [Op.eq]: id
          }
      }
    }]
  })
}

const findAll = () => {
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
  withUsername,
  createUser,
  updateUser,
  findAll,
  deleteUnit,
  addUnit,
  getUnits,
  byId
}