import uuidv4 from 'uuid/v4'
import { getStudentTotalCredits, getStudentTotalCreditsFromMandatory } from '../common'

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
      (source === 'anywhere' || transfer.source.code === source) &&
        (target === 'anywhere' || transfer.target.code === target))
      .some(b => b === true)

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

export const transferTo = (params) => {
  const { negated } = params
  return ({
    id: uuidv4(),
    type: 'TransferToStudyrightFilter',
    params: { negated },
    filter: student => (negated ? student.transferredStudyright : !student.transferredStudyright)
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
  const { extentcode, graduated, complemented, studyright } = params
  return ({
    id: uuidv4(),
    type: 'ExtentGraduated',
    params: {
      extentcode,
      graduated,
      complemented,
      studyright
    },
    filter: (student) => {
      if (complemented === 'true' && graduated === 'either') {
        // jos koodi 7 eli exchange student
        const thisStudyright = student.studyrights
          .find(s => s.studyrightElements.map(e => e.code).includes(studyright))

        return !thisStudyright || thisStudyright.extentcode !== extentcode
      } else if (complemented === 'true' && graduated === 'grad') {
        return !student.studyrights.filter(sr =>
          sr.extentcode === extentcode && sr.graduated).map(sr =>
          sr.extentcode).includes(extentcode)
      } else if (complemented === 'false' && graduated === 'either') {
        return student.studyrights.map(sr => sr.extentcode).includes(extentcode)
      }
      return student.studyrights.filter(sr =>
        sr.extentcode === extentcode && sr.graduated).map(sr =>
        sr.extentcode).includes(extentcode)
    }
  })
}

export const courseParticipationNTimes = (params) => {
  const { amount, courses } = params
  return ({
    id: uuidv4(),
    type: 'CourseParticipationNTimes',
    params: {
      amount,
      courses
    },
    filter: student => student.courses
      .filter(cr => courses.includes(cr.course.code)).length < amount
  })
}

export const canceledStudyright = (params) => {
  const { studyrights, cancel } = params
  return ({
    id: uuidv4(),
    type: 'CanceledStudyright',
    params: {
      studyrights,
      cancel
    },
    filter: (student) => {
      if (cancel === 'true') {
        return student.studyrights.filter(sr =>
          sr.studyrightElements.some(e => studyrights.includes(e.code))).every(sr => sr.canceldate)
      }
      return !student.studyrights.filter(sr =>
        sr.studyrightElements.some(e => studyrights.includes(e.code))).every(sr => sr.canceldate)
    }
  })
}

export const creditsLessThanFromMandatory = (params) => {
  const { amount, courses } = params
  return ({
    id: uuidv4(),
    type: 'CreditsLessThanFromMandatory',
    params: {
      amount,
      courses
    },
    filter: student => amount > getStudentTotalCreditsFromMandatory(student, courses)
  })
}


export const priorityStudyright = (params) => {
  const { prioritycode, degree, programme } = params
  return ({
    id: uuidv4(),
    type: 'PriorityStudyright',
    params: {
      prioritycode,
      degree,
      programme
    },
    filter: student =>
      student.studyrights.some((sr) => {
        if (sr.prioritycode === prioritycode) {
          const elements = sr.studyrightElements.map(e => e.code)
          let bools = []
          if (degree) {
            bools = bools.concat(elements.includes(degree) || degree === 'anyDegree')
          }
          if (programme) {
            bools = bools.concat(elements.includes(programme) || programme === 'anyProgramme')
          }
          return bools.length > 0 ? bools.every(b => b === true) : false
        }
        return false
      })
  })
}

export const presetFilter = preset => ({
  id: preset.id,
  type: 'Preset',
  name: preset.name,
  description: preset.description,
  filters: preset.filters,
  filter: student => preset.filters.map(f => f.filter(student)).every(b => b === true)
})
const typeList = {
  CreditsLessThanFromMandatory: creditsLessThanFromMandatory,
  CreditsLessThan: creditsLessThan,
  CreditsAtLeast: creditsAtLeast,
  HasMatriculation: matriculationFilter,
  SexFilter: sexFilter,
  CourseParticipation: courseParticipation,
  StartingThisSemester: startingThisSemester,
  ExtentGraduated: extentGraduated,
  EnrollmentStatus: enrollmentStatus,
  TransferFilter: transferFilter,
  CourseParticipationNTimes: courseParticipationNTimes,
  CanceledStudyright: canceledStudyright,
  Preset: presetFilter,
  PriorityStudyright: priorityStudyright
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

