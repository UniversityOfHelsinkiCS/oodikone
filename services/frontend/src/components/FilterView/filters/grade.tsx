import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'
import fp from 'lodash/fp'

import { getHighestGradeOrEnrollmentOfCourseBetweenRange } from '@/common'
import { FilterTrayProps } from '../FilterTray'
import { createFilter } from './createFilter'

/**
 * Grade filter.
 * Only applicable to a single course.
 */
const GradeFilterCard = ({ options, onOptionsChange, precomputed }: FilterTrayProps) => {
  const { grades } = precomputed
  const { selected } = options
  const name = 'gradeFilter'

  // There are grades 1..5 (inclusive) and 'No grade'
  // Therefore this cannot be filtered by Number
  const choices = Object.keys(grades).sort((a, b) => +b - +a)

  const checked = grade => selected.includes(grade)

  const onChange = grade => () => {
    if (checked(grade)) {
      onOptionsChange({
        ...options,
        selected: selected.filter(value => value !== grade),
      })
    } else {
      onOptionsChange({
        ...options,
        selected: [...selected, grade],
      })
    }
  }

  return (
    <FormGroup>
      {choices.map(grade => (
        <FormControlLabel
          checked={checked(grade)}
          control={<Checkbox />}
          data-cy={`${name}-${grade}`}
          key={`${name}-${grade}`}
          label={
            <Typography component="span" variant="body1">{`${grade} (${grades[grade].length} students)`}</Typography>
          }
          onChange={onChange(grade)}
        />
      ))}
    </FormGroup>
  )
}

export const gradeFilter = createFilter({
  key: 'Grade',

  title: 'Grade',

  defaultOptions: {
    selected: [],
  },

  isActive: ({ selected }) => selected.length > 0,

  precompute: ({ students, args }) =>
    fp.flow(
      fp.map((student: any) => [
        student.studentNumber,
        fp.filter((course: any) => args.courseCodes.includes(course.course_code))(student.courses),
        fp.filter((enrollment: any) => args.courseCodes.includes(enrollment.course_code))(student.enrollments),
      ]),
      /* fp.filter(
      fp.flow(
        ([, courses]) => courses,
        fp.map('course_code'),
        courses => args.courseCodes.some(code => courses.includes(code))
      )
    ), */
      fp.map(([studentNumber, courses, enrollments]) => [
        studentNumber,
        getHighestGradeOrEnrollmentOfCourseBetweenRange(courses, enrollments, args.from, args.to),
      ]),
      fp.filter(([, grade]) => grade !== undefined),
      fp.groupBy(([, { grade }]) => grade),
      fp.mapValues(fp.map(([studentNumber]) => studentNumber)),
      grades => ({ grades })
    )(students),

  filter(student, { precomputed, options }) {
    const { selected } = options

    return selected.some(selectedGrade => precomputed.grades[selectedGrade].includes(student.studentNumber))
  },

  render: GradeFilterCard,

  selectors: {
    isGradeSelected: ({ selected }, grade) => {
      return selected.includes(grade)
    },
  },

  actions: {
    selectGrade(options, grade) {
      if (options.selected.indexOf(grade) === -1) {
        options.selected.push(grade)
      }

      return options
    },

    unselectGrade(options, grade) {
      const index = options.selected.indexOf(grade)

      if (index !== -1) {
        options.selected.splice(index, 1)
      }

      return options
    },
  },
})
