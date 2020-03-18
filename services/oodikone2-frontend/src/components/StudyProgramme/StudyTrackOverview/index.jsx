import React, { useEffect, useState } from 'react'
import { string, func, shape, bool } from 'prop-types'
import { connect } from 'react-redux'
import { uniqBy } from 'lodash'
import { Dropdown } from 'semantic-ui-react'
import ThroughputTable from '../ThroughputTable'
import { getProductivity } from '../../../redux/productivity'
import { getThroughput } from '../../../redux/throughput'
import { isNewHYStudyProgramme, textAndDescriptionSearch } from '../../../common'

const Overview = props => {
  const [selectedTrack, setTrack] = useState('')
  const [throughputData, setData] = useState(null)
  const [options, setOptions] = useState([])

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

  useEffect(() => {
    if (throughput.data[studyprogramme]) {
      const filteredStudytracks = Object.values(studyprogrammes[studyprogramme].enrollmentStartYears).reduce(
        (acc, curr) => {
          acc.push(...Object.values(curr.studyTracks))
          return uniqBy(acc, 'code')
        },
        []
      )

      const dropdownOptions = filteredStudytracks.map(st => ({
        key: st.code,
        text: st.name[language],
        description: st.code,
        value: st.code
      }))
      setOptions(dropdownOptions)
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

  const handleChange = (event, { value }) => {
    event.preventDefault()
    setTrack(value)
  }

  const renderDropdown = () => (
    <>
      <h4>Studytrack</h4>
      <Dropdown
        options={options}
        onChange={handleChange}
        selection
        placeholder="Select studytrack"
        search={textAndDescriptionSearch}
        fluid
      />
    </>
  )

  if (!throughputData)
    return (
      <>
        {renderDropdown()}
        <h2>No studytrack selected</h2>
      </>
    )

  return (
    <React.Fragment>
      {renderDropdown()}
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
