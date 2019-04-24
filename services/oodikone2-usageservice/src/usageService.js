const groupBy = require('lodash/groupBy')
const moment = require('moment')
const Sequelize = require('sequelize')
const { UsageStatistic, sequelize } = require('./models')
const { Op } = Sequelize

const wildcarded = url => {
  if (url.includes('/units/') && url.includes('/users/')) {
    const zeroedUrl = url.replace(/\d/g, '0')
    const end = zeroedUrl.lastIndexOf('/')

    return `${zeroedUrl.substr(0, end)}/00000`
  }

  if (url.includes('/students/')
    || url.includes('/teachers/')
    || url.includes('/users/')
    || url.includes('oodilearn/student')
    || url.includes('courseGroups/')) {
    return url.replace(/\d/g, '0')
  }


  // if post to /thesis/xxxx
  if (url.includes('/studyprogrammes/') &&  url.includes('/thesis/')) {
    const aa =  url.split('/')
    aa[aa.length - 1] = '00000'
    aa[aa.length - 3] = '00000'
    return aa.join('/')
  }

  if ((url.includes('/studyprogrammes/') &&  url.includes('/mandatory_courses'))
  || (url.includes('/studyprogrammes/') &&  url.includes('/productivity')) 
  || (url.includes('/studyprogrammes/') &&  url.includes('/thesis'))
  || (url.includes('/studyprogrammes/') &&  url.includes('/throughput'))) {
    const aa =  url.split('/')
    aa[aa.length - 2] = '00000'
    return aa.join('/')
  }

  if (url.includes('oodilearn/courses/')) {
    const aa =  url.split('/')
    aa[aa.length - 1] = '00000'
    return aa.join('/')
  }

  if (url.includes('oodilearn/') && !url.includes('ping') && !url.includes('populations')) {
    const aa =  url.split('/')
    aa[aa.length - 1] = '00000'
    return aa.join('/')
  }

  if(url.includes('mandatory_courses')) {
    return '/mandatory_courses/00000'
  }

  if(url.includes('course-groups/')) {
    if(url.includes('programme')) {
      if(url.includes('force')) {
        const aa =  url.split('/')
        aa[aa.length - 2] = '00000'
        return aa.join('/')
      } else {
        const aa =  url.split('/')
        aa[aa.length - 1] = '00000'
        return aa.join('/')
      }
    }
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
  const requestsByDate = groupBy(withoutRequestsByAdmins(results).map(stripExtraFields), getDateForRequest)

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
    byEndpoint: groupBy(results.map(stripExtraFields), u => formatForGroup(u.URL)),
    byUser: groupBy(results.map(stripExtraFields), u => u.username),
    byDate: byDate(results),
    all: results
  }
}

module.exports = {
  between
}
