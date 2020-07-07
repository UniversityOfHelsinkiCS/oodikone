import React from 'react'
import { Table, Icon, Popup, Item } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { getTextIn } from '../../../common'
import FilterToggleIcon from '../../FilterToggleIcon'
import SortableHeaderCell from '../SortableHeaderCell'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import useCourseFilter from '../../FilterTray/filters/Courses/useCourseFilter'
import useFeatureToggle from '../../../common/useFeatureToggle'
import CollapsibleModuleTable from '../CollapsibleModuleTable'
import { useLanguage } from '../../../common/hooks'

const PassFail = () => {
  const language = useLanguage()
  const [filterFeatToggle] = useFeatureToggle('filterFeatToggle')
  const [mandatoryToggle] = useFeatureToggle('mandatoryToggle')
  const { courseIsSelected } = useCourseFilter()
  const {
    courseStatistics,
    onSortableColumnHeaderClick,
    filterInput,
    tableColumnNames,
    isActiveCourse,
    onGoToCourseStatisticsClick,
    onCourseNameCellClick,
    sortCriteria,
    reversed,
    translate,
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
        <Table.HeaderCell colSpan="4" content={translate('populationCourses.course')} />
        {getSortableHeaderCell(translate('populationCourses.students'), tableColumnNames.STUDENTS, 2)}
        <Table.HeaderCell colSpan="3" content={translate('populationCourses.passed')} />
        <Table.HeaderCell colSpan="2" content={translate('populationCourses.failed')} />
        <Table.HeaderCell colSpan="2" content={translate('populationCourses.attempts')} />
        <Table.HeaderCell colSpan="2" content={translate('populationCourses.percentageOfPopulation')} />
      </Table.Row>
      <Table.Row>
        {filterInput('nameFilter', 'populationCourses.name', '3')}
        {filterInput('codeFilter', 'populationCourses.code')}
        {getSortableHeaderCell(translate('populationCourses.number'), tableColumnNames.PASSED)}
        {getSortableHeaderCell(translate('populationCourses.passedAfterRetry'), tableColumnNames.RETRY_PASSED)}
        {getSortableHeaderCell(translate('populationCourses.percentage'), tableColumnNames.PERCENTAGE)}
        {getSortableHeaderCell(translate('populationCourses.number'), tableColumnNames.FAILED)}
        {getSortableHeaderCell(translate('populationCourses.failedManyTimes'), tableColumnNames.FAILED_MANY)}
        {getSortableHeaderCell(translate('populationCourses.number'), tableColumnNames.ATTEMPTS)}
        {getSortableHeaderCell(translate('populationCourses.perStudent'), tableColumnNames.PER_STUDENT)}
        {getSortableHeaderCell(translate('populationCourses.passed'), tableColumnNames.PASSED_OF_POPULATION)}
        {getSortableHeaderCell(translate('populationCourses.attempted'), tableColumnNames.TRIED_OF_POPULATION)}
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
    const isActive = filterFeatToggle ? courseIsSelected(course.code) : isActiveCourse(course)
    return (
      <Table.Row key={code} active={isActive}>
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
        {mandatoryToggle ? (
          <CollapsibleModuleTable modules={modules}>{courses => courses.map(getCourseRow)}</CollapsibleModuleTable>
        ) : (
          courseStatistics.map(getCourseRow)
        )}
      </Table.Body>
    </Table>
  )
}

export default PassFail
