const { pick } = require('lodash')
const moment = require('moment')
const { col, fn } = require('sequelize')

const { ElementDetail, SISStudyRightElement, Studyright, StudyrightElement, Transfer } = require('../models')
const logger = require('../util/logger')
const { redisClient } = require('./redis')

const REDIS_KEY = 'STUDYRIGHT_ASSOCIATIONS_V2'

const getProgrammesFromStudyRights = async () => {
  const programmes = await SISStudyRightElement.findAll({
    attributes: [[fn('DISTINCT', col('code')), 'code'], 'name'],
  })
  return programmes
}

const associatedStudyrightElements = async (offset, limit) => {
  const studyrights = await Studyright.findAll({
    attributes: [],
    include: {
      model: StudyrightElement,
      attributes: ['studyrightid', 'startdate', 'enddate'],
      include: {
        model: ElementDetail,
        attributes: ['type', 'name', 'code'],
      },
    },
    order: [['studyrightid', 'DESC']], // Use order when chunking with offset & limit, otherwise results are random and there will be misses
    limit,
    offset,
  })
  const groupings = studyrights.map(({ studyright_elements: sres }) =>
    sres.map(sre => ({
      ...sre.element_detail.get(),
      studyrightid: sre.get().studyrightid,
      startdate: sre.get().startdate,
      enddate: sre.get().enddate,
    }))
  )
  return groupings
}

const StudyRightType = {
  PROGRAMME: 20,
  STUDYTRACK: 30,
}

const calculateAssociationsFromDb = async (chunksize = 100000) => {
  logger.info('Refreshing studyright associations. This will take a while.')
  const transfers = await Transfer.findAll({
    attributes: ['studyrightid'],
  })
  const transferedStudyrightIds = transfers.map(transfer => transfer.studyrightid)
  const getSemester = momentstartdate => {
    if (momentstartdate < moment(`${momentstartdate.utc().year()}-07-31 21:00:00+00`)) return 'SPRING'
    return 'FALL'
  }
  const getEnrollmentStartYear = momentstartdate => {
    if (getSemester(momentstartdate) === 'SPRING') return momentstartdate.utc(2).year() - 1
    return momentstartdate.year()
  }
  const total = await Studyright.count()
  let offset = 0
  const types = new Set([StudyRightType.PROGRAMME, StudyRightType.STUDYTRACK])
  const isValid = ({ type }) => types.has(type)
  const associations = { programmes: {}, studyTracks: {} }
  while (offset <= total) {
    const elementgroups = await associatedStudyrightElements(offset, chunksize)
    elementgroups.forEach(fullgroup => {
      const group = fullgroup.filter(isValid)
      group.forEach(({ type, code, name, studyrightid, startdate, enddate }) => {
        if (type === StudyRightType.STUDYTRACK) {
          associations.studyTracks[code] = associations.studyTracks[code] || {
            type,
            name,
            code,
            programmes: {},
          }
        } else if (type === StudyRightType.PROGRAMME) {
          associations.programmes[code] = associations.programmes[code] || {
            type,
            name,
            code,
            enrollmentStartYears: {},
            studytracks: [],
          }
          const momentstartdate = moment(startdate)
          const enrollment = momentstartdate.isValid() ? getEnrollmentStartYear(momentstartdate) : null
          const { enrollmentStartYears } = associations.programmes[code]
          if (!enrollmentStartYears[enrollment])
            enrollmentStartYears[enrollment] = {
              studyTracks: {},
            }
          const enrollmentStartYear = enrollmentStartYears[enrollment]

          group
            .filter(e => e.studyrightid === studyrightid && e.code !== code)
            .forEach(e => {
              if (e.type === StudyRightType.STUDYTRACK) {
                const momentenddate = moment(enddate)
                const estartdate = moment(e.startdate)
                const eenddate = moment(e.enddate)
                // check that programme and studytrack time ranges overlap
                if (
                  (momentstartdate <= estartdate && momentenddate >= estartdate) ||
                  (momentstartdate <= eenddate && momentenddate >= eenddate) ||
                  (estartdate <= momentstartdate && eenddate >= momentstartdate) ||
                  (estartdate <= momentenddate && eenddate >= momentenddate)
                ) {
                  enrollmentStartYear.studyTracks[e.code] = {
                    type: e.type,
                    name: e.name,
                    code: e.code,
                  }
                  if (
                    !associations.programmes[code].studytracks.includes(e.code) &&
                    !transferedStudyrightIds.includes(e.studyrightid)
                  ) {
                    associations.programmes[code].studytracks.push(e.code)
                  }
                }
                associations.studyTracks[e.code] = associations.studyTracks[e.code] || {
                  type: e.type,
                  name: e.name,
                  code: e.code,
                  programmes: {},
                }
                associations.studyTracks[e.code].programmes[code] = {
                  type,
                  name,
                  code,
                }
              }
            })
        }
      })
    })
    offset += chunksize
  }

  return associations
}

const saveAssociationsToRedis = async associations => {
  await redisClient.setAsync(REDIS_KEY, JSON.stringify(associations))
}

const getAssociationsFromRedis = async () => {
  const raw = await redisClient.getAsync(REDIS_KEY)
  return raw && JSON.parse(raw)
}

const refreshAssociationsInRedis = async () => {
  const associations = await calculateAssociationsFromDb()
  await saveAssociationsToRedis(associations)
}

const getAssociations = async (doRefresh = false) => {
  const studyrights = await getAssociationsFromRedis()
  if (!studyrights || doRefresh) {
    const associations = await calculateAssociationsFromDb()
    await saveAssociationsToRedis(associations)
    return associations
  }
  return studyrights
}

const getFilteredAssociations = async codes => {
  const associations = await getAssociations()
  associations.programmes = pick(associations.programmes, codes)

  const studyTracks = []
  Object.keys(associations.programmes).forEach(k => {
    Object.keys(associations.programmes[k].enrollmentStartYears).forEach(year => {
      const yearData = associations.programmes[k].enrollmentStartYears[year]
      studyTracks.push(...Object.keys(yearData.studyTracks))
    })
  })
  associations.studyTracks = pick(associations.studyTracks, studyTracks)
  Object.keys(associations.studyTracks).forEach(k => {
    associations.studyTracks[k].programmes = pick(associations.studyTracks[k].programmes, codes)
  })
  return associations
}

module.exports = {
  getAssociations,
  getFilteredAssociations,
  getProgrammesFromStudyRights,
  refreshAssociationsInRedis,
}
