import React from 'react'
import { Table, Popup, Item, Icon } from 'semantic-ui-react'
import { replace, sortBy, omit } from 'lodash'
import { Link } from 'react-router-dom'
import { shape, string, number, arrayOf } from 'prop-types'
import { getTextIn } from '../../../common'
import FilterToggleIcon from '../../FilterToggleIcon'
import useFilters from '../../FilterView/useFilters'
import { isCourseSelected, toggleCourseSelection } from '../../FilterView/filters/courses'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import { useLanguage } from '../../../common/hooks'

const formatGradeDistribution = grades =>
  replace(
    JSON.stringify(
      sortBy(
        Object.entries(grades).map(([key, value]) => ({ [key]: value.count })),
        o => -Object.keys(o)
      ),
      null,
      1
    ),
    /\[\n|{\n*|{\s|}|\s*}|]|"|,/g,
    ''
  )

const CourseRow = ({ courseStatistics, gradeTypes }) => {
  const language = useLanguage()
  const { useFilterSelector, filterDispatch } = useFilters()

  const { onGoToCourseStatisticsClick } = UsePopulationCourseContext()

  const { course, grades } = courseStatistics
  const { name, code } = course

  const isActive = useFilterSelector(isCourseSelected(course.code))
  let attempts = 0
  let failedGrades = 0
  let otherPassed = 0

  if (grades) {
    const countSumReducer = (acc, cur) => acc + cur.count
    const gradeValues = grades ? Object.values(grades) : null
    attempts = gradeValues.reduce(countSumReducer, 0)
    failedGrades = gradeValues.filter(g => g.status.failingGrade).reduce(countSumReducer, 0)
    otherPassed = Object.values(omit(grades, gradeTypes))
      .filter(g => g.status.passingGrade || g.status.improvedGrade)
      .reduce(countSumReducer, 0)
  }
  return (
    <Table.Row active={isActive}>
      <Popup
        trigger={
          <Table.Cell className="filterCell clickableCell">
            <FilterToggleIcon isActive={isActive} onClick={() => filterDispatch(toggleCourseSelection(course.code))} />
          </Table.Cell>
        }
        content={
          isActive ? (
            <span>
              Poista rajaus kurssin <b>{getTextIn(name, language)}</b> perusteella
            </span>
          ) : (
            <span>
              Rajaa opiskelijat kurssin <b>{getTextIn(name, language)}</b> perusteella
            </span>
          )
        }
        position="top right"
      />
      <Table.Cell content={getTextIn(name, language)} className="nameCell" />
      <Table.Cell className="iconCell">
        <p>
          <Item
            as={Link}
            to={`/coursestatistics?courseCodes=["${encodeURIComponent(
              code
            )}"]&separate=false&unifyOpenUniCourses=false`}
          >
            <Icon name="level up alternate" onClick={() => onGoToCourseStatisticsClick(code)} />
          </Item>
        </p>
      </Table.Cell>
      <Table.Cell content={code} />
      <Table.Cell content={attempts} />
      <Table.Cell content={failedGrades} />
      {gradeTypes.map(g => (
        <Table.Cell content={grades[g] ? grades[g].count || 0 : 0} key={code + g} />
      ))}
      <Table.Cell content={otherPassed} />
    </Table.Row>
  )
}

const GradeDistributionRow = ({ courseStatistics, gradeTypes }) => {
  const { course, grades } = courseStatistics
  const { code } = course
  return (
    <Popup
      key={code}
      flowing
      hoverable
      inverted
      position="top right"
      hideOnScroll
      content={grades ? <pre>{formatGradeDistribution(grades)}</pre> : 'Nothing to see here'}
      trigger={<CourseRow courseStatistics={courseStatistics} gradeTypes={gradeTypes} />}
    />
  )
}

CourseRow.propTypes = {
  courseStatistics: shape({ course: shape({ code: string }) }).isRequired,
  gradeTypes: arrayOf(number).isRequired,
}

GradeDistributionRow.propTypes = {
  courseStatistics: shape({ course: shape({ code: string }) }).isRequired,
  gradeTypes: arrayOf(number).isRequired,
}

export default GradeDistributionRow
