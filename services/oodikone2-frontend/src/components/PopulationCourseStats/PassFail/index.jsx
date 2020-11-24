import React from 'react'
import { Table, Icon, Popup, Item } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { getTextIn } from '../../../common'
import FilterToggleIcon from '../../FilterToggleIcon'
import SortableHeaderCell from '../SortableHeaderCell'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import useCourseFilter from '../../FilterTray/filters/Courses/useCourseFilter'
import CollapsibleModuleTable from '../CollapsibleModuleTable'
import { useLanguage } from '../../../common/hooks'

const PassFail = ({ expandedGroups, toggleGroupExpansion }) => {
  const language = useLanguage()
  const { courseIsSelected } = useCourseFilter()
  const {
    onSortableColumnHeaderClick,
    filterInput,
    tableColumnNames,
    onGoToCourseStatisticsClick,
    onCourseNameCellClick,
    sortCriteria,
    reversed,
    modules
  } = UsePopulationCourseContext()
  const getSortableHeaderCell = (label, columnName, rowSpan = 1) => (
    <SortableHeaderCell
      content={label}
      columnName={columnName}
      onClickFn={onSortableColumnHeaderClick}
      activeSortColumn={sortCriteria}
      reversed={reversed}
      rowSpan={rowSpan}
    />
  )

  const getTableHeader = () => (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell colSpan="4" content="Course" />
        {getSortableHeaderCell('Students', tableColumnNames.STUDENTS, 2)}
        <Table.HeaderCell colSpan="3" content="Passed" />
        <Table.HeaderCell colSpan="2" content="Failed" />
        <Table.HeaderCell colSpan="2" content="Attempts" />
        <Table.HeaderCell colSpan="2" content="percentage of population" />
      </Table.Row>
      <Table.Row>
        {filterInput('nameFilter', 'Name', '3')}
        {filterInput('codeFilter', 'Code')}
        {getSortableHeaderCell('n', tableColumnNames.PASSED)}
        {getSortableHeaderCell('after retry', tableColumnNames.RETRY_PASSED)}
        {getSortableHeaderCell('percentage', tableColumnNames.PERCENTAGE)}
        {getSortableHeaderCell('n', tableColumnNames.FAILED)}
        {getSortableHeaderCell('many times', tableColumnNames.FAILED_MANY)}
        {getSortableHeaderCell('n', tableColumnNames.ATTEMPTS)}
        {getSortableHeaderCell('per student', tableColumnNames.PER_STUDENT)}
        {getSortableHeaderCell('Passed', tableColumnNames.PASSED_OF_POPULATION)}
        {getSortableHeaderCell('attempted', tableColumnNames.TRIED_OF_POPULATION)}
      </Table.Row>
    </Table.Header>
  )

  const getCourseRow = courseStats => {
    const { course, stats } = courseStats
    const { code, name } = course
    const {
      failed,
      passed,
      retryPassed,
      failedMany,
      attempts,
      percentage,
      perStudent,
      passedOfPopulation,
      triedOfPopulation
    } = stats
    const isActive = courseIsSelected(course.code)
    return (
      <Table.Row key={code} active={isActive} data-cy={name.fi}>
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
        <Table.Cell className="iconCell clickableCell">
          <p>
            <Item
              as={Link}
              to={`/coursestatistics?courseCodes=["${encodeURIComponent(
                code
              )}"]&separate=false&unifyOpenUniCourses=false`}
              data-cy={`coursestats-link-${code}`}
            >
              <Icon name="level up alternate" onClick={() => onGoToCourseStatisticsClick(code)} />
            </Item>
          </p>
        </Table.Cell>
        <Table.Cell content={code} />
        <Table.Cell content={passed + failed} />
        <Table.Cell content={passed} />
        <Table.Cell content={retryPassed} />
        <Table.Cell content={`${percentage.toFixed(2)} %`} />
        <Table.Cell content={failed} />
        <Table.Cell content={failedMany} />
        <Table.Cell content={attempts} />
        <Table.Cell content={perStudent.toFixed(2)} />
        <Table.Cell content={`${passedOfPopulation.toFixed(2)}  %`} />
        <Table.Cell content={`${triedOfPopulation.toFixed(2)}  %`} />
      </Table.Row>
    )
  }

  return (
    <Table className="fixed-header" celled sortable>
      {getTableHeader()}
      <Table.Body>
        <CollapsibleModuleTable
          emptyColSpan={12}
          modules={modules}
          expandedGroups={expandedGroups}
          toggleGroupExpansion={toggleGroupExpansion}
        >
          {courses => courses.map(getCourseRow)}
        </CollapsibleModuleTable>
      </Table.Body>
    </Table>
  )
}

export default PassFail
