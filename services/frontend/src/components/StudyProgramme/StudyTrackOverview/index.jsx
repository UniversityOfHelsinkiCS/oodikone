import React, { useEffect, useState } from 'react'
import { string, func, shape, bool } from 'prop-types'
import { connect } from 'react-redux'
import { uniqBy } from 'lodash'
import { Dropdown, Tab, Message, Button } from 'semantic-ui-react'
import ThroughputTable from '../ThroughputTable'
import { getProductivity } from '../../../redux/productivity'
import { getThroughput } from '../../../redux/throughput'
import { isNewHYStudyProgramme, textAndDescriptionSearch, getTextIn } from '../../../common'
import ProtoC from '../../CoolDataScience/ProtoC'

const Overview = ({
  language,
  throughput,
  studyprogramme,
  dispatchGetProductivity,
  dispatchGetThroughput,
  history,
  studyprogrammes,
}) => {
  const [selectedTrack, setTrack] = useState('')
  const [selectedYear, setYear] = useState('')
  const [throughputData, setData] = useState(null)
  const [studytrackOptions, setStudytrackOptions] = useState([])
  const [yearOptions, setYearOptions] = useState([])
  const [activeIndex, setIndex] = useState(0)

  useEffect(() => {
    dispatchGetProductivity(studyprogramme)
    dispatchGetThroughput(studyprogramme)
  }, [])

  // set dropdown options
  useEffect(() => {
    if (throughput.data[studyprogramme]) {
      const years = throughput.data[studyprogramme].data.map(data => data.year)
      const filteredStudytracks = years.reduce((acc, curr) => {
        if (studyprogrammes[studyprogramme].enrollmentStartYears[curr.slice(0, 4)])
          acc.push(...Object.values(studyprogrammes[studyprogramme].enrollmentStartYears[curr.slice(0, 4)].studyTracks))
        return uniqBy(acc, 'code')
      }, [])

      const yearDropdownOptions = years.map(year => ({
        key: year,
        text: year,
        value: year,
      }))

      const dropdownOptions = filteredStudytracks.map(st => ({
        key: st.code,
        text: getTextIn(st.name, language),
        description: st.code,
        value: st.code,
      }))
      if (yearDropdownOptions.length > 0) {
        setYear(yearDropdownOptions[0].value)
      }
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
          totals: throughput.data[studyprogramme].stTotals[selectedTrack],
        }
        setData(newData)
      }
    }
  }, [selectedTrack, activeIndex])

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
          if (studytrack) {
            const newStudyTrackObject = {
              ...selectedYearData.studytrackdata[curr],
              // oh pls no, pls fix asap
              // need to fix logic in throughputtable component so that we can name this better
              year: `${getTextIn(studytrack.name, language)}, ${curr}`,
            }
            acc.push(newStudyTrackObject)
          }
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
              Female: Number(selectedYearData.genders.Female),
            },
            students: Number(selectedYearData.genders.Male) + Number(selectedYearData.genders.Female),
          },
        }
        setData(newData)
      }
    }
  }, [selectedYear, activeIndex])

  const handleStudytrackChange = (event, { value }) => {
    event.preventDefault()
    setTrack(value)
  }

  const handleYearChange = (event, { value }) => {
    event.preventDefault()
    setYear(value)
  }

  const renderSelection = year => {
    if (year && yearOptions.length < 10)
      return (
        <>
          <h3>Year selection</h3>
          <Button.Group>
            {yearOptions.map(option => (
              <Button
                key={option.key}
                content={option.text}
                style={{ borderRadius: '1px' }}
                onClick={e => handleYearChange(e, option)}
                active={option.value === selectedYear}
                color={option.value === selectedYear ? 'blue' : 'black'}
                basic={option.value !== selectedYear}
              />
            ))}
          </Button.Group>
        </>
      )
    return (
      <>
        <h3>{year ? 'Year' : 'Studytrack'} selection</h3>
        <Dropdown
          options={year ? yearOptions : studytrackOptions}
          onChange={year ? handleYearChange : handleStudytrackChange}
          defaultValue={year ? yearOptions[0].value : studytrackOptions[0].value}
          selection
          placeholder={`Select ${year ? 'year' : ' studytrack'}`}
          search={textAndDescriptionSearch}
          fluid
        />
      </>
    )
  }

  const renderTable = year => {
    if (!throughputData || throughputData.data.length < 1) {
      return (
        <>
          {renderSelection(year)}
          <h2>No {year ? 'year' : 'studytrack'} selected or no data available for selection</h2>
        </>
      )
    }
    return (
      <>
        {renderSelection(year)}
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
      </>
    )
  }
  const handleTabChange = (event, { activeIndex }) => {
    setData(null)
    if (activeIndex === 1) {
      setTrack(studytrackOptions[0].value)
      setYear('')
    } else if (activeIndex === 0) {
      setYear(yearOptions[0].value)
      setTrack('')
    }
    setIndex(activeIndex)
  }

  const panes = [
    {
      menuItem: 'Year specific',
      render: () => renderTable(true),
    },
    {
      menuItem: 'Studytrack specific',
      render: () => renderTable(false),
    },
  ]

  if (studyprogramme.includes('KH'))
    panes.push({
      menuItem: 'Studytrack Graph',
      render: () => <ProtoC programme={studyprogramme} />,
    })

  return (
    <>
      <Message
        content="Here you can see statistics on studytrack level. In year specific tab you can compare statistics for all studytracks within selected year. 
                  In studytrack specific tab you can compare different years from one selected studytrack."
      />
      <Tab panes={panes} activeIndex={activeIndex} onTabChange={handleTabChange} />
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
    data: shape({}),
  }).isRequired // eslint-disable-line
}

const mapStateToProps = ({ studyProgrammeThroughput, populationProgrammes, settings }) => ({
  throughput: studyProgrammeThroughput,
  studyprogrammes: populationProgrammes.data.programmes || {},
  language: settings.language,
})

export default connect(mapStateToProps, {
  dispatchGetProductivity: getProductivity,
  dispatchGetThroughput: getThroughput,
})(Overview)
