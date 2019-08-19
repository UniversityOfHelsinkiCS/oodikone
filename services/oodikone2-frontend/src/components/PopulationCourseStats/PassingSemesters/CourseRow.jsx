import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Table } from 'semantic-ui-react'
import { number, shape, string, func, bool } from 'prop-types'
import { getTextIn } from '../../../common'
import '../populationCourseStats.css'

const getYearCount = (year, passingSemesters) => passingSemesters[`${year}-FALL`] + passingSemesters[`${year}-SPRING`]
const getCumulativeYearCount = (year, passingSemesters) => {
  if (passingSemesters[`${year}-FALL`] === passingSemesters[`${year}-SPRING`]) {
    return passingSemesters[`${year}-FALL`]
  }

  const diff = passingSemesters[`${year}-SPRING`] - passingSemesters[`${year}-FALL`]
  return passingSemesters[`${year}-FALL`] + diff
}

const renderYear = (year, passingSemesters) => (
  <Fragment>
    <Table.Cell>{passingSemesters[`${year}-FALL`] || ''}</Table.Cell>
    <Table.Cell>{passingSemesters[`${year}-SPRING`] || ''}</Table.Cell>
  </Fragment>
)

const renderCompactYear = (year, passingSemesters) => (
  <Fragment>
    <Table.Cell>{getYearCount(year, passingSemesters) || ''}</Table.Cell>
  </Fragment>
)

const renderCompactCumulativeYear = (year, passingSemesters) => (
  <Fragment>
    <Table.Cell>{getCumulativeYearCount(year, passingSemesters) || ''}</Table.Cell>
  </Fragment>
)

const renderStatistics = passingSemesters => (
  <Fragment>
    <Table.Cell>{passingSemesters.BEFORE || ''}</Table.Cell>
    {renderYear(0, passingSemesters)}
    {renderYear(1, passingSemesters)}
    {renderYear(2, passingSemesters)}
    {renderYear(3, passingSemesters)}
    {renderCompactYear(4, passingSemesters)}
    {renderCompactYear(5, passingSemesters)}
    <Table.Cell>{passingSemesters.LATER || ''}</Table.Cell>
  </Fragment>
)

const renderCumulativeStatistics = passingSemesters => (
  <Fragment>
    <Table.Cell>{passingSemesters.BEFORE || ''}</Table.Cell>
    {renderYear(0, passingSemesters)}
    {renderYear(1, passingSemesters)}
    {renderYear(2, passingSemesters)}
    {renderYear(3, passingSemesters)}
    {renderCompactCumulativeYear(4, passingSemesters)}
    {renderCompactCumulativeYear(5, passingSemesters)}
    <Table.Cell>{passingSemesters.LATER || ''}</Table.Cell>
  </Fragment>
)

const CourseRow = ({ statistics, cumulative, onCourseNameClickFn, isActiveCourseFn, activeLanguage }) => {
  const { stats, course } = statistics
  const passingSemesters = cumulative ? stats.passingSemestersCumulative : stats.passingSemesters
  const isActive = isActiveCourseFn(course)

  return (
    <Table.Row key={course.code} active={isActive}>
      <Table.Cell onClick={() => onCourseNameClickFn(course.code)} className="clickableCell">
        {getTextIn(course.name, activeLanguage)}
      </Table.Cell>
      <Table.Cell>
        {course.code}
      </Table.Cell>
      <Table.Cell>
        {stats.students}
      </Table.Cell>
      <Table.Cell>
        {stats.passed}
      </Table.Cell>

      {cumulative
        ? renderCumulativeStatistics(passingSemesters)
        : renderStatistics(passingSemesters)}
    </Table.Row>
  )
}

CourseRow.propTypes = {
  statistics: shape({
    course: shape({ code: string, name: shape({}) }),
    stats: shape({ students: number, passed: number, passingSemesters: shape({}), passingSemestersCumulative: shape({}) })
  }).isRequired,
  cumulative: bool.isRequired,
  onCourseNameClickFn: func.isRequired,
  isActiveCourseFn: func.isRequired,
  activeLanguage: string.isRequired
}

const mapStateToProps = ({ localize }) => ({
  activeLanguage: getActiveLanguage(localize).code
})

export default connect(mapStateToProps)(CourseRow)
