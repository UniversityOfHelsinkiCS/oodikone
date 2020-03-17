import React, { useEffect, useState } from 'react'
import { string, func, shape, bool } from 'prop-types'
import { connect } from 'react-redux'
import { Dropdown } from 'semantic-ui-react'
import ThroughputTable from '../ThroughputTable'
import { getProductivity } from '../../../redux/productivity'
import { getThroughput } from '../../../redux/throughput'
import { isNewHYStudyProgramme } from '../../../common'

const Overview = props => {
  const [selectedTrack, setTrack] = useState('')
  const [throughputData, setData] = useState(null)
  const [options, setOptions] = useState([])

  const { throughput, studyprogramme, dispatchGetProductivity, dispatchGetThroughput, history, studytracks } = props

  useEffect(() => {
    dispatchGetProductivity(studyprogramme)
    dispatchGetThroughput(studyprogramme)
  }, [])

  useEffect(() => {
    if (throughput.data[studyprogramme]) {
      const filteredStudytracks = Object.keys(studytracks).reduce((acc, curr) => {
        if (Object.keys(studytracks[curr].programmes).includes(studyprogramme)) acc.push(studytracks[curr])
        return acc
      }, [])

      const dropdownOptions = filteredStudytracks.map(st => ({
        key: st.code,
        text: `${st.code}, ${st.name.fi}`,
        value: st.code
      }))
      setOptions(dropdownOptions)
    }
  }, [throughput, studytracks])

  useEffect(() => {
    if (throughput.data[studyprogramme] && selectedTrack) {
      const selectedData = throughput.data[studyprogramme].data.map(deita => deita.studytrackdata[selectedTrack])
      const newData = {
        data: selectedData,
        lastUpdated: throughput.data[studyprogramme].lastUpdated,
        status: 'DONE',
        totals: throughput.data[studyprogramme].stTotals[selectedTrack]
      }
      setData(newData)
    }
  }, [selectedTrack])

  const handleChange = (event, { value }) => {
    event.preventDefault()
    setTrack(value)
  }

  const renderDropdown = () => (
    <>
      <h4>Studytrack</h4>
      <Dropdown options={options} onChange={handleChange} selection placeholder="Select studytrack" />
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
  studytracks: shape({}).isRequired,
  throughput: shape({
    error: bool,
    pending: bool,
    data: shape({})
  }).isRequired // eslint-disable-line
}

const mapStateToProps = ({ studyProgrammeThroughput, populationDegreesAndProgrammes }) => ({
  throughput: studyProgrammeThroughput,
  studytracks: populationDegreesAndProgrammes.data.studyTracks || {}
})

export default connect(
  mapStateToProps,
  {
    dispatchGetProductivity: getProductivity,
    dispatchGetThroughput: getThroughput
  }
)(Overview)
