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

export const courseParticipation = (course, field) => ({
  id: uuidv4(),
  type: 'CourseParticipation',
  params: {
    course,
    field
  },
  studentsOfSelectedField: course.students[field],
  filter: student =>
    course.students[field][student.studentNumber] === true
})

// write a function to search for a filter with its type.
export const presetFilter = (preset) => {
  console.log(preset.filters)
  return ({
    id: uuidv4(),
    type: 'Preset',
    name: preset.name,
    filter: student => preset.filters.map(f => f.filter(student))
  })
}

