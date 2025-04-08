const _ = require('lodash')
const { Op } = require('sequelize')

const { selectFromByIds, bulkCreate } = require('../../db')
const { Studyplan } = require('../../db/models')
const { isBaMa } = require('../../utils')
const { studyplanMapper, sanitizeCourseCode } = require('../mapper')
const { getEducation } = require('../shared')

const updateStudyplans = async (studyplansAll, personIds, personIdToStudentNumber, groupedStudyRightSnapshots) => {
  const studyplans = studyplansAll.filter(plan => plan.primary)
  const attainments = await selectFromByIds('attainments', personIds, 'person_id')
  const programmeModules = (
    await selectFromByIds(
      'modules',
      Array.from(new Set(_.flatten(studyplans.map(plan => plan.module_selections.map(module => module.moduleId)))))
    )
  ).concat(
    await selectFromByIds(
      'modules',
      attainments.map(a => a.module_group_id).filter(id => !!id),
      'group_id'
    )
  )

  const educationHasStudyRight = Object.keys(groupedStudyRightSnapshots).reduce((acc, k) => {
    const sorted = groupedStudyRightSnapshots[k]
      .filter(s => new Date(s.snapshot_date_time) <= new Date())
      .sort((a, b) => new Date(b.snapshot_date_time) - new Date(a.snapshot_date_time))
    if (!sorted.length) return acc
    const { education_id, person_id } = sorted[0]
    if (!acc[education_id]) acc[education_id] = {}
    acc[education_id][person_id] = true
    return acc
  }, {})

  const educationStudyrights = Object.keys(groupedStudyRightSnapshots).reduce((acc, k) => {
    const sorted = groupedStudyRightSnapshots[k]
      .filter(s => new Date(s.snapshot_date_time) <= new Date())
      .sort((a, b) => new Date(b.snapshot_date_time) - new Date(a.snapshot_date_time))
    if (!sorted.length) return acc
    const { education_id, person_id, id } = sorted[0]
    const educationType = getEducation(education_id)
    const hasBaMa = educationType && isBaMa(educationType)
    if (!acc[education_id]) acc[education_id] = {}
    acc[education_id][person_id] = {
      personId: person_id,
      studyRightId: id,
      hasBaMaEducation: hasBaMa,
    }
    return acc
  }, {})

  const filteredPlans = studyplans.filter(
    p => educationHasStudyRight[p.root_id] && educationHasStudyRight[p.root_id][p.user_id]
  )

  const courseUnitSelections = _.flatten(studyplans.map(plan => plan.course_unit_selections.map(cu => cu.courseUnitId)))
  const courseUnitSelectionSubstitutedBy = _.flattenDeep(
    studyplans.map(plan =>
      plan.course_unit_selections.filter(cu => cu.substitutedBy.length).map(cu => cu.substitutedBy.map(sub => sub))
    )
  )

  const courseUnits = await selectFromByIds(
    'course_units',
    Array.from(
      new Set(
        courseUnitSelections
          .concat(courseUnitSelectionSubstitutedBy)
          .concat(...attainments.filter(a => !!a.course_unit_id).map(a => a.course_unit_id))
      )
    )
  )

  const attainmentIdToAttainment = attainments.reduce((res, cur) => {
    res[cur.id] = cur
    return res
  }, {})

  const courseUnitIdToAttainment = attainments.reduce((res, cur) => {
    if (!cur.course_unit_id) return res
    if (!res[cur.course_unit_id]) res[cur.course_unit_id] = {}
    if (!res[cur.course_unit_id][cur.person_id]) res[cur.course_unit_id][cur.person_id] = []
    res[cur.course_unit_id][cur.person_id].push(cur)
    return res
  }, {})

  const moduleAttainments = attainments.reduce((res, attainment) => {
    if (!attainment.module_id) return res
    if (!res[attainment.module_id]) res[attainment.module_id] = {}
    res[attainment.module_id][attainment.person_id] = attainment
    return res
  }, {})

  const programmeModuleIdToType = programmeModules.reduce((res, cur) => {
    res[cur.id] = cur.type
    return res
  }, {})

  const programmeModuleIdToCode = programmeModules.reduce((res, cur) => {
    res[cur.id] = cur.code
    return res
  }, {})

  const programmeModuleIdToStudyModuleCode = programmeModules.reduce((res, mod) => {
    if (mod.type === 'StudyModule') {
      res[mod.id] = mod.code
    }
    return res
  }, {})

  const courseUnitIdToCode = courseUnits.reduce((res, cur) => {
    res[cur.id] = cur.code
    return res
  }, {})

  const childModules = studyplans.reduce((res, cur) => {
    cur.module_selections.forEach(module => {
      if (!res[module.parentModuleId]) {
        res[module.parentModuleId] = new Set()
      }
      res[module.parentModuleId].add(module.moduleId)
    })
    return res
  }, {})

  const findDegreeProgrammes = (programId, handledProgrammeIds) => {
    if (programmeModuleIdToType[programId] === 'DegreeProgramme') return [programId]
    if (!childModules[programId]) return []
    handledProgrammeIds.add(programId)

    const programmes = []
    childModules[programId].forEach(child => {
      if (!handledProgrammeIds.has(child)) programmes.push(...findDegreeProgrammes(child, handledProgrammeIds))
    })
    return programmes
  }

  const getCourseCodesFromAttainment = attainment => {
    if (!attainment) return []

    if (attainment.code && attainment.type === 'CustomCourseUnitAttainment')
      return [sanitizeCourseCode(attainment.code)]

    if (attainment.nodes?.length)
      return _.flatten(
        attainment.nodes
          .filter(node => node.attainmentId)
          .map(node => getCourseCodesFromAttainment(attainmentIdToAttainment[node.attainmentId]))
      )

    if (attainment.code) return [attainment.code]

    const { course_unit_id, module_id } = attainment
    const code = courseUnitIdToCode[course_unit_id] || programmeModuleIdToCode[module_id]

    return code ? [code] : []
  }

  const getModuleCodesFromAttainment = attainment => {
    if (!attainment) return []

    if (attainment.code && attainment.type === 'CustomModuleAttainment') return [sanitizeCourseCode(attainment.code)]

    if (attainment.type === 'DegreeProgrammeAttainment')
      return _.flatten(
        attainment.nodes
          .filter(node => node.attainmentId)
          .map(node => getModuleCodesFromAttainment(attainmentIdToAttainment[node.attainmentId]))
      )

    const code = programmeModuleIdToStudyModuleCode[attainment.module_id]
    return code ? [code] : []
  }

  const getAttainmentsFromAttainment = attainment => {
    if (!attainment) return []
    if (attainment.nodes && attainment.nodes.length)
      return _.flatten(
        attainment.nodes
          .filter(node => node.attainmentId)
          .map(node => getAttainmentsFromAttainment(attainmentIdToAttainment[node.attainmentId]))
      )
    return [attainment]
  }

  const studyplanIdToDegreeProgrammes = studyplans.reduce((res, cur) => {
    res[cur.id] = findDegreeProgrammes(cur.root_id, new Set())
    return res
  }, {})

  const moduleIdToParentDegreeProgramme = {}
  const mapParentDegreeProgrammes = (moduleId, degreeProgrammeId, handledModuleIds) => {
    if (!moduleIdToParentDegreeProgramme[moduleId]) {
      moduleIdToParentDegreeProgramme[moduleId] = []
    }
    moduleIdToParentDegreeProgramme[moduleId].push(degreeProgrammeId)
    handledModuleIds.add(moduleId)
    if (!childModules[moduleId]) return

    childModules[moduleId].forEach(child => {
      if (!handledModuleIds.has(child)) mapParentDegreeProgrammes(child, degreeProgrammeId, handledModuleIds)
    })
  }

  studyplans.forEach(plan => {
    studyplanIdToDegreeProgrammes[plan.id].forEach(programmeId => {
      mapParentDegreeProgrammes(programmeId, programmeId, new Set())
    })
  })

  const studyPlanIdToDegrees = filteredPlans.reduce((res, cur) => {
    const degreeProgrammeModules = cur.module_selections.filter(({ parentModuleId }) => parentModuleId === cur.root_id)
    res[cur.id] = degreeProgrammeModules.map(({ moduleId }) => moduleId)
    return res
  }, {})

  const moduleIdToParentModuleCode = Object.entries(moduleIdToParentDegreeProgramme).reduce(
    (acc, [moduleId, degreeProgrammeIds]) => {
      const codes = new Set()
      for (const programmeId of degreeProgrammeIds) {
        codes.add(programmeModuleIdToCode[programmeId])
      }
      acc[moduleId] = codes
      return acc
    },
    {}
  )

  const mapStudyplan = studyplanMapper(
    personIdToStudentNumber,
    programmeModuleIdToCode,
    programmeModuleIdToStudyModuleCode,
    moduleIdToParentModuleCode,
    courseUnitIdToCode,
    moduleAttainments,
    attainmentIdToAttainment,
    courseUnitIdToAttainment,
    studyPlanIdToDegrees,
    educationStudyrights,
    getCourseCodesFromAttainment,
    getModuleCodesFromAttainment,
    getAttainmentsFromAttainment,
    attainments
  )

  const mappedPlans = _.flatten(
    filteredPlans
      .filter(p => educationHasStudyRight[p.root_id] && educationHasStudyRight[p.root_id][p.user_id])
      .map(mapStudyplan)
  ).filter(p => !!p)
  await bulkCreate(Studyplan, mappedPlans)
}

// When updating students, studyplans sometimes are not updated. Check which aren't updated
const findStudentsToReupdate = async (personIds, personIdToStudentNumber, iteration = 0) => {
  if (iteration > 0) return
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const students = await Studyplan.findAll({
    where: {
      updatedAt: { [Op.lt]: yesterday },
      studentnumber: { [Op.in]: personIds.map(id => personIdToStudentNumber[id]) },
    },
    attributes: ['studentnumber'],
    distinct: true,
  })
  const studentNumberToPersonId = Object.entries(personIdToStudentNumber).reduce((obj, cur) => {
    const [personId, studentnumber] = cur
    obj[studentnumber] = personId
    return obj
  }, {})

  return students.map(s => studentNumberToPersonId[s.studentnumber])
}

module.exports = {
  updateStudyplans,
  findStudentsToReupdate,
}
