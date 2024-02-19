import React from 'react'
import { Form, Checkbox } from 'semantic-ui-react'
import * as _ from 'lodash-es'
import { getHighestGradeOrEnrollmentOfCourseBetweenRange } from '../../../common'
import { createFilter } from './createFilter'

/**
 * Grade filter.
 * Only applicable to a single course.
 */
const GradeFilterCard = ({ options, onOptionsChange, grades, withoutSelf }) => {
  const { selected } = options
  const name = 'gradeFilter'

  const choices = Object.keys(grades).sort((a, b) => b - a)

  const checked = grade => selected.includes(grade)

  const onChange = grade => () => {
    if (checked(grade)) {
      onOptionsChange({
        ...options,
        selected: selected.filter(val => val !== grade),
      })
    } else {
      onOptionsChange({
        ...options,
        selected: [...selected, grade],
      })
    }
  }

  const studentsWithoutSelf = withoutSelf()
  const gradesWithoutSelf = _.mapValues(grades, studentNumbers =>
    studentNumbers.filter(sn => studentsWithoutSelf.some(student => student.studentNumber === sn))
  )

  return (
    <div className="card-content">
      <Form>
        {choices.map(grade => (
          <Form.Field key={`${name}-${grade}`}>
            <Checkbox
              label={
                <label data-cy={`${name}-${grade}`}>
                  {grade}
                  <span className="filter-option-count">{` (${gradesWithoutSelf[grade].length} students)`}</span>
                </label>
              }
              checked={checked(grade)}
              onChange={onChange(grade)}
            />
          </Form.Field>
        ))}
      </Form>
    </div>
  )
}

export const gradeFilter = createFilter({
  key: 'Grade',

  defaultOptions: {
    selected: [],
  },

  isActive: ({ selected }) => selected.length > 0,

  precompute: ({ students, args }) => {
    const result = _.chain(students)
      .map(student => [
        student.studentNumber,
        _.filter(student.courses, course => args.courseCodes.includes(course.course_code)),
        _.filter(student.enrollments, enrollment => args.courseCodes.includes(enrollment.course_code)),
      ])
      .map(([studentNumber, courses, enrollments]) => [
        studentNumber,
        getHighestGradeOrEnrollmentOfCourseBetweenRange(courses, enrollments, args.from, args.to),
      ])
      .filter(([, grade]) => grade !== undefined)
      .groupBy(([, { grade }]) => grade)
      .mapValues(studentsWithGrades => studentsWithGrades.map(([studentNumber]) => studentNumber))
      .value()

    return { grades: result }
  },

  filter(student, { selected }, { precomputed }) {
    return selected.some(selectedGrade => precomputed.grades[selectedGrade].includes(student.studentNumber))
  },

  render: (props, { precomputed }) => <GradeFilterCard {...props} grades={precomputed.grades} />,

  selectors: {
    isGradeSelected: ({ selected }, grade) => {
      return selected.includes(grade)
    },
  },

  actions: {
    selectGrade(state, grade) {
      if (state.selected.indexOf(grade) === -1) {
        state.selected.push(grade)
      }
    },

    unselectGrade(state, grade) {
      const index = state.selected.indexOf(grade)

      if (index !== -1) {
        state.selected.splice(index, 1)
      }
    },
  },
})
