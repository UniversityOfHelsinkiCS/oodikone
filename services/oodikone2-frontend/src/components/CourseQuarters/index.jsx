import React from 'react'
import { jStat } from 'jStat'
import { sortBy } from 'lodash'
import { func, arrayOf, object } from 'prop-types'

import SearchResultTable from '../SearchResultTable'
import { getStudentTotalCredits } from '../../common'

const getStudentSampleInSplitQuarters = (students) => {
  const sortedStudents = sortBy(students, student => getStudentTotalCredits(student))
  const quarterSize = Math.floor(sortedStudents.length / 4)
  return [
    sortedStudents.slice(0, quarterSize),
    sortedStudents.slice(quarterSize, quarterSize * 2),
    sortedStudents.slice(quarterSize * 2, quarterSize * 3),
    sortedStudents.slice(quarterSize * 3, sortedStudents.length)
  ]
}

const getValues = (students) => {
  const creditsList = students.map(student => getStudentTotalCredits(student))

  const n2z = value => (isNaN(value) ? 0 : value) // eslint-disable-line

  return {
    n: creditsList.length,
    min: n2z(jStat.min(creditsList)),
    max: n2z(jStat.max(creditsList)),
    average: n2z(jStat.mean(creditsList)).toFixed(2),
    median: n2z(jStat.median(creditsList)),
    standardDeviation: n2z(jStat.stdev(creditsList)).toFixed(2)
  }
}

const getCreditStatsForTable = (students, studentsInQuarters) =>
  [getValues(students), ...studentsInQuarters.map(s => getValues(s))]

const CourseQuarters = (props) => {
  const { translate, sample } = props

  const quarters = getStudentSampleInSplitQuarters(sample)
  const stats = getCreditStatsForTable(sample, quarters)

  const headers = [
    '',
    `all (n=${stats[0].n})`,
    `q1, bottom (n=${stats[1].n})`,
    `q2 (n=${stats[2].n})`,
    `q3 (n=${stats[3].n})`,
    `q4, top (n=${stats[3].n})`
  ]

  const rows = [
    ['n', ...stats.map(stat => stat.n)],
    ['min', ...stats.map(stat => stat.min)],
    ['max', ...stats.map(stat => stat.max)],
    ['average', ...stats.map(stat => stat.average)],
    ['median', ...stats.map(stat => stat.median)],
    ['standardDeviation', ...stats.map(stat => stat.standardDeviation)]
  ]

  return (
    <SearchResultTable
      headers={headers}
      rows={rows}
      noResultText={translate('common.noResults')}
      definition
    />
  )
}

CourseQuarters.propTypes = {
  translate: func.isRequired,
  sample: arrayOf(object).isRequired
}

export default CourseQuarters
