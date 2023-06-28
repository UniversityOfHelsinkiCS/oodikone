import React, { Fragment } from 'react'
import { Table, Popup } from 'semantic-ui-react'
import { number, shape, string, bool } from 'prop-types'
import FilterToggleIcon from '../../FilterToggleIcon'
import '../populationCourseStats.css'
import useFilters from '../../FilterView/useFilters'
import { isCourseSelected, toggleCourseSelection } from '../../FilterView/filters/courses'
import useLanguage from '../../LanguagePicker/useLanguage'

const getYearCount = (year, passingSemesters) => passingSemesters[`${year}-FALL`] + passingSemesters[`${year}-SPRING`]
const getCumulativeYearCount = (year, passingSemesters) => {
  if (passingSemesters[`${year}-FALL`] === passingSemesters[`${year}-SPRING`]) {
    return passingSemesters[`${year}-FALL`]
  }

  const diff = passingSemesters[`${year}-SPRING`] - passingSemesters[`${year}-FALL`]
  return passingSemesters[`${year}-FALL`] + diff
}

const renderYear = (year, passingSemesters) => (
  <>
    <Table.Cell>{passingSemesters[`${year}-FALL`] || ''}</Table.Cell>
    <Table.Cell>{passingSemesters[`${year}-SPRING`] || ''}</Table.Cell>
  </>
)

const renderCompactYear = (year, passingSemesters) => (
  <>
    <Table.Cell>{getYearCount(year, passingSemesters) || ''}</Table.Cell>
  </>
)

const renderCompactCumulativeYear = (year, passingSemesters) => (
  <>
    <Table.Cell>{getCumulativeYearCount(year, passingSemesters) || ''}</Table.Cell>
  </>
)

const renderStatistics = passingSemesters => (
  <>
    <Table.Cell>{passingSemesters.BEFORE || ''}</Table.Cell>
    {renderYear(0, passingSemesters)}
    {renderYear(1, passingSemesters)}
    {renderYear(2, passingSemesters)}
    {renderYear(3, passingSemesters)}
    {renderCompactYear(4, passingSemesters)}
    {renderCompactYear(5, passingSemesters)}
    <Table.Cell>{passingSemesters.LATER || ''}</Table.Cell>
  </>
)

const renderCumulativeStatistics = passingSemesters => (
  <>
    <Table.Cell>{passingSemesters.BEFORE || ''}</Table.Cell>
    {renderYear(0, passingSemesters)}
    {renderYear(1, passingSemesters)}
    {renderYear(2, passingSemesters)}
    {renderYear(3, passingSemesters)}
    {renderCompactCumulativeYear(4, passingSemesters)}
    {renderCompactCumulativeYear(5, passingSemesters)}
    <Table.Cell>{passingSemesters.LATER || ''}</Table.Cell>
  </>
)

const PassingSemesterRow = ({ statistics, cumulative }) => {
  const { getTextIn } = useLanguage()
  const { useFilterSelector, filterDispatch } = useFilters()

  const { stats, course } = statistics
  const passingSemesters = cumulative ? stats.passingSemestersCumulative : stats.passingSemesters

  const courseIsSelected = useFilterSelector(isCourseSelected(course.code))
  const isActive = courseIsSelected

  return (
    <Table.Row key={course.code} active={isActive}>
      <Popup
        trigger={
          <Table.Cell className="filterCell clickableCell">
            <FilterToggleIcon isActive={isActive} onClick={() => filterDispatch(toggleCourseSelection(course.code))} />
          </Table.Cell>
        }
        content={
          isActive ? (
            <span>
              Poista rajaus kurssin <b>{getTextIn(course.name)}</b> perusteella
            </span>
          ) : (
            <span>
              Rajaa opiskelijat kurssin <b>{getTextIn(course.name)}</b> perusteella
            </span>
          )
        }
        position="top right"
      />
      <Table.Cell colSpan="2" className="nameCell">
        {getTextIn(course.name)}
      </Table.Cell>
      <Table.Cell>{course.code}</Table.Cell>
      <Table.Cell>{stats.students}</Table.Cell>
      <Table.Cell>{stats.passed}</Table.Cell>

      {cumulative ? renderCumulativeStatistics(passingSemesters) : renderStatistics(passingSemesters)}
    </Table.Row>
  )
}

PassingSemesterRow.propTypes = {
  statistics: shape({
    course: shape({ code: string, name: shape({}) }),
    stats: shape({
      students: number,
      passed: number,
      passingSemesters: shape({}),
      passingSemestersCumulative: shape({}),
    }),
  }).isRequired,
  cumulative: bool.isRequired,
}

export default PassingSemesterRow
