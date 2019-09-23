import uuidv4 from 'uuid/v4'
import {
  getStudentTotalCredits,
  getStudentTotalCreditsFromMandatory,
  getStudentGradeMean,
  getNewestProgramme
} from '../common'

export const creditsLessThan = params => {
  const { credit } = params

  return {
    id: uuidv4(),
    type: 'CreditsLessThan',
    params: {
      credit
    },
    filter: student => {
      const creditsOfStudent = getStudentTotalCredits(student)
      return credit > creditsOfStudent
    }
  }
}
export const sexFilter = params => {
  const { gender } = params
  return {
    id: uuidv4(),
    type: 'SexFilter',
    params: {
      gender
    },
    filter: student => student.gender_code === gender
  }
}
export const matriculationFilter = params => {
  const { matriculationexamination } = params
  return {
    id: uuidv4(),
    type: 'HasMatriculation',
    params: {
      matriculationexamination
    },
    filter: student => student.matriculationexamination === matriculationexamination
  }
}
export const creditsAtLeast = params => {
  const { credit } = params
  return {
    id: uuidv4(),
    type: 'CreditsAtLeast',
    params: {
      credit
    },
    filter: student => {
      const creditsOfStudent = getStudentTotalCredits(student)
      return credit <= creditsOfStudent
    }
  }
}
export const enrollmentStatus = params => {
  const { semesters, enrolled } = params
  return {
    id: uuidv4(),
    type: 'EnrollmentStatus',
    params: {
      semesters,
      enrolled
    },
    filter: student =>
      student.semesterenrollments
        .filter(({ semestercode }) => semesters.includes(semestercode))
        .map(({ enrollmenttype }) => enrollmenttype === enrolled)
        .every(b => b === true)
  }
}

export const transferFilter = params => {
  const { source, target } = params
  return {
    id: uuidv4(),
    type: 'TransferFilter',
    params: {
      source,
      target
    },
    filter: student =>
      student.transfers
        .map(
          transfer =>
            (source === 'anywhere' || transfer.source.code === source) &&
            (target === 'anywhere' || transfer.target.code === target)
        )
        .some(b => b === true)
  }
}

export const startingThisSemester = params => {
  const { starting } = params
  return {
    id: uuidv4(),
    type: 'StartingThisSemester',
    params: {
      starting
    },
    filter: student => student.starting === starting
  }
}

export const transferTo = params => {
  const { negated } = params
  return {
    id: uuidv4(),
    type: 'TransferToStudyrightFilter',
    params: { negated },
    filter: student => (negated ? student.transferredStudyright : !student.transferredStudyright)
  }
}

export const courseParticipation = ({ field, course = {} }) => ({
  id: uuidv4(),
  type: 'CourseParticipation',
  params: {
    field,
    course
  },
  studentsOfSelectedField: course.students ? course.students[field] : {},
  filter: student => (course.students ? course.students[field][student.studentNumber] === true : false)
})

export const extentGraduated = params => {
  const { code, graduated, complemented, isExtent, studyright, simple } = params
  return {
    id: uuidv4(),
    type: simple ? 'SimpleExtentGraduated' : 'ExtentGraduated',
    params: {
      code,
      graduated,
      complemented,
      studyright,
      isExtent,
      simple
    },
    filter: student => {
      if (isExtent) {
        if (complemented === 'true' && graduated === 'either') {
          // jos koodi 7 eli exchange student
          const thisStudyright = student.studyrights.find(s =>
            s.studyrightElements.map(e => e.code).includes(studyright)
          )

          return !thisStudyright || thisStudyright.extentcode !== code
        }
        if (complemented === 'true' && graduated === 'grad') {
          return !student.studyrights
            .filter(sr => sr.extentcode === code && sr.graduated)
            .map(sr => sr.extentcode)
            .includes(code)
        }
        if (complemented === 'false' && graduated === 'either') {
          return student.studyrights.map(sr => sr.extentcode).includes(code)
        }
        return student.studyrights
          .filter(sr => sr.extentcode === code && sr.graduated)
          .map(sr => sr.extentcode)
          .includes(code)
      }
      const foundStudyRight = student.studyrights.find(s => s.studyrightElements.map(e => e.code).includes(code))
      const returnable = graduated !== 'grad' ? !!foundStudyRight : foundStudyRight && foundStudyRight.graduated
      return complemented === 'true' ? !returnable : returnable
    }
  }
}

export const courseParticipationNTimes = params => {
  const { amount, courses } = params
  return {
    id: uuidv4(),
    type: 'CourseParticipationNTimes',
    params: {
      amount,
      courses
    },
    filter: student => student.courses.filter(cr => courses.includes(cr.course.code)).length < amount
  }
}

export const canceledStudyright = params => {
  const { studyrights, cancel } = params
  return {
    id: uuidv4(),
    type: 'CanceledStudyright',
    params: {
      studyrights,
      cancel
    },
    filter: student => {
      if (cancel === 'true') {
        return student.studyrights
          .filter(sr => sr.studyrightElements.some(e => Object.values(studyrights).includes(e.code)))
          .every(sr => sr.canceldate)
      }
      return !student.studyrights
        .filter(sr => sr.studyrightElements.some(e => Object.values(studyrights).includes(e.code)))
        .every(sr => sr.canceldate)
    }
  }
}

export const creditsLessThanFromMandatory = params => {
  const { amount, courses } = params
  return {
    id: uuidv4(),
    type: 'CreditsLessThanFromMandatory',
    params: {
      amount,
      courses
    },
    filter: student => amount > getStudentTotalCreditsFromMandatory(student, courses)
  }
}

export const priorityStudyright = params => {
  const { prioritycode, degree, programme } = params
  return {
    id: uuidv4(),
    type: 'PriorityStudyright',
    params: {
      prioritycode,
      degree,
      programme
    },
    filter: student =>
      student.studyrights.some(sr => {
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
  }
}

export const gradeMeanFilter = params => {
  const { gradeMean, comparator } = params
  return {
    id: uuidv4(),
    type: 'GradeMeanFilter',
    params: {
      gradeMean,
      comparator
    },
    filter: student => {
      const gradeMeanOfStudent = getStudentGradeMean(student)
      if (comparator === 'less') {
        return gradeMean > gradeMeanOfStudent
      }
      return gradeMean <= gradeMeanOfStudent
    }
  }
}

export const tagFilter = params => {
  const { text, value } = params.tag
  const { comp } = params
  return {
    id: uuidv4(),
    type: 'TagFilter',
    params: {
      text,
      comp
    },
    filter: student => {
      const studentTagIds = student.tags.map(t => t.tag.tag_id)
      if (comp === 'true') {
        return studentTagIds.includes(value)
      }
      return !studentTagIds.includes(value)
    }
  }
}

export const gradeFilter = params => {
  const { coursecodes, grade, coursename } = params
  return {
    id: uuidv4(),
    type: 'GradeFilter',
    params: {
      coursecodes,
      grade,
      coursename
    },
    filter: student => {
      const courses = student.courses.filter(c => coursecodes.includes(c.course.code))
      const newestCourse = courses.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      return newestCourse.grade === grade
    }
  }
}

export const courseCreditFilter = params => {
  const { coursecodes, credits, coursename } = params
  return {
    id: uuidv4(),
    type: 'CourseCreditFilter',
    params: {
      coursecodes,
      credits,
      coursename
    },
    filter: student => {
      const course = student.courses.find(c => coursecodes.includes(c.course.code))
      return Number(course.credits) === Number(credits)
    }
  }
}

export const programmeFilter = params => {
  const { programme, programmeName } = params
  return {
    id: uuidv4(),
    type: 'ProgrammeFilter',
    params: {
      programme,
      programmeName
    },
    filter: student => {
      const studentStudyrightCode = getNewestProgramme(student.studyrights)
      return studentStudyrightCode.code === programme
    }
  }
}

export const creditsBeforeStudyright = params => {
  const { credit } = params
  return {
    id: uuidv4(),
    type: 'CreditsBeforeStudyright',
    params: {
      credit
    },
    filter: student => {
      const credits = getStudentTotalCredits(student)
      return student.credits - credits > credit
    }
  }
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
  GradeMeanFilter: gradeMeanFilter,
  CourseParticipation: courseParticipation,
  StartingThisSemester: startingThisSemester,
  ExtentGraduated: extentGraduated,
  SimpleExtentGraduated: extentGraduated,
  EnrollmentStatus: enrollmentStatus,
  TransferFilter: transferFilter,
  CourseParticipationNTimes: courseParticipationNTimes,
  CanceledStudyright: canceledStudyright,
  Preset: presetFilter,
  TransferToStudyrightFilter: transferTo,
  PriorityStudyright: priorityStudyright,
  TagFilter: tagFilter,
  CreditsBeforeStudyright: creditsBeforeStudyright
}
export const getFilterFunction = (type, params, populationCourses) => {
  switch (type) {
    case 'CourseParticipation':
      return courseParticipation({
        field: params.field,
        course: populationCourses.coursestatistics.find(c => c.course.code === params.course.course.code)
      })
    default:
      return typeList[type](params)
  }
}
