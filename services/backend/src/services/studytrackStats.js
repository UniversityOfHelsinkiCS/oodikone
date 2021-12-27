const moment = require('moment')

const { getAssociations } = require('./studyrights')
const { studentnumbersWithAllStudyrightElements } = require('./populations')
const { getStartDate, getYearsArray, getPercentage } = require('./studyprogrammeHelpers')
const { studytrackStudents, startedStudyrights, graduatedStudyRights } = require('./newStudyprogramme')
const { semesterStart, semesterEnd } = require('../util/semester')

const getStudentData = students => {
  const data = { female: 0, male: 0, finnish: 0 }

  students.forEach(({ gender_code, home_country_en }) => {
    data.male += gender_code === '1' ? 1 : 0
    data.female += gender_code === '2' ? 1 : 0
    data.finnish += home_country_en === 'Finland' ? 1 : 0
  })
  return data
}

const getStudytrackDataForTheYear = async (studyprogramme, studytracks, year) => {
  const startDate = `${year}-${semesterStart['FALL']}`
  const endDate = `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`

  const data = await studytracks.reduce(async (all, track) => {
    const previousData = await all
    const codes = track === studyprogramme ? [studyprogramme] : [studyprogramme, track]
    const studentnumbers = await studentnumbersWithAllStudyrightElements(
      codes,
      startDate,
      endDate,
      true,
      true,
      true,
      true
    )
    const started = await startedStudyrights(track, startDate, studentnumbers)
    const startedStudentnumbers = [...new Set(started.map(s => s.studentnumber))]
    const students = await studytrackStudents(startedStudentnumbers)
    const studentData = getStudentData(students)
    const graduated = await graduatedStudyRights(track, startDate, studentnumbers)
    const label = track === studyprogramme ? 'TOTAL' : track

    if (started.length === 0) return previousData
    return [
      ...previousData,
      [
        label,
        started.length,
        getPercentage(started.length, started.length),
        studentData.male,
        getPercentage(studentData.male, started.length),
        studentData.female,
        getPercentage(studentData.female, started.length),
        studentData.finnish,
        getPercentage(studentData.finnish, started.length),
        graduated.length,
        getPercentage(graduated.length, started.length),
      ],
    ]
  }, [])

  return data
}

const getStudytrackStatsForStudyprogramme = async ({ studyprogramme }) => {
  const isAcademicYear = true
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear()).reverse()

  const associations = await getAssociations()
  const studytracks = associations.programmes[studyprogramme]
    ? [studyprogramme, ...associations.programmes[studyprogramme].studytracks]
    : [studyprogramme]

  const data = await Promise.all(
    years.map(async year => {
      const dataOfYear = await getStudytrackDataForTheYear(studyprogramme, studytracks, year)
      return { year: `${year}-${year + 1}`, data: dataOfYear }
    })
  )

  return { id: studyprogramme, data }
}

module.exports = {
  getStudytrackStatsForStudyprogramme,
}
