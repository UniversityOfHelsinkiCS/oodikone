const Sequelize = require('sequelize')
const { Unit, ElementDetails, StudyrightElement } = require('../models')
const Op = Sequelize.Op

const all = () => Unit.findAll()

const findAllEnabled = () => Unit.findAll({
  where: {
    enabled: {
      [Op.eq]: true
    }
  }
})

const byId = (id) => Unit.findById(id)

const hasStudent = async (code, studentnumber) => StudyrightElement.findOne({
  where: {
    studentnumber,
    code
  }
})

const findByName = name => Unit.findOne({
  where: { name }
})

const createUnit = data => {
  return Unit.create(data)
}

const parseUnitFromElement = element => ({
  id: element.code,
  name: element.name.fi,
  enabled: true,
  type: element.type
})

const getUnitsFromElementDetails = async () => {
  const elementdetails = await ElementDetails.findAll({ where: { 
    type: {
      [Op.or]: ['10', '20']
    }
  }})
  return elementdetails.map(parseUnitFromElement)
}

const getUnitFromElementDetail = async id => {
  const element = await ElementDetails.findByPrimary(id)
  return parseUnitFromElement(element)
}

module.exports = {
  all, byId, findAllEnabled, hasStudent, createUnit, findByName, getUnitsFromElementDetails, getUnitFromElementDetail, parseUnitFromElement
}