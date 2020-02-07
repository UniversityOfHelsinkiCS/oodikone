const { groupBy, flatten, flattenDeep, sortBy, mapValues, uniqBy } = require('lodash')
const {
  Organization,
  Course,
  CourseType,
  CourseProvider,
  Student,
  Semester,
  SemesterEnrollment,
  Teacher
} = require('../db/models')
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
  const courseProviders = []

  const courses = Object.entries(groupIdToCourse).map(([, courses]) => {
    const { code, name, study_level: coursetypecode, id, organisations } = courses[0]
    organisations
      .filter(({ roleUrn }) => roleUrn === 'urn:code:organisation-role:responsible-organisation')
      .forEach(({ organisationId }) => {
        courseProviders.push({
          composite: `${code}-${organisationId}`,
          coursecode: id,
          organizationcode: organisationId
        })
      })
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
  await bulkCreate(CourseProvider, courseProviders, null, ['composite'])
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

  const personIdToStudentNumber = students.reduce((res, curr) => {
    res[curr.id] = curr.student_number
    return res
  }, {})

  const formattedStudents = students.map(student => {
    const { last_name, first_names, student_number, primary_email, gender_urn, oppija_id, date_of_birth, id } = student

    const gender_urn_array = gender_urn ? gender_urn.split(':') : null
    const formattedGender = gender_urn_array ? gender_urn_array[gender_urn_array.length - 1] : null

    const gender_mankeli = gender => {
      if (gender === 'male') return 1
      if (gender === 'female') return 2
      return 3
    }

    const gender_code = gender_mankeli(formattedGender)

    const studyRightsOfStudent = studyRights.filter(SR => SR.person_id === id)

    const dateofuniversityenrollment =
      studyRightsOfStudent.length > 0 ? sortBy(studyRightsOfStudent.map(sr => sr.study_start_date))[0] : null

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
      home_county_id: null, //wtf
      birthdate: date_of_birth,
      creditcount,
      dateofuniversityenrollment,
      country_fi: null, // do we need these names in different languages?
      country_sv: null, // --||--
      country_en: null, // --||--
      home_country_fi: null, // --||--
      home_country_sv: null, // --||--
      home_country_en: null // --||--
    }
  })

  console.log('students', students)
  await bulkCreate(Student, formattedStudents)
  await updateStudyRights(studyRights.map(({ studyright }) => studyright))
  await Promise.all([
    updateAttainments(attainments),
    updateTermRegistrations(termRegistrations, personIdToStudentNumber)
  ])
}

const updateStudyRights = async studyRights => {
  console.log('studyRights', studyRights)
}

const updateAttainments = async attainments => {
  console.log('attainments', attainments)
  const acceptorPersonIds = flatten(
    attainments.map(attainment =>
      attainment.acceptor_persons
        .filter(p => p.roleUrn === 'urn:code:attainment-acceptor-type:approved-by')
        .map(p => p.personId)
    )
  ).filter(p => !!p)
  await updateTeachers(acceptorPersonIds)
}

const updateTeachers = async personIds => {
  const teachers = (await selectFromByIds('persons', personIds))
    .filter(p => !!p.employee_number)
    .map(p => ({
      id: p.employee_number,
      name: `${p.last_name} ${p.first_names}`
    }))

  await bulkCreate(Teacher, teachers)
}

const updateTermRegistrations = async (termRegistrations, personIdToStudentNumber) => {
  const semesters = await Semester.findAll()
  const studyRightIds = termRegistrations.map(({ study_right_id }) => study_right_id)
  const studyRights = await selectFromSnapshotsByIds('studyrights', studyRightIds)
  const orgIds = studyRights.map(({ organisation_id }) => organisation_id)
  const organisations = await selectFromSnapshotsByIds('organisations', orgIds)

  const orgToStartYearToSemesters = semesters.reduce((res, curr) => {
    if (!res[curr.org]) res[curr.org] = {}
    if (!res[curr.org][curr.startYear]) res[curr.org][curr.startYear] = {}
    res[curr.org][curr.startYear][curr.termIndex] = curr
    return res
  }, {})

  const orgToUniOrgId = organisations.reduce((res, curr) => {
    res[curr.id] = curr.university_org_id
    return res
  }, {})

  const studyrightToUniOrgId = studyRights.reduce((res, curr) => {
    res[curr.id] = orgToUniOrgId[curr.organisation_id]
    return res
  }, {})

  const semesterEnrollments = uniqBy(
    flatten(
      termRegistrations.map(({ student_id, term_registrations, study_right_id }) => {
        return term_registrations.map(
          ({
            studyTerm: { termIndex, studyYearStartYear },
            registrationDate,
            termRegistrationType,
            statutoryAbsence
          }) => {
            const enrollmenttype = termRegistrationType === 'ATTENDING' ? 1 : 2
            const studentnumber = personIdToStudentNumber[student_id]
            const { semestercode } = orgToStartYearToSemesters[studyrightToUniOrgId[study_right_id]][
              studyYearStartYear
            ][termIndex]
            const enrollment_date = registrationDate
            const org = studyrightToUniOrgId[study_right_id]
            return {
              enrollmenttype,
              studentnumber,
              semestercode,
              enrollment_date,
              org,
              semestercomposite: `${org}-${semestercode}`,
              statutory_absence: statutoryAbsence
            }
          }
        )
      })
    ),
    sE => `${sE.studentnumber}${sE.semestercomposite}`
  )

  await bulkCreate(SemesterEnrollment, semesterEnrollments)
}

const updateCourseTypes = async studyLevels => {
  const mapStudyLevelToCourseType = studyLevel => ({
    coursetypecode: studyLevel.id,
    name: studyLevel.name
  })
  await bulkCreate(CourseType, studyLevels.map(mapStudyLevelToCourseType))
}

const updateSemesters = async studyYears => {
  const semesters = flattenDeep(
    Object.entries(groupBy(studyYears, 'org')).map(([org, orgStudyYears]) => {
      let semestercode = 1
      return sortBy(orgStudyYears, 'start_year').map(orgStudyYear => {
        return orgStudyYear.study_terms.map((studyTerm, i) => {
          const acualYear = new Date(studyTerm.valid.startDate).getFullYear()
          return {
            composite: `${org}-${semestercode}`,
            name: mapValues(studyTerm.name, n => {
              return `${n} ${acualYear}`
            }),
            startdate: studyTerm.valid.startDate,
            enddate: studyTerm.valid.endDate,
            yearcode: Number(orgStudyYear.start_year) - 1949, // lul! :D
            yearname: orgStudyYear.name,
            semestercode: semestercode++,
            org,
            termIndex: i,
            startYear: orgStudyYear.start_year
          }
        })
      })
    })
  )
  await bulkCreate(Semester, semesters)
}

const idToHandler = {
  students: updateStudents,
  organisations: updateOrganisations,
  modules: updateModules,
  educations: updateEducations,
  assessment_items: updateAssessmentItems,
  course_units: updateCourseUnits,
  course_unit_realisations: updateCourseUnitRealisations,
  study_levels: updateCourseTypes,
  study_years: updateSemesters
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
    case 'study_years':
      return await updateHandler(await selectFromByIds(type, entityIds, 'org'))
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
