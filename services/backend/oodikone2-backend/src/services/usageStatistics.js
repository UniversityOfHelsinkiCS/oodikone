const _ = require('lodash')
const moment = require('moment')
const { UsageStatistic } = require('../models/models_kone')
const Sequelize = require('sequelize')
const { Op } = Sequelize

const wildcarded = url => {
  if (url.includes('/units/') && url.includes('/users/')) {
    const zeroedUrl = url.replace(/\d/g, '0')
    const end = zeroedUrl.lastIndexOf('/')

    return `${zeroedUrl.substr(0, end)}/00000`
  }

  if (url.includes('/students/') || url.includes('/teachers/') || url.includes('/users/')) {
    return url.replace(/\d/g, '0')
  }

  return url
}

const formatForGroup = url => {
  const query = url.indexOf('?')

  if (query!==-1) {
    return url.substr(0, query)
  }

  return wildcarded(url)
}

const stripExtraFields = ({ id, username, name, time, admin, method, URL }) =>
  ({ id, username, name, time, admin, method, URL })

const withoutRequestsByAdmins = results => results.filter(u => !u.admin)

const byDate = (results) => {
  const getDateForRequest = req => moment(req.time * 1000).format('YYYY-MM-DD')
  const requestsByDate = _.groupBy(withoutRequestsByAdmins(results).map(stripExtraFields), getDateForRequest)

  return Object.keys(requestsByDate).reduce((result, key) => {
    result[key] = requestsByDate[key].length
    return result
  }, {})
}

const between = async (from, to) => {
  const results = await UsageStatistic.findAll({
    where: {
      time: {
        [Op.between]: [from, to]
      }
    }
  })

  return {
    byEndpoint: _.groupBy(results.map(stripExtraFields), u => formatForGroup(u.URL)),
    byUser: _.groupBy(results.map(stripExtraFields), u => u.username),
    byDate: byDate(results),
    all: results
  }
}

module.exports = {
  between
}
