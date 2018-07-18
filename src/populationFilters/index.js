import uuidv4 from 'uuid/v4'
import { getStudentTotalCredits } from '../common'

export const creditsLessThan = credit =>
  ({
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

export const sexFilter = sex =>
  ({
    id: uuidv4(),
    type: 'SexFilter',
    params: {
      sex
    },
    filter: student => student.sex === sex
  })

export const matriculationFilter = matriculationexamination =>
  ({
    id: uuidv4(),
    type: 'HasMatriculation',
    params: {
      matriculationexamination
    },
    filter: student => student.matriculationexamination === matriculationexamination
  })

export const creditsAtLeast = credit =>
  ({
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

export const startingThisSemester = starting =>
  ({
    id: uuidv4(),
    type: 'StartingThisSemester',
    params: {
      starting
    },
    filter: student =>
      student.starting === starting
  })

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

export const extentGraduated = ({ extentcode, name }) => ({
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
  ExtentGraduated: extentGraduated
}
export const getFilterFunction = (type, params, populationCourses) => {
  switch (type) {
    case 'CourseParticipation':
      return courseParticipation({
        field: params.field,
        course: populationCourses.filter(c => c.course.code === params.course.course.code)[0]
      })
    case 'Preset':
      return presetFilter(params)
    case 'ExtentGraduated':
      return extentGraduated({ extentcode: params.extentcode, name: params.name })
    default:
      return typeList[type](Object.values(params))
  }
}

