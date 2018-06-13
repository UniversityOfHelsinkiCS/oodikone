import uuidv4 from 'uuid/v4'

export const creditsLessThan = credit =>
  ({
    id: uuidv4(),
    type: 'CreditsLessThan',
    params: {
      credit
    },
    filter: (student) => {
      const creditsOfStudent = student.courses
        .filter(c => c.passed)
        .reduce((s, c) => s + c.credits, 0)
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
      const creditsOfStudent = student.courses
        .filter(c => c.passed)
        .reduce((s, c) => s + c.credits, 0)
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
