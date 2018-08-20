const _ = require('lodash')
const { UsageStatistic, sequelize } = require('../models')
const { Op } = sequelize

const formatForGroup = url => {
  if (url.startsWith('/api/v2/populationstatistics/courses?year=')) {
    return '/api/v2/populationstatistics/courses'
  }

  if (url.startsWith('/api/v2/populationstatistics/?year=')) {
    return '/api/v2/populationstatistics'
  }

  if (url.startsWith('/api/v2/populationstatistics/filters?&studyRights')) {
    return '/api/v2/populationstatistics/filters'
  }

  if (url.startsWith('/api/teachers/?searchTerm')) {
    return '/api/teachers'
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