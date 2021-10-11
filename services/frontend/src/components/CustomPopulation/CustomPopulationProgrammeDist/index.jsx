import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Progress } from 'semantic-ui-react'
import { arrayOf, string, shape } from 'prop-types'
import SearchResultTable from '../../SearchResultTable'
import { getNewestProgramme, getTextIn } from '../../../common'
import useLanguage from '../../LanguagePicker/useLanguage'
import useProgrammeFilter from '../../FilterTray/filters/Programmes/useProgrammeFilter'
import FilterToggleIcon from '../../FilterToggleIcon'

const CustomPopulationProgrammeDist = ({
  samples,
  selectedStudents,
  studentToTargetCourseDateMap,
  populationStatistics,
}) => {
  const { language } = useLanguage()
  const { selectedProgrammes, toggleFilterProgramme } = useProgrammeFilter()
  const [tableRows, setRows] = useState([])

  useEffect(() => {
    if (Object.keys(populationStatistics).length > 0) {
      const allProgrammes = {}
      const filteredSamples = samples.filter(student => selectedStudents.includes(student.studentNumber))

      filteredSamples.forEach(student => {
        const programme = getNewestProgramme(
          student.studyrights,
          student.studentNumber,
          studentToTargetCourseDateMap,
          populationStatistics.elementdetails.data
        )
        if (programme) {
          if (allProgrammes[programme.code]) {
            allProgrammes[programme.code].students.push({ studentnumber: student.studentNumber })
          } else {
            allProgrammes[programme.code] = { programme, students: [] }
            allProgrammes[programme.code].students.push({ studentnumber: student.studentNumber })
          }
        } else {
          if (!allProgrammes['00000']) {
            allProgrammes['00000'] = { programme: { name: { en: 'No programme' } }, students: [] }
          }
          allProgrammes['00000'].students.push({ studentnumber: student.studentnumber })
        }
      })
      const rows = Object.entries(allProgrammes).map(([code, { programme, students }]) => [
        getTextIn(programme.name, language),
        code,
        students.length,
        <Progress
          style={{ margin: '0px' }}
          percent={Math.round((students.length / selectedStudents.length) * 100)}
          progress
        />,
      ])
      const sortedRows = rows.sort((a, b) => b[2] - a[2])
      setRows(sortedRows)
    }
  }, [selectedStudents])

  const headers = ['Programme', 'Code', `Students (all=${selectedStudents.length})`, 'Percentage of population']

  const handleFilterToggle = code => {
    toggleFilterProgramme(code)
  }

  const isProgrammeFilterActive = code => selectedProgrammes.find(p => p.code === code) !== undefined

  return (
    <SearchResultTable
      headers={headers}
      rows={tableRows}
      selectable
      noResultText="placeholder"
      actionTrigger={row => (
        <span style={{ display: 'inline-block', marginRight: '0.3em' }}>
          <FilterToggleIcon onClick={() => handleFilterToggle(row[1])} isActive={isProgrammeFilterActive(row[1])} />
        </span>
      )}
    />
  )
}

CustomPopulationProgrammeDist.defaultProps = {
  studentToTargetCourseDateMap: null,
}

CustomPopulationProgrammeDist.propTypes = {
  samples: arrayOf(shape({})).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  studentToTargetCourseDateMap: shape({}),
  populationStatistics: shape({}).isRequired,
}

const mapStateToProps = ({ populations }) => {
  return {
    populationStatistics: populations.data,
  }
}

export default connect(mapStateToProps)(CustomPopulationProgrammeDist)
