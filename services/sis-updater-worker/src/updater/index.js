const { groupBy, flatten, sortBy } = require('lodash')
const { Organization, Course, CourseType, Student } = require('../db/models')
const { selectFromByIds, selectFromSnapshotsByIds, bulkCreate } = require('../db')
const { getMinMaxDate, getMinMax } = require('../utils')

const updateOrganisations = async organisations => {
  await bulkCreate(Organization, organisations)
}

const updateModules = async modules => {
  console.log('modules', modules)
}

const updateEducations = async educations => {
  console.log('educations', educations)
}

const updateCourseUnits = async courseUnits => {
  const attainments = await selectFromByIds(
    'attainments',
    courseUnits.map(c => c.id),
    'course_unit_id'
  )
  const courseIdToAttainments = groupBy(attainments, 'course_unit_id')
  const groupIdToCourse = groupBy(courseUnits, 'group_id')

  const courses = Object.entries(groupIdToCourse).map(([, courses]) => {
    const { code, name, study_level: coursetypecode, id } = courses[0]
    const { min: startdate, max: enddate } = getMinMaxDate(
      courses,
      c => c.validity_period.startDate,
      c => c.validity_period.endDate
    )

    const attainments = flatten(courses.map(c => courseIdToAttainments[c.id])).filter(a => !!a)
    const { min: min_attainment_date, max: max_attainment_date } = getMinMax(
      attainments,
      a => a.attainment_date,
      a => a.attainment_date
    )

    return {
      id,
      name,
      code,
      coursetypecode,
      minAttainmentDate: min_attainment_date,
      maxAttainmentDate: max_attainment_date,
      latestInstanceDate: max_attainment_date,
      startdate,
      enddate,
      isStudyModule: false
    }
  })

  await bulkCreate(Course, courses)
}

const updateAssessmentItems = async assessmentItems => {
  console.log('assessmentItems', assessmentItems)
}

const updateCourseUnitRealisations = async courseUnitRealisations => {
  console.log('courseUnitRealisations', courseUnitRealisations)
}

const updateStudents = async personIds => {
  const [students, studyRights, attainments, termRegistrations] = await Promise.all([
    selectFromByIds('persons', personIds),
    selectFromSnapshotsByIds('studyrights', personIds, 'person_id'),
    selectFromByIds('attainments', personIds, 'person_id'),
    selectFromByIds('term_registrations', personIds, 'student_id')
  ])

  const formattedStudents = students.map(student => {
    const { 
      last_name, 
      first_names, 
      student_number, 
      primary_email, 
      gender_urn, 
      country_urn, 
      citizenships, 
      oppija_id, 
      date_of_birth, 
      id 
    } = student

    const gender_urn_array = gender_urn.split(':')
    const formattedGender = gender_urn_array[gender_urn_array.length - 1]

    const gender_mankeli = (gender) => {
      if (gender === 'male') return 1
      if (gender === 'female') return 2
      return 3
    }

    const gender_code = gender_mankeli(formattedGender) 

    const studyRightsOfStudent = studyRights.filter(SR => SR.person_id === id)

    const dateofuniversityenrollment = studyRightsOfStudent.length > 0 ? sortBy(studyRightsOfStudent.map(sr => sr.study_start_date))[0] : null

    const attainmentsOfStudent = attainments.filter(attainment => attainment.person_id === id) // current db doesn't have studentnumbers in attainment table so have to use person_id for now

    const creditcount = attainmentsOfStudent.reduce((acc, curr) => {
      if (curr.type === 'ModuleAttainment' || curr.state === 'FAILED' || curr.misregistration) return acc // bit hacky solution for now
      return acc + Number(curr.credits)
    }, 0)

    return {
      lastname: last_name,
      firstnames: first_names,
      studentnumber: student_number,
      email: primary_email,
      gender_code,
      national_student_number: oppija_id, 
      home_county_id: null,   //wtf
      birthdate: date_of_birth,
      creditcount,	 
      dateofuniversityenrollment,	 
      country_fi: null,      // do we need these names in different languages?
      country_sv: null,      // --||--
      country_en: null,      // --||--
      home_country_fi: null, // --||--		 
      home_country_sv: null, // --||--		 
      home_country_en: null, // --||--
    }
  })

  console.log('students', students)
  await bulkCreate(Student, formattedStudents)
  await updateStudyRights(studyRights.map(({ studyright }) => studyright))
  await Promise.all([updateAttainments(attainments), updateTermRegistrations(termRegistrations)])
}

const updateStudyRights = async studyRights => {
  console.log('studyRights', studyRights)
}

const updateAttainments = async attainments => {
  console.log('attainments', attainments)
}

const updateTermRegistrations = async termRegistrations => {
  console.log('termRegistrations', termRegistrations)
}

const updateCourseTypes = async studyLevels => {
  const mapStudyLevelToCourseType = studyLevel => ({
    coursetypecode: studyLevel.id,
    name: studyLevel.name
  })
  await bulkCreate(CourseType, studyLevels.map(mapStudyLevelToCourseType))
}

const idToHandler = {
  students: updateStudents,
  organisations: updateOrganisations,
  modules: updateModules,
  educations: updateEducations,
  assessment_items: updateAssessmentItems,
  course_units: updateCourseUnits,
  course_unit_realisations: updateCourseUnitRealisations,
  study_levels: updateCourseTypes
}

const update = async ({ entityIds, type }) => {
  const updateHandler = idToHandler[type]
  switch (type) {
    case 'students':
      return await updateHandler(entityIds)
    case 'organisations':
    case 'assessment_items':
      return await updateHandler(await selectFromSnapshotsByIds(type, entityIds))
    case 'course_units':
      return await updateHandler(await selectFromByIds(type, entityIds, 'group_id'))
    case 'modules':
    case 'study_levels':
    case 'educations':
    case 'course_unit_realisations':
      return await updateHandler(await selectFromByIds(type, entityIds))
  }
}

module.exports = {
  update
}
