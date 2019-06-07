const Sequelize = require('sequelize')
const _ = require('lodash')
const { MandatoryCourseLabels } = require('../models')
const { Op } = Sequelize
const {
  sequelize
} = require('../models/index')

const create = async (studyprogramme_id, { label }) => {
  const labels = await labelsByStudyprogramme(studyprogramme_id)
  await MandatoryCourseLabels.create({ studyprogramme_id, label, orderNumber: labels.length+1 })
}

const destroy = (studyprogramme_id, { id }) => {
  return MandatoryCourseLabels.destroy({ where: { studyprogramme_id, id } })
}

const move = async (studyprogramme_id, { id }, direction) => {
  const labels = await labelsByStudyprogramme(studyprogramme_id).map(e => e.get())
  const orderedlabels = _.sortBy(labels, ['orderNumber'])
  const indexToMove = orderedlabels.findIndex(e => e.id === id)
  const indexToSwap = direction === 'up' ? indexToMove-1 : indexToMove+1
  if (indexToSwap < 0 || indexToSwap >= orderedlabels.length) return null;
  [orderedlabels[indexToMove], orderedlabels[indexToSwap]] = [orderedlabels[indexToSwap], orderedlabels[indexToMove]]
  const newOrder = orderedlabels.map((e, index) => ({ ...e, orderNumber: index }))
  await sequelize.transaction(async transaction => {
    for (let e of newOrder) {
      await MandatoryCourseLabels.update(
        {orderNumber: e.orderNumber}, { where: { studyprogramme_id, id: e.id }, transaction }
      )
    }
  })
}

const find = (studyprogramme_id, { id }) => {
  return MandatoryCourseLabels.findOne({
    attributes: ['id', 'label', 'orderNumber'],
    where: {
      studyprogramme_id: {
        [Op.eq]: studyprogramme_id,
      },
      id: {
        [Op.eq]: id,
      }
    }
  })
}

const labelsByStudyprogramme = (studyProgrammeId) => {
  return MandatoryCourseLabels.findAll({
    attributes: ['id', 'label', 'orderNumber'],
    where: {
      studyprogramme_id: {
        [Op.eq]: studyProgrammeId
      }
    }
  })
}

module.exports = {
  labelsByStudyprogramme,
  create,
  destroy,
  move,
  find
}