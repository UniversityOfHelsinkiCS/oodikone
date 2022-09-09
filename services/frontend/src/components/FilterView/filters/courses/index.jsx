import React from 'react'
import produce from 'immer'
import _ from 'lodash'
import { Dropdown } from 'semantic-ui-react'
import CourseCard from './CourseCard'
import { getTextIn } from '../../../../common'
import { FilterType } from './filterType'
import './courseFilter.css'
import createFilter from '../createFilter'
import useLanguage from '../../../LanguagePicker/useLanguage'

export const contextKey = 'coursesFilter'

const CourseFilterCard = ({ courseStats, options, onOptionsChange }) => {
  const { courseFilters } = options
  const { language } = useLanguage()
  const name = 'course-filter-card'

  // Wrestle course stats into something semantic-ui eats without throwing up.
  const makeLabel = cs => `${cs.course.code} - ${getTextIn(cs.course.name, language)}`
  const dropdownOptions = Object.values(courseStats)
    // .filter(cs => cs.stats.students > Math.round(filteredStudents.length * 0.3))
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

  const onChange = (_, { value }) => { // eslint-disable-line
    setCourseFilter(value[0], FilterType.ALL)
  }

  return (
    <>
      <Dropdown
        options={dropdownOptions}
        placeholder="Select Course"
        selection
        className="mini course-filter-selection"
        fluid
        button
        value={[]}
        onChange={onChange}
        multiple
        closeOnChange
        search
        name={name}
        data-cy="courseFilter-course-dropdown"
      />
      {Object.entries(courseFilters).map(([code]) => (
        <CourseCard
          course={courseStats[code]}
          filterType={courseFilters[code] ?? FilterType.ALL}
          onChange={type => setCourseFilter(code, type)}
          key={`course-filter-selected-course-${code}`}
        />
      ))}
    </>
  )
}

const createFilterFunc =
  (key, invert = false) =>
  ({ studentNumber }, { students }) =>
    Object.keys(students[key]).includes(studentNumber) !== invert

const filterFunctions = {
  [FilterType.ALL]: createFilterFunc('all'),
  [FilterType.PASSED]: createFilterFunc('passed'),
  [FilterType.PASSED_AFTER_FAILURE]: createFilterFunc('retryPassed'),
  [FilterType.FAILED]: createFilterFunc('failed'),
  [FilterType.FAILED_MANY_TIMES]: createFilterFunc('failedMany'),
  [FilterType.DID_NOT_PASS]: createFilterFunc('didNotPass'),
  // [FilterType.NOT_PARTICIPATED]: createFilterFunc('all', true),
  // [FilterType.DID_NOT_PASS]: ({ studentNumber }, { students }) =>
  //   !Object.keys(students.all).includes(studentNumber) || Object.keys(students.failed).includes(studentNumber),
}

const filter = createFilter({
  key: 'Courses',

  defaultOptions: {
    courseFilters: {},
  },

  precompute: ({ args }) => _.keyBy(args.courses, 'course.code'),

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

export default filter

export const { isCourseSelected } = filter.selectors

export const { toggleCourseSelection } = filter.actions
