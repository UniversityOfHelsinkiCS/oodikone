const fs = require('fs')
const { getCourseUnitRealisation, getStudyAttainments } = require('../src/services/doo_api_database_updater/oodi_interface')

const parseInfo = response => {
  const { students } = response
  return {
    enrolled: students.length,
    student_numbers: students.map(student => student.student_number)
  }
}

const getStudents = (includedCourses, requiredCourses, timeframe) => async studentNumbers => {
  const responses = await Promise.all(
    studentNumbers.map(sn => getStudyAttainments(sn))
  )
  return responses.map((response, index) => parseStudentInfo(includedCourses, requiredCourses, timeframe)(response, studentNumbers[index]))
}

const optionalAYprefixRegex = course => new RegExp(`^(AY)?${course}$`)

const parseStudentInfo = (includedCourses, requiredCourses, timeframe) => (response, studentNumber) => {
  const studyAttainments = response.map(studyAttainment => ({
    date: new Date(studyAttainment.attainment_date),
    grade: Number(studyAttainment.grade[0].text),
    credits: studyAttainment.credits,
    course_code: studyAttainment.learningopportunity_id
  }))
  const defaCourses = studyAttainments
    .filter(
      studyAttainment => Boolean(includedCourses.find(
        course => Boolean(studyAttainment.course_code.match(optionalAYprefixRegex(course)))
      ))
    )
    .filter(studyAttainment => studyAttainment.grade > 0)
    .filter(studyAttainment => withinTimeframe(timeframe)(studyAttainment.date))
  const creditsTotal = defaCourses.reduce((acc, studyAttainment) => acc + studyAttainment.credits, 0)
  const hasRequired = checkRequiredCourses(requiredCourses)(defaCourses)
  const courseCompletions = includedCourses.map(course => Boolean(
    defaCourses.find(courseCompletion => Boolean(courseCompletion.course_code.match(optionalAYprefixRegex(course))))
  ))
  return {
    student_number: studentNumber,
    credits: creditsTotal,
    hasRequired,
    courseCompletions
  }
}

const checkRequiredCourses = requiredCourses => studyAttainments => requiredCourses.reduce(
  (acc, course) => acc && Boolean(studyAttainments.find(
    studyAttainment => Boolean(studyAttainment.course_code.match(optionalAYprefixRegex(course)))
  )),
  true
)

const withinTimeframe = timeframe => time => time > timeframe.start && time < timeframe.end

const HEADER_ROW_STUB = '"student number","DEFA credits","required courses done"'

const toCsv = includedCourses => students => {
  const creditTotals = [0,0,0,0,0,0,0,0,0,0,0,0,0]
  const courseTotals = includedCourses.map(() => 0)
  students.forEach(student => {
    let creditTotalIndex
    if (student.credits >= 60) {
      creditTotalIndex = 12
    } else {
      creditTotalIndex = (student.credits - student.credits % 5) / 5
    }
    creditTotals[creditTotalIndex] += 1
    student.courseCompletions.forEach((complete, index) => {
      if (complete) {
        courseTotals[index] += 1
      }
    })
  })

  const allCredits = students.reduce((acc, student) => acc + student.credits,0)
  const totalRequired = students.filter(student => student.hasRequired).length
  const reportCsv = [
    `${HEADER_ROW_STUB},${includedCourses.join(',')}`,
    ...students.map(
      student => `"${student.student_number}",${student.credits},${Number(student.hasRequired)},${student.courseCompletions.map(bool => Number(bool)).join(',')}`
    ),
    ['total', allCredits, totalRequired, ...courseTotals].join(',')
  ].join('\n')

  const creditTotalHeaders = ['0-4','5-9','10-14','15-19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60+']
  const creditTotalCsv = [
    creditTotalHeaders.join(','),
    creditTotals.join(',')
  ].join('\n')

  return [reportCsv, creditTotalCsv]
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
  if (!params.in.included_courses) {
    console.error('No file was defined as input for included course codes. Set it as in.included_courses in the parameter file.')
    process.exit(1)
  }
  const includedCourses = String(fs.readFileSync(params.in.included_courses)).trim().split('\n')
  if (includedCourses.length === 1 && includedCourses[0].length === 0) {
    console.error('Included course codes input file is empty.')
    process.exit(1)
  }
  if (!params.in.required_courses) {
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
  const defaStudents = await getStudents(includedCourses, requiredCourses, timeframe)(studentNumbers)

  // Print out into output files
  const [reportCsv, statsCsv] = toCsv(includedCourses)(defaStudents)
  if (params.out.report) {
    fs.writeFileSync(params.out.report, reportCsv)
  } else {
    console.log('No file defined for report output. You can set it as out.report in the parameter file.')
  }
  if (params.out.stats) {
    fs.writeFileSync(params.out.stats, statsCsv)
  } else {
    console.log('No file defined for stats output. You can set it as out.stats in the parameter file.')
  }
  console.log('Successfully created a DEFA report.')
  process.exit(0)
}

createReport(...process.argv.slice(2))
