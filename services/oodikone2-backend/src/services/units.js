const Sequelize = require('sequelize')
const { ElementDetails, StudyrightElement } = require('../models')
const Op = Sequelize.Op

const hasStudent = async (code, studentnumber) => StudyrightElement.findOne({
  where: {
    studentnumber,
    code
  }
})

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
  const element = await ElementDetails.findByPk(id)
  return parseUnitFromElement(element)
}

module.exports = {
  hasStudent, getUnitsFromElementDetails, getUnitFromElementDetail, parseUnitFromElement
}