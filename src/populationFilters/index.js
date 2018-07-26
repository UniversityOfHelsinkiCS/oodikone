import uuidv4 from 'uuid/v4'
import { getStudentTotalCredits } from '../common'

export const creditsLessThan = (params) => {
  const { credit } = params

  return ({
    id: uuidv4(),
    type: 'CreditsLessThan',
    params: {
      credit
    },
    filter: (student) => {
      const creditsOfStudent = getStudentTotalCredits(student)
      return credit > creditsOfStudent
    }
  })
}
export const sexFilter = (params) => {
  const { gender } = params
  return ({
    id: uuidv4(),
    type: 'SexFilter',
    params: {
      gender
    },
    filter: student => student.gender === gender
  })
}
export const matriculationFilter = (params) => {
  const { matriculationexamination } = params
  return ({
    id: uuidv4(),
    type: 'HasMatriculation',
    params: {
      matriculationexamination
    },
    filter: student => student.matriculationexamination === matriculationexamination
  })
}
export const creditsAtLeast = (params) => {
  const { credit } = params
  return ({
    id: uuidv4(),
    type: 'CreditsAtLeast',
    params: {
      credit
    },
    filter: (student) => {
      const creditsOfStudent = getStudentTotalCredits(student)
      return credit <= creditsOfStudent
    }
  })
}
export const enrollmentStatus = (params) => {
  const { semesters, enrolled } = params
  return ({
    id: uuidv4(),
    type: 'EnrollmentStatus',
    params: {
      semesters,
      enrolled
    },
    filter: student => student.semesterenrollments.filter(({ semestercode }) =>
      semesters.includes(semestercode)).map(({ enrollmenttype }) =>
      enrollmenttype === enrolled).every(b => b === true)
  })
}

export const transferFilter = (params) => {
  const { source, target } = params
  return ({
    id: uuidv4(),
    type: 'TransferFilter',
    params: {
      source,
      target
    },
    filter: student => student.transfers.map(transfer =>
      (source === 'anywhere' || transfer.sourcecode === source) && (target === 'anywhere' || transfer.targetcode === target)).some(b => b === true)
  })
}

export const startingThisSemester = (params) => {
  const { starting } = params
  return ({
    id: uuidv4(),
    type: 'StartingThisSemester',
    params: {
      starting
    },
    filter: student =>
      student.starting === starting
  })
}
export const courseParticipation = ({ field, course }) =>
  ({
    id: uuidv4(),
    type: 'CourseParticipation',
    params: {
      field,
      course
    },
    studentsOfSelectedField: course.students[field],
    filter: student =>
      course.students[field][student.studentNumber] === true
  })

export const extentGraduated = (params) => {
  const { extentcode, name } = params
  return ({
    id: uuidv4(),
    type: 'ExtentGraduated',
    name,
    params: {
      extentcode,
      name
    },
    filter: student => student.studyrights.filter(s =>
      s.graduated).map(s => s.extentcode).includes(extentcode)
  })
}


export const presetFilter = preset => ({
  id: preset.id,
  type: 'Preset',
  name: preset.name,
  filters: preset.filters,
  filter: student => preset.filters.map(f => f.filter(student)).every(b => b === true)
})
const typeList = {
  CreditsLessThan: creditsLessThan,
  CreditsAtLeast: creditsAtLeast,
  HasMatriculation: matriculationFilter,
  SexFilter: sexFilter,
  CourseParticipation: courseParticipation,
  StartingThisSemester: startingThisSemester,
  ExtentGraduated: extentGraduated,
  EnrollmentStatus: enrollmentStatus,
  TransferFilter: transferFilter,
  Preset: presetFilter
}
export const getFilterFunction = (type, params, populationCourses) => {
  switch (type) {
    case 'CourseParticipation':
      return courseParticipation({
        field: params.field,
        course: populationCourses.coursestatistics.filter(c =>
          c.course.code === params.course.course.code)[0]
      })
    default:
      return typeList[type](params)
  }
}

