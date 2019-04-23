const { Affiliation } = require('../models/index')
const { Op } = require('sequelize')

const byId = id =>  Affiliation.findByPk(id)

const findAll = () => Affiliation.findAll()

const byCodes = codes => Affiliation.findAll({
  where: {
    code: {
      [Op.in]: codes
    }
  }
})

const create = code => Affiliation.create({ code })

const addGroups = async (uid, codes) => {
  const user = await byId(uid)
  const groups = await byCodes(codes)
  await user.addAffiliations(groups)
}
module.exports = { byId, byCodes, findAll, create, addGroups }