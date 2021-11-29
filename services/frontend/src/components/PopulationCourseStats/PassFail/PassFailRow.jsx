import React from 'react'
import { Table, Icon, Popup, Item } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { shape, string } from 'prop-types'
import { getTextIn } from '../../../common'
import FilterToggleIcon from '../../FilterToggleIcon'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import { useLanguage } from '../../../common/hooks'

const PassFailRow = ({ courseStats }) => {
  const language = useLanguage()
  // FIXME const { courseIsSelected } = useCourseFilter()
  const { onGoToCourseStatisticsClick, onCourseNameCellClick } = UsePopulationCourseContext()
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
    triedOfPopulation,
  } = stats
  const isActive = false // FIXME courseIsSelected(course.code)
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

PassFailRow.propTypes = {
  courseStats: shape({ course: shape({ code: string }) }).isRequired,
}

export default PassFailRow
