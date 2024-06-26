import { produce } from 'immer'
import { keyBy } from 'lodash'
import { Dropdown } from 'semantic-ui-react'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from '../createFilter'
import { CourseCard } from './CourseCard'
import { FilterType } from './filterType'

const CourseFilterCard = ({ courseStats, options, onOptionsChange }) => {
  const { courseFilters } = options
  const { getTextIn } = useLanguage()
  const name = 'course-filter-card'
  // Wrestle course stats into something semantic-ui eats without throwing up.
  const makeLabel = cs => `${cs.course.code} - ${getTextIn(cs.course.name)}`
  const dropdownOptions = Object.values(courseStats)
    .filter(cs => !courseFilters[cs.course.code])
    .sort((a, b) => makeLabel(a).localeCompare(makeLabel(b)))
    .map(cs => ({
      key: `course-filter-option-${cs.course.code}`,
      text: makeLabel(cs),
      value: cs.course.code,
    }))

  const setCourseFilter = (code, type) =>
    onOptionsChange(
      produce(options, draft => {
        if (type === null) {
          delete draft.courseFilters[code]
        } else {
          draft.courseFilters[code] = type
        }
      })
    )

  const onChange = (_, { value }) => {
    setCourseFilter(value[0], FilterType.ALL)
  }

  return (
    <>
      <Dropdown
        button
        className="mini course-filter-selection"
        closeOnChange
        data-cy="courseFilter-course-dropdown"
        fluid
        multiple
        name={name}
        onChange={onChange}
        options={dropdownOptions}
        placeholder="Select course"
        search
        selection
        value={[]}
      />
      {Object.entries(courseFilters).map(([code]) => (
        <CourseCard
          course={courseStats[code]}
          filterType={courseFilters[code] ?? FilterType.ALL}
          key={`course-filter-selected-course-${code}`}
          onChange={type => setCourseFilter(code, type)}
        />
      ))}
    </>
  )
}

const createFilterFunc =
  key =>
  ({ studentNumber }, { students }) => {
    return Object.keys(students[key]).includes(studentNumber)
  }

const filterFunctions = {
  [FilterType.ALL]: createFilterFunc('all'),
  [FilterType.PASSED]: createFilterFunc('passed'),
  [FilterType.FAILED]: createFilterFunc('failed'),
  [FilterType.ENROLLED_NO_GRADE]: createFilterFunc('enrolledNoGrade'),
}

export const courseFilter = createFilter({
  key: 'Courses',

  defaultOptions: {
    courseFilters: {},
  },

  precompute: ({ args }) => keyBy(args.courses, 'course.code'),

  isActive: ({ courseFilters }) => Object.entries(courseFilters).length > 0,

  filter(student, { courseFilters }, { precomputed: courseMap }) {
    return Object.entries(courseFilters).reduce((result, [code, filterType]) => {
      const stats = courseMap[code]
      if (!stats) return false
      return result && filterFunctions[filterType](student, stats)
    }, true)
  },

  render: (props, { precomputed }) => <CourseFilterCard {...props} courseStats={precomputed} />,

  selectors: {
    isCourseSelected: ({ courseFilters }, course) => !!courseFilters[course],
  },

  actions: {
    toggleCourseSelection: (options, code) => {
      if (!options.courseFilters[code]) {
        options.courseFilters[code] = FilterType.ALL
      } else {
        delete options.courseFilters[code]
      }
    },
  },
})

export const { isCourseSelected } = courseFilter.selectors

export const { toggleCourseSelection } = courseFilter.actions
