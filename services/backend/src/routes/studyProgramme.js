const router = require('express').Router()

const { ElementDetail } = require('../models')
const {
  getBasicStats,
  setBasicStats,
  getGraduationStats,
  setGraduationStats,
  getStudytrackStats,
  setStudytrackStats,
} = require('../services/analyticsService')
const { getCreditsProduced } = require('../services/providerCredits')
const { getProgrammeName } = require('../services/studyprogramme')
const { getBasicStatsForStudytrack } = require('../services/studyprogramme/studyprogrammeBasics')
const {
  getStudyprogrammeCoursesForStudytrack,
  getStudyprogrammeStatsForColorizedCoursesTable,
} = require('../services/studyprogramme/studyprogrammeCourses')
const { getGraduationStatsForStudytrack } = require('../services/studyprogramme/studyprogrammeGraduations')
const { updateBasicView, updateStudytrackView } = require('../services/studyprogramme/studyprogrammeUpdates')
const { getStudytrackStatsForStudyprogramme } = require('../services/studyprogramme/studytrackStats')
const { getAssociations } = require('../services/studyrights')
const logger = require('../util/logger')

// For grafana statistics (idea stolen from Norppa)
const logInfoForGrafana = async (code, combinedProgramme) => {
  const programme = await ElementDetail.findOne({ where: { code } })
  const programmeCode = combinedProgramme ? `${programme.code}-${combinedProgramme}` : programme.code
  logger.info('Study Programme', {
    studyprogrammeName: combinedProgramme ? `${programme.name.fi} + maisteri` : programme.name.fi,
    studyprogrammeCode: programmeCode,
  })
}

router.get('/v2/studyprogrammes/:id/basicstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups
  const combinedProgramme = req.query?.combined_programme
  if (!code) return res.status(422).end()

  logInfoForGrafana(code, combinedProgramme)
  const data = await getBasicStats(code, combinedProgramme, yearType, specialGroups)
  if (data) return res.json(data)

  const updated = await getBasicStatsForStudytrack({
    studyprogramme: req.params.id,
    combinedProgramme,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (updated) await setBasicStats(updated, yearType, specialGroups)
  return res.json(updated)
})

router.get('/v2/studyprogrammes/creditstats', async (req, res) => {
  const { codes: codesListString, isAcademicYear, includeSpecials } = req.query
  const codes = JSON.parse(codesListString)
  const stats = {}
  for (const code of codes) {
    stats[code] = await getCreditsProduced(code, isAcademicYear !== 'false', includeSpecials !== 'false')
  }
  return res.json({ stats })
})

router.get('/v2/studyprogrammes/:id/graduationstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups
  const combinedProgramme = req.query?.combined_programme

  if (!code) return res.status(422).end()

  const data = await getGraduationStats(code, combinedProgramme, yearType, specialGroups)
  if (data) return res.json(data)
  const updatedStats = await getGraduationStatsForStudytrack({
    studyprogramme: req.params.id,
    combinedProgramme,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (updatedStats) await setGraduationStats(updatedStats, yearType, specialGroups)
  return res.json(updatedStats)
})

router.get('/v2/studyprogrammes/:id/coursestats', async (req, res) => {
  const code = req.params.id
  const showByYear = req.query.academicyear
  const combinedProgramme = req.query?.combined_programme
  const date = new Date()
  date.setHours(23, 59, 59, 999)

  logInfoForGrafana(code, combinedProgramme)
  try {
    const data = await getStudyprogrammeCoursesForStudytrack(date.getTime(), code, showByYear, combinedProgramme)
    return res.json(data)
  } catch (e) {
    logger.error({ message: `Failed to get code ${code} programme courses stats`, meta: `${e}` })
  }
})

router.get('/v2/studyprogrammes/:id/studytrackstats', async (req, res) => {
  const code = req.params.id
  const graduated = req.query?.graduated
  const specialGroups = req.query?.special_groups
  const combinedProgramme = req.query?.combined_programme

  if (!code) return res.status(422).end()

  logInfoForGrafana(code, combinedProgramme)
  const data = await getStudytrackStats(code, combinedProgramme, graduated, specialGroups)
  if (data) return res.json(data)

  const associations = await getAssociations()
  const updated = await getStudytrackStatsForStudyprogramme({
    studyprogramme: code,
    combinedProgramme,
    settings: {
      graduated: graduated === 'GRADUATED_INCLUDED',
      specialGroups: specialGroups === 'SPECIAL_INCLUDED',
    },
    associations,
  })
  if (updated) await setStudytrackStats(updated, graduated, specialGroups)
  return res.json(updated)
})

router.get('/v2/studyprogrammes/:id/colorizedtablecoursestats', async (req, res) => {
  const code = req.params.id

  try {
    const data = await getStudyprogrammeStatsForColorizedCoursesTable(code)
    return res.json(data)
  } catch (e) {
    logger.error({ message: `Failed to get code ${code} colorized table course stats`, meta: `${e}` })
  }
})

router.get('/v2/studyprogrammes/:id/update_basicview', async (req, res) => {
  const code = req.params.id
  const combinedProgramme = req.query?.combined_programme
  if (code) {
    let result = null
    try {
      result = await updateBasicView(code, combinedProgramme)
    } catch (e) {
      logger.error({ message: `Failed to update code ${code} ${combinedProgramme} basic stats`, meta: `${e}` })
    }
    return res.json(result)
  }
  res.status(422).end()
})

router.get('/v2/studyprogrammes/:id/update_studytrackview', async (req, res) => {
  const code = req.params.id
  const combinedProgramme = req.query?.combined_programme
  if (code) {
    let result = null
    try {
      const associations = await getAssociations()
      result = await updateStudytrackView(code, combinedProgramme, associations)
    } catch (e) {
      logger.error({ message: `Failed to update code ${code} ${combinedProgramme} studytrack stats`, meta: `${e}` })
    }
    return res.json(result)
  }
  res.status(422).end()
})

router.get('/v2/studyprogrammes/:id/evaluationstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups
  const graduated = req.query?.graduated

  if (!code) return res.status(422).end()

  // Statistics for Tilannekuvalomake view
  const combinedProgramme = ''
  let gradData = await getGraduationStats(code, combinedProgramme, yearType, specialGroups)
  if (!gradData) {
    const updatedStats = await getGraduationStatsForStudytrack({
      studyprogramme: req.params.id,
      combinedProgramme,
      settings: {
        isAcademicYear: yearType === 'ACADEMIC_YEAR',
        includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
      },
    })
    if (updatedStats) {
      await setGraduationStats(updatedStats, yearType, specialGroups)
      gradData = updatedStats
    }
  }

  let progressData = await getStudytrackStats(code, combinedProgramme, graduated, specialGroups)
  if (!progressData) {
    const associations = await getAssociations()
    const updated = await getStudytrackStatsForStudyprogramme({
      studyprogramme: code,
      combinedProgramme,
      settings: {
        graduated: graduated === 'GRADUATED_INCLUDED',
        specialGroups: specialGroups === 'SPECIAL_INCLUDED',
      },
      associations,
    })
    if (updated) {
      await setStudytrackStats(updated, graduated, specialGroups)
      progressData = updated
    }
  }

  const programmeName = await getProgrammeName(code)

  delete gradData.tableStats
  delete gradData.graphStats
  delete gradData.titles
  const data = {
    id: code,
    programmeName: programmeName?.name,
    status: gradData?.status,
    lastUpdated: gradData.lastUpdated,
    graduations: gradData,
    creditCounts: progressData?.creditCounts,
    years: progressData?.years,
  }

  return res.json(data)
})

module.exports = router
