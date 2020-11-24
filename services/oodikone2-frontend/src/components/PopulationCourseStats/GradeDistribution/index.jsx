import React, { useState } from 'react'
import { Table, Popup, Item, Icon } from 'semantic-ui-react'
import { replace, sortBy, omit } from 'lodash'
import { Link } from 'react-router-dom'
import { shape, string } from 'prop-types'
import { useSelector } from 'react-redux'
import { getTextIn } from '../../../common'
import FilterToggleIcon from '../../FilterToggleIcon'
import SortableHeaderCell from '../SortableHeaderCell'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import useCourseFilter from '../../FilterTray/filters/Courses/useCourseFilter'
import { useLanguage } from '../../../common/hooks'

const gradeTypes = [1, 2, 3, 4, 5]

const formatGradeDistribution = grades =>
  replace(
    JSON.stringify(
      sortBy(Object.entries(grades).map(([key, value]) => ({ [key]: value.count })), o => -Object.keys(o)),
      null,
      1
    ),
    /\[\n|{\n*|{\s|}|\s*}|]|"|,/g,
    ''
  )

const CourseRow = ({ courseStatistics }) => {
  const language = useLanguage()
  const { courseIsSelected } = useCourseFilter()

  const { onCourseNameCellClick, onGoToCourseStatisticsClick } = UsePopulationCourseContext()

  const { course, grades } = courseStatistics
  const { name, code } = course

  const isActive = courseIsSelected(course.code)
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
            <FilterToggleIcon isActive={isActive} onClick={() => onCourseNameCellClick(code)} />
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

const CoursePopUpRow = ({ courseStatistics }) => {
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
      trigger={<CourseRow courseStatistics={courseStatistics} />}
    />
  )
}

const GradeDistribution = ({ expandedGroups, toggleGroupExpansion }) => {
  const {
    courseStatistics,
    modules,
    onSortableColumnHeaderClick,
    filterInput,
    reversed,
    sortCriteria,
    tableColumnNames
  } = UsePopulationCourseContext()

  const { language } = useSelector(({ settings }) => settings)

  return (
    <Table celled sortable className="fixed-header">
      <Table.Header>
        <Table.Row>
          {filterInput('nameFilter', 'Name', '3')}
          {filterInput('codeFilter', 'Code')}

          <SortableHeaderCell
            content="Attempts"
            columnName={tableColumnNames.STUDENTS}
            onClickFn={onSortableColumnHeaderClick}
            activeSortColumn={sortCriteria}
            reversed={reversed}
          />

          <Table.HeaderCell>0</Table.HeaderCell>
          {gradeTypes.map(g => (
            <Table.HeaderCell content={g} key={g} />
          ))}
          <Table.HeaderCell content="Other passed" />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {modules.map(({ module, courses }) => (
          <React.Fragment key={module.code}>
            <Table.Row>
              <Table.Cell style={{ cursor: 'pointer' }} colSpan="3" onClick={() => toggleGroupExpansion(module.code)}>
                <Icon name={expandedGroups.has(module.code) ? 'angle down' : 'angle right'} />
                <b>{getTextIn(module.name, language)}</b>
              </Table.Cell>
              <Table.Cell>
                <b>{module.code}</b>
              </Table.Cell>
              <Table.Cell colSpan="8" />
            </Table.Row>
            {expandedGroups.has(module.code) &&
              courses.map(course => <CoursePopUpRow key={course.course.code} courseStatistics={course} />)}
          </React.Fragment>
        ))}
      </Table.Body>
    </Table>
  )
}

CourseRow.propTypes = {
  courseStatistics: shape({ course: shape({ code: string }) }).isRequired
}

CoursePopUpRow.propTypes = {
  courseStatistics: shape({ course: shape({ code: string }) }).isRequired
}

export default GradeDistribution
