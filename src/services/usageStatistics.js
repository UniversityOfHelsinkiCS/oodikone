const _ = require('lodash')
const { UsageStatistic, sequelize } = require('../models')
const { Op } = sequelize

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