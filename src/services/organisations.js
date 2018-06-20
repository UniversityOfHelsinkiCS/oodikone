const Sequelize = require('sequelize')
const { Organisation } = require('../models')
const Op = Sequelize.Op

const apiDataToModel = data => ({
  code: data.code,
  name: data.name[0].text
})

const createOrganisation = data => {
  const organisation = apiDataToModel(data)
  return Organisation.create(organisation)
}

const byCode = (code) => {
  return Organisation.findOne({
    where: {
      code: {
        [Op.eq]: code
      }
    },
  })
}

const all = () => {
  return Organisation.findAll()
}

module.exports = {
  createOrganisation, byCode, all
}