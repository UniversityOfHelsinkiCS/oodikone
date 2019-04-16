const { HyGroup } = require('../models/index')
const { Op } = require('sequelize')

const byId = id =>  HyGroup.findById(id)

const findAll = () => HyGroup.findAll()

const byCodes = codes => HyGroup.findAll({
  where: {
    code: {
      [Op.in]: codes
    }
  }
})

const create = code => HyGroup.create({ code })

const addGroups = async (uid, codes) => {
  const user = await byId(uid)
  const groups = await byCodes(codes)
  await user.addHygroups(groups)
}
module.exports = { byId, byCodes, findAll, create, addGroups }