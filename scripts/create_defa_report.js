const fs = require('fs')
const { getCourseUnitRealisation, getStudyAttainments } = require('../src/services/doo_api_database_updater/oodi_interface')

const parseInfo = response => {
  const { students } = response
  return {
    enrolled: students.length,
    student_numbers: students.map(student => student.student_number)
  }
}

const getStudents = (requiredCourses, timeframe) => async studentNumbers => {
  const responses = await Promise.all(
    studentNumbers.map(sn => getStudyAttainments(sn))
  )
  return responses.map((response, index) => parseStudentInfo(requiredCourses, timeframe)(response, studentNumbers[index]))
}

const parseStudentInfo = (requiredCourses, timeframe) => (response, studentNumber) => {
  const studyAttainments = response.map(studyAttainment => ({
    date: new Date(studyAttainment.attainment_date),
    grade: Number(studyAttainment.grade[0].text),
    credits: studyAttainment.credits,
    course_code: studyAttainment.learningopportunity_id
  }))
  const passed = studyAttainments.filter(studyAttainment => studyAttainment.grade > 0)
  const creditsTotal = passed.reduce((acc, studyAttainment) => acc + studyAttainment.credits, 0)
  const hasRequired = checkRequiredCourses(requiredCourses, timeframe)(passed)
  return {
    student_number: studentNumber,
    credits: creditsTotal,
    hasRequired
  }
}

const checkRequiredCourses = (requiredCourses, timeframe) => studyAttainments => requiredCourses.reduce(
  (acc, course) => acc && Boolean(studyAttainments.find(
    studyAttainment => studyAttainment.course_code === course && withinTimeframe(timeframe)(studyAttainment.date)
  )),
  true
)

const withinTimeframe = timeframe => time => time > timeframe.start && time < timeframe.end

const HEADER_ROW = '"student number","credits","required courses done"'

const toCsv = students => [
  HEADER_ROW,
  ...students.map(
    student => `"${student.student_number}","${student.credits}",${student.hasRequired}`
  )
].join('\n')

const toStats = students => {
  const totalNumber = students.length
  const totalHasAny = students.filter(student => student.credits > 0).length
  const totalHasRequired = students.filter(student => student.hasRequired).length
  return [
    `Total number of DEFA students: ${totalNumber}`,
    `Total number of DEFA students with at least one credit: ${totalHasAny}`,
    `Total number of DEFA students with all required courses done: ${totalHasRequired}`
  ].join('\n')
}

const getStudentNumbers = async courseIds => {
  const responses = await Promise.all(
    courseIds.map(id => getCourseUnitRealisation(id))
  )
  const courseInfos = responses.map(response => parseInfo(response))
  const studentNumbers = courseInfos
    .reduce((acc, info) => [...acc, ...info.student_numbers], [])
    .filter((studentNumber, index, array) => array.indexOf(studentNumber) === index)
  return studentNumbers
}

const createReport = async (paramFileName) => {
  // Get parameters
  if (!paramFileName) {
    console.error('No parameter file name was provided.')
    process.exit(1)
  }
  const params = JSON.parse(String(fs.readFileSync(paramFileName)))
  if (!params.out) {
    console.error('No output files were defined in parameter file.')
    process.exit(1)
  }
  if (!params.in) {
    console.error('No input files were defined in parameter file.')
    process.exit(1)
  }
  if (!params.in.course_ids) {
    console.error('No file was defined as input for DEFA course unit realisation codes. Set it as in.course_ids in the parameter file.')
    process.exit(1)
  }
  const courseIds = String(fs.readFileSync(params.in.course_ids)).trim().split('\n')
  if (courseIds.length === 1 && courseIds[0].length === 0) {
    console.error('DEFA course unit realisation codes input file is empty.')
    process.exit(1)
  }
  if (!params.in.course_ids) {
    console.error('No file was defined as input for required course codes. Set it as in.required_courses in the parameter file.')
    process.exit(1)
  }
  const requiredCourses = String(fs.readFileSync(params.in.required_courses)).trim().split('\n')
  if (requiredCourses.length === 1 && requiredCourses[0].length === 0) {
    console.error('Required course codes input file is empty.')
    process.exit(1)
  }
  if (!params.in.timeframe || !params.in.timeframe.start || !params.in.timeframe.end) {
    console.error('Input in.timeframe must be an object with fields "start" and "end".')
    process.exit(1)
  }
  const timeframe = {
    start: new Date(params.in.timeframe.start),
    end: new Date(params.in.timeframe.end)
  }

  // Get information from api
  const studentNumbers = await getStudentNumbers(courseIds)
  const defaStudents = await getStudents(requiredCourses, timeframe)(studentNumbers)

  // Print out into output files
  if (params.out.csv) {
    fs.writeFileSync(params.out.csv, toCsv(defaStudents))
  } else {
    console.log('No file defined for csv output. You can set it as out.csv in the parameter file.')
  }
  if (params.out.stats) {
    fs.writeFileSync(params.out.stats, toStats(defaStudents))
  } else {
    console.log('No file defined for stats JSON output. You can set it as out.stats in the parameter file.')
  }
  console.log('Successfully created a DEFA report.')
  process.exit(0)
}

createReport(...process.argv.slice(2))
