import React, { useEffect, useState } from 'react'
import { string, func, shape, bool } from 'prop-types'
import { connect } from 'react-redux'
import { uniqBy } from 'lodash'
import { Dropdown, Tab, Message } from 'semantic-ui-react'
import ThroughputTable from '../ThroughputTable'
import { getProductivity } from '../../../redux/productivity'
import { getThroughput } from '../../../redux/throughput'
import { isNewHYStudyProgramme, textAndDescriptionSearch } from '../../../common'

const Overview = props => {
  const [selectedTrack, setTrack] = useState('')
  const [selectedYear, setYear] = useState('')
  const [throughputData, setData] = useState(null)
  const [studytrackOptions, setStudytrackOptions] = useState([])
  const [yearOptions, setYearOptions] = useState([])

  const {
    language,
    throughput,
    studyprogramme,
    dispatchGetProductivity,
    dispatchGetThroughput,
    history,
    studyprogrammes
  } = props

  useEffect(() => {
    dispatchGetProductivity(studyprogramme)
    dispatchGetThroughput(studyprogramme)
  }, [])

  // set dropdown options
  useEffect(() => {
    if (throughput.data[studyprogramme]) {
      const years = Object.keys(studyprogrammes[studyprogramme].enrollmentStartYears)
      const filteredStudytracks = years.reduce((acc, curr) => {
        acc.push(...Object.values(studyprogrammes[studyprogramme].enrollmentStartYears[curr].studyTracks))
        return uniqBy(acc, 'code')
      }, [])

      const yearDropdownOptions = years.map(year => ({
        key: `${year}-${Number(year) + 1}`,
        text: `${year}-${Number(year) + 1}`,
        value: `${year}-${Number(year) + 1}`
      }))

      const dropdownOptions = filteredStudytracks.map(st => ({
        key: st.code,
        text: st.name[language],
        description: st.code,
        value: st.code
      }))
      setYearOptions(yearDropdownOptions)
      setStudytrackOptions(dropdownOptions)
    }
  }, [throughput, studyprogrammes])

  // mankel throughput data after selecting studytrack
  useEffect(() => {
    if (throughput.data[studyprogramme] && selectedTrack) {
      if (throughput.data[studyprogramme].data[0].studytrackdata) {
        const selectedData = throughput.data[studyprogramme].data.reduce((acc, curr) => {
          if (curr.studytrackdata[selectedTrack]) acc.push(curr.studytrackdata[selectedTrack])
          return acc
        }, [])
        const newData = {
          data: selectedData,
          lastUpdated: throughput.data[studyprogramme].lastUpdated,
          status: throughput.data[studyprogramme].status,
          totals: throughput.data[studyprogramme].stTotals[selectedTrack]
        }
        setData(newData)
      }
    }
  }, [selectedTrack])

  // mankel throughput data after selecting a year
  useEffect(() => {
    if (throughput.data[studyprogramme] && selectedYear) {
      if (throughput.data[studyprogramme].data[0].studytrackdata) {
        const selectedYearData = throughput.data[studyprogramme].data.find(data => data.year === selectedYear)
        const filteredStudytracks = Object.values(studyprogrammes[studyprogramme].enrollmentStartYears).reduce(
          (acc, curr) => {
            acc.push(...Object.values(curr.studyTracks))
            return uniqBy(acc, 'code')
          },
          []
        )
        const studytrackYearData = Object.keys(selectedYearData.studytrackdata).reduce((acc, curr) => {
          const studytrack = filteredStudytracks.find(st => st.code === curr)
          const newStudyTrackObject = {
            ...selectedYearData.studytrackdata[curr],
            // oh pls no, pls fix asap
            // need to fix logic in throughputtable component so that we can name this better
            year: `${studytrack.name[language]}, ${curr}`
          }
          acc.push(newStudyTrackObject)
          return acc
        }, [])
        const newData = {
          data: studytrackYearData,
          lastUpdated: throughput.data[studyprogramme].lastUpdated,
          status: throughput.data[studyprogramme].status,
          totals: {
            ...selectedYearData,
            credits: selectedYearData.creditValues,
            genders: {
              Male: Number(selectedYearData.genders.Male),
              Female: Number(selectedYearData.genders.Female)
            },
            students: Number(selectedYearData.genders.Male) + Number(selectedYearData.genders.Female)
          }
        }
        setData(newData)
      }
    }
  }, [selectedYear])

  const handleStudytrackChange = (event, { value }) => {
    event.preventDefault()
    setTrack(value)
  }

  const handleYearChange = (event, { value }) => {
    event.preventDefault()
    setYear(value)
  }

  const renderDropdown = year => {
    return (
      <>
        <h4>{year ? 'Year' : 'Studytrack'} selection</h4>
        <Dropdown
          options={year ? yearOptions : studytrackOptions}
          onChange={year ? handleYearChange : handleStudytrackChange}
          selection
          placeholder={`Select ${year ? 'year' : ' studytrack'}`}
          search={textAndDescriptionSearch}
          fluid
        />
      </>
    )
  }

  const renderTable = year => {
    if (!throughputData) {
      return (
        <>
          {renderDropdown(year)}
          <h2>No {year ? 'year' : 'studytrack'} selected</h2>
        </>
      )
    }
    return (
      <React.Fragment>
        {renderDropdown(year)}
        <ThroughputTable
          throughput={throughputData}
          thesis={throughput.data.thesis}
          loading={throughput.pending}
          error={throughput.error}
          studyprogramme={studyprogramme}
          studytrack={selectedTrack}
          history={history}
          newProgramme={isNewHYStudyProgramme(studyprogramme)}
          isStudytrackView={year}
        />
      </React.Fragment>
    )
  }

  const handleTabChange = () => {
    setYear('')
    setTrack('')
    setData(null)
  }

  const panes = [
    {
      menuItem: 'Year specific',
      render: () => renderTable(true)
    },
    {
      menuItem: 'Studytrack specific',
      render: () => renderTable(false)
    }
  ]

  return (
    <>
      <Message
        content="Here you can see statistics on studytrack level. In year specific tab you can compare statistics for all studytracks within selected year. 
                  In studytrack specific tab you can compare different years from one selected studytrack."
      />
      <Tab panes={panes} onTabChange={() => handleTabChange()} />
    </>
  )
}

Overview.propTypes = {
  studyprogramme: string.isRequired,
  dispatchGetProductivity: func.isRequired,
  dispatchGetThroughput: func.isRequired,
  history: shape({}).isRequired,
  studyprogrammes: shape({}).isRequired,
  language: string.isRequired,
  throughput: shape({
    error: bool,
    pending: bool,
    data: shape({})
  }).isRequired // eslint-disable-line
}

const mapStateToProps = ({ studyProgrammeThroughput, populationDegreesAndProgrammes, settings }) => ({
  throughput: studyProgrammeThroughput,
  studyprogrammes: populationDegreesAndProgrammes.data.programmes || {},
  language: settings.language
})

export default connect(
  mapStateToProps,
  {
    dispatchGetProductivity: getProductivity,
    dispatchGetThroughput: getThroughput
  }
)(Overview)
