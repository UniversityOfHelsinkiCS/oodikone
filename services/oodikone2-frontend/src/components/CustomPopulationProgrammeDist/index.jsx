import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Progress } from 'semantic-ui-react'
import { func, arrayOf, string, shape } from 'prop-types'

import SearchResultTable from '../SearchResultTable'
import { programmeFilter } from '../../populationFilters'
import { setPopulationFilter } from '../../redux/populationFilters'

const CustomPopulationProgrammeDist = ({ samples, selectedStudents, setPopulationFilterDispatch }) => {
  const [tableRows, setRows] = useState([])

  useEffect(() => {
    const allProgrammes = {}
    const filteredSamples = samples.filter(student => selectedStudents.includes(student.studentNumber))
    filteredSamples.forEach((student) => {
      const studyprogrammes = []
      student.studyrights.forEach((sr) => {
        const studyrightElements = sr.studyrightElements.filter(srE => srE.element_detail.type === 20)
        if (studyrightElements.length > 0) {
          const newestStudyrightElement = studyrightElements.sort((a, b) => new Date(b.startdate) - new Date(a.startdate))[0]
          studyprogrammes.push({ name: sr.highlevelname, startdate: newestStudyrightElement.startdate, code: newestStudyrightElement.element_detail.code })
        }
      })
      const programme = studyprogrammes.sort((a, b) => new Date(b.startdate) - new Date(a.startdate))[0]
      if (programme) {
        if (allProgrammes[programme.code]) {
          allProgrammes[programme.code].students.push({ studentnumber: student.studentNumber })
        } else {
          allProgrammes[programme.code] = { programme, students: [] }
          allProgrammes[programme.code].students.push({ studentnumber: student.studentNumber })
        }
      }
    })
    const rows = Object.keys(allProgrammes)
      .map(code =>
        [`${allProgrammes[code].programme.name}, ${code}`, allProgrammes[code].students.length, <Progress style={{ margin: '0px' }} percent={Math.round((allProgrammes[code].students.length / selectedStudents.length) * 100)} progress />])

    setRows(rows)
  }, [selectedStudents])


  const setFilter = (row) => {
    const splitRow = row[0].split(', ')
    setPopulationFilterDispatch(programmeFilter({ programme: splitRow[1], programmeName: splitRow[0] }))
  }

  const headers = [
    'Programmes',
    `Students (all=${selectedStudents.length})`,
    'Percentage of population'
  ]

  return (
    // <div>fidi</div>
    <SearchResultTable
      headers={headers}
      rows={tableRows}
      selectable
      rowClickFn={(e, row) => setFilter(row)}
      noResultText="placeholder"
    />
  )
}

CustomPopulationProgrammeDist.propTypes = {
  samples: arrayOf(shape({})).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  setPopulationFilterDispatch: func.isRequired
}


export default connect(null, {
  setPopulationFilterDispatch: setPopulationFilter
})(CustomPopulationProgrammeDist)
