import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'

import { getHighestGradeOfCourseBetweenRange } from '@/common'
import { FormattedStudent } from '@oodikone/shared/types'
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
  key: 'gradeFilter',

  title: 'Grade',

  defaultOptions: {
    selected: [],
  },

  isActive: ({ selected }) => selected.length > 0,

  precompute: ({ students, args }) => {
    return {
      grades: students
        .map(
          student =>
            [
              student.studentNumber,
              student.courses.filter((course: any) => args.courseCodes.includes(course.course_code)),
            ] as [string, FormattedStudent['courses']]
        )
        .map(([studentNumber, courses]) => [
          studentNumber,
          getHighestGradeOfCourseBetweenRange(courses, args.from, args.to),
        ])
        .filter(([_, grade]) => grade !== undefined)
        .reduce((acc, [studentNumber, grade]) => {
          acc[grade!] ??= []
          acc[grade!].push(studentNumber)
          return acc
        }, {}),
    }
  },

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
