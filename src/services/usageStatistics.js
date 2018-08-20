const _ = require('lodash')
const { UsageStatistic, sequelize } = require('../models')
const { Op } = sequelize

const formatForGroup = url => {
  const query = url.indexOf('?')
  if (query!==-1) {
    return url.substr(0, query)
  }

  return url
}

const stripExtraFields = ({ id, username, name, time, admin, method, URL }) => 
  ({ id, username, name, time, admin, method, URL })

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
    all: results 
  }
}

module.exports = {
  between
}