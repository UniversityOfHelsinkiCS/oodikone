const router = require('express').Router()
const { getBasicStatsForStudytrack } = require('../services/studyprogrammeBasics')
const { getCreditStatsForStudytrack } = require('../services/studyprogrammeCredits')
const { getGraduationStatsForStudytrack } = require('../services/studyprogrammeGraduations')
const { getStudytrackStatsForStudyprogramme } = require('../services/studytrackStats')
const {
  getBasicStats,
  setBasicStats,
  getCreditStats,
  setCreditStats,
  getGraduationStats,
  setGraduationStats,
  getStudytrackStats,
  setStudytrackStats,
} = require('../services/analyticsService')
const { updateBasicView, updateStudytrackView } = require('../services/studyprogrammeUpdates')
const logger = require('../util/logger')

router.get('/v2/studyprogrammes/:id/basicstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups

  if (code) {
    let data = null
    try {
      data = await getBasicStats(code, yearType, specialGroups)
    } catch (e) {
      logger.error(`Failed to get code ${code} basic stats: ${e}`)
    }
    if (!data) {
      try {
        const result = await getBasicStatsForStudytrack({
          studyprogramme: req.params.id,
          settings: {
            isAcademicYear: yearType === 'ACADEMIC_YEAR',
            includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
          },
        })
        data = await setBasicStats(result, yearType, specialGroups)
      } catch (e) {
        logger.error(`Failed to update code ${code} basic stats: ${e}`)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/creditstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups

  if (code) {
    let data = null
    try {
      data = await getCreditStats(code, yearType, specialGroups)
    } catch (e) {
      logger.error(`Failed to get code ${code} credit stats`)
    }
    if (!data) {
      try {
        const result = await getCreditStatsForStudytrack({
          studyprogramme: req.params.id,
          settings: {
            isAcademicYear: yearType === 'ACADEMIC_YEAR',
            includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
          },
        })
        data = await setCreditStats(result, yearType, specialGroups)
      } catch (e) {
        logger.error(`Failed to update code ${code} credit stats`)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/graduationstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups

  if (code) {
    let data = null
    try {
      data = await getGraduationStats(code, yearType, specialGroups)
    } catch (e) {
      logger.error(`Failed to get code ${code} graduation stats`)
    }
    if (!data) {
      try {
        const result = await getGraduationStatsForStudytrack({
          studyprogramme: req.params.id,
          settings: {
            isAcademicYear: yearType === 'ACADEMIC_YEAR',
            includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
          },
        })
        data = await setGraduationStats(result, yearType, specialGroups)
      } catch (e) {
        logger.error(`Failed to update code ${code} graduation stats`)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/studytrackstats', async (req, res) => {
  const code = req.params.id
  const graduated = req.query?.graduated
  const specialGroups = req.query?.special_groups
  const yearsCombined = req.query?.years_combined

  if (code) {
    let data = null
    try {
      data = await getStudytrackStats(code, graduated, specialGroups, yearsCombined)
    } catch (e) {
      logger.error(`Failed to get code ${code} studytrack stats: ${e}`)
    }
    if (!data) {
      try {
        const result = await getStudytrackStatsForStudyprogramme({
          studyprogramme: code,
          settings: {
            graduated: graduated === 'GRADUATED_INCLUDED',
            specialGroups: specialGroups === 'SPECIAL_INCLUDED',
            yearsCombined: yearsCombined === 'YEARS_COMBINED',
          },
        })
        data = await setStudytrackStats(result, graduated, specialGroups, yearsCombined)
      } catch (e) {
        logger.error(`Failed to update code ${code} studytrack stats: ${e}`)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/update_basicview', async (req, res) => {
  const code = req.params.id
  if (code) {
    let result = null
    try {
      result = await updateBasicView(code)
    } catch (e) {
      logger.error(`Failed to update code ${code} basic stats: ${e}`)
    }
    return res.json(result)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/update_studytrackview', async (req, res) => {
  const code = req.params.id
  if (code) {
    let result = null
    try {
      result = await updateStudytrackView(code)
    } catch (e) {
      logger.error(`Failed to update code ${code} studytrack stats: ${e}`)
    }
    return res.json(result)
  } else {
    res.status(422).end()
  }
})

module.exports = router
