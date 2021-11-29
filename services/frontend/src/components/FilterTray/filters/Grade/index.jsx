import React from 'react'
import { Form, Checkbox } from 'semantic-ui-react'
import fp from 'lodash/fp'
import { getHighestGradeOfCourseBetweenRange } from '../../../../common'
import createFilter from '../createFilter'

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

export default (courseCodes, from, to) =>
  createFilter({
    key: 'Grade',

    defaultOptions: {
      selected: [],
    },

    isActive: ({ selected }) => selected.length > 0,

    precompute: [
      fp.flow(
        fp.map(student => [student.studentNumber, student.courses]),
        fp.filter(
          fp.flow(
            ([, courses]) => courses,
            fp.map('course_code'),
            courses => courseCodes.some(code => courses.includes(code))
          )
        ),
        fp.map(([sn, courses]) => [sn, getHighestGradeOfCourseBetweenRange(courses, from, to)]),
        fp.groupBy(([, { grade }]) => grade),
        fp.mapValues(fp.map(([sn]) => sn)),
        grades => ({ grades })
      ),
      [courseCodes, from, to],
    ],

    filter(student, { selected }, { grades }) {
      return selected.some(selectedGrade => grades[selectedGrade].includes(student.studentNumber))
    },

    render: (props, { grades }) => <GradeFilterCard {...props} grades={grades} />,

    actions: {
      selectGrade(state, grade) {
        state.selected = [grade]
      },
    },
  })
