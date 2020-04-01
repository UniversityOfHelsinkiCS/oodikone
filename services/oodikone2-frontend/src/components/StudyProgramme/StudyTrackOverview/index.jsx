import React, { useEffect, useState } from 'react'
import { string, func, shape, bool } from 'prop-types'
import { connect } from 'react-redux'
import { uniqBy } from 'lodash'
import { Dropdown, Button, Tab } from 'semantic-ui-react'
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
  const [showTabView, setShow] = useState(false)

  const {
    language,
    throughput,
    studyprogramme,
    dispatchGetProductivity,
    dispatchGetThroughput,
    history,
    studyprogrammes,
    admin
  } = props

  useEffect(() => {
    dispatchGetProductivity(studyprogramme)
    dispatchGetThroughput(studyprogramme)
  }, [])

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

  const renderStudytrackDropdown = () => (
    <>
      {admin && (
        <Button content={showTabView ? 'show no tab view' : ' show tab view'} onClick={() => setShow(!showTabView)} />
      )}
      <h4>Studytrack</h4>
      <Dropdown
        options={studytrackOptions}
        onChange={handleStudytrackChange}
        selection
        placeholder="Select studytrack"
        search={textAndDescriptionSearch}
        fluid
      />
    </>
  )

  const renderYearDropdown = () => (
    <>
      <Button content={showTabView ? 'show no tab view' : 'show tab view'} onClick={() => setShow(!showTabView)} />
      <h4>Year</h4>
      <Dropdown
        options={yearOptions}
        onChange={handleYearChange}
        selection
        placeholder="Select studytrack"
        search={textAndDescriptionSearch}
        fluid
      />
    </>
  )

  const renderStudytrackTable = () => {
    if (!throughputData)
      return (
        <>
          {renderStudytrackDropdown()}
          <h2>No studytrack selected</h2>
        </>
      )
    return (
      <React.Fragment>
        {renderStudytrackDropdown()}
        <ThroughputTable
          throughput={throughputData}
          thesis={throughput.data.thesis}
          loading={throughput.pending}
          error={throughput.error}
          studyprogramme={studyprogramme}
          studytrack={selectedTrack}
          history={history}
          newProgramme={isNewHYStudyProgramme(studyprogramme)}
        />
      </React.Fragment>
    )
  }

  const renderYearTable = () => {
    if (!throughputData)
      return (
        <>
          {renderYearDropdown()}
          <h2>No year selected</h2>
        </>
      )
    return (
      <React.Fragment>
        {renderYearDropdown()}
        <ThroughputTable
          throughput={throughputData}
          thesis={throughput.data.thesis}
          loading={throughput.pending}
          error={throughput.error}
          studyprogramme={studyprogramme}
          studytrack={selectedTrack}
          history={history}
          newProgramme={isNewHYStudyProgramme(studyprogramme)}
          isStudytrackView
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
      menuItem: 'Studytrack specific',
      render: () => renderStudytrackTable()
    },
    {
      menuItem: 'Year specific',
      render: () => renderYearTable()
    }
  ]

  if (showTabView && admin) {
    return <Tab panes={panes} onTabChange={() => handleTabChange()} />
  }

  if (!throughputData)
    return (
      <>
        {renderStudytrackDropdown()}
        <h2>No studytrack selected</h2>
      </>
    )

  return (
    <React.Fragment>
      {renderStudytrackDropdown()}
      <ThroughputTable
        throughput={throughputData}
        thesis={throughput.data.thesis}
        loading={throughput.pending}
        error={throughput.error}
        studyprogramme={studyprogramme}
        studytrack={selectedTrack}
        history={history}
        newProgramme={isNewHYStudyProgramme(studyprogramme)}
      />
    </React.Fragment>
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
  }).isRequired, // eslint-disable-line
  admin: bool.isRequired
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
