import React from 'react'
import { Form, Checkbox } from 'semantic-ui-react'
import fp from 'lodash/fp'
import { getHighestGradeOrEnrollmentOfCourseBetweenRange } from '../../../common'
import createFilter from './createFilter'

export const contextKey = 'gradeFilter'

/**
 * Grade filter.
 * Only applicable to a single course.
 */
const GradeFilterCard = ({ options, onOptionsChange, grades, withoutSelf }) => {
  // const { addFilter, removeFilter, activeFilters } = useFilters()
  // const { value, setValue, grades } = useGradeFilter()
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
  const gradesWithoutSelf = fp.mapValues(
    fp.filter(sn => studentsWithoutSelf.find(s => s.studentNumber === sn) !== undefined)
  )(grades)

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

export default createFilter({
  key: 'Grade',

  defaultOptions: {
    selected: [],
  },

  isActive: ({ selected }) => selected.length > 0,

  precompute: ({ students, args }) =>
    fp.flow(
      fp.map(student => [
        student.studentNumber,
        fp.filter(course => args.courseCodes.includes(course.course_code))(student.courses),
        fp.filter(enrollment => args.courseCodes.includes(enrollment.course_code))(student.enrollments),
      ]),
      /* fp.filter(
      fp.flow(
        ([, courses]) => courses,
        fp.map('course_code'),
        courses => args.courseCodes.some(code => courses.includes(code))
      )
    ), */
      fp.map(([sn, courses, enrollments]) => [
        sn,
        getHighestGradeOrEnrollmentOfCourseBetweenRange(courses, enrollments, args.from, args.to),
      ]),
      fp.filter(([, grade]) => grade !== undefined),
      fp.groupBy(([, { grade }]) => grade),
      fp.mapValues(fp.map(([sn]) => sn)),
      grades => ({ grades })
    )(students),

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
