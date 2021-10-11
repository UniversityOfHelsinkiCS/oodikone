import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Segment, Loader, Dimmer, Icon, Accordion, Checkbox, Message, Form } from 'semantic-ui-react'
import _ from 'lodash'
import moment from 'moment'
import ReactMarkdown from 'react-markdown'
import Datetime from 'react-datetime'

import TSA from '../../common/tsa'
import { getTextIn } from '../../common'
import { useLocalStorage } from '../../common/hooks'
import InfoToolTips from '../../common/InfoToolTips'
import { getStatus } from '../../redux/coolDataScience'
import './status.css'

const ANALYTICS_CATEGORY = 'Trends'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const getP = (a, b) => {
  if (a === 0 || b === 0) return 1
  return a / b
}

const mapValueToRange = (x, min1, max1, min2, max2) => {
  if (x < min1) return min2
  if (x > max1) return max2
  return ((x - min1) * (max2 - min2)) / (max1 - min1) + min2
}

const StatusContainer = ({
  title,
  current,
  previous,
  clickable,
  handleClick,
  min1,
  max1,
  showYearlyValues,
  yearlyValues,
  showByYear,
}) => {
  const diff = Math.round(current - previous)
  const p = getP(current, previous)
  const change = Math.round((p - 1) * 1000) / 10

  const getColor = v => {
    if (v > 2.5) return '#6ab04c'
    if (v < -2.5) return '#ff7979'
    return '#7B9FCF'
  }

  const plussify = x => {
    if (x > 0) return `+${x.toLocaleString('fi')}`
    return x.toLocaleString('fi')
  }

  return (
    <Segment
      className="status-card"
      onClick={clickable ? handleClick : null}
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '240px',
        minWidth: '240px',
        cursor: clickable ? 'pointer' : 'default',
        flex: 1,
        margin: 0,
      }}
      textAlign="center"
      compact
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflowWrap: 'break-word',
        }}
      >
        <span className="status-title">{title}</span>
        <div style={{ margin: '10px 0' }}>
          <Icon
            style={{
              color: getColor(change),
              transform: `rotateZ(${-mapValueToRange(change, min1, max1, -45, 45)}deg)`,
            }}
            size="huge"
            name="arrow right"
          />
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: getColor(change) }}>{plussify(diff)}</span>
          <br />
          <span style={{ fontWeight: 'bold', color: getColor(change) }}>({plussify(change)}%)</span>
        </div>
      </div>
      {showYearlyValues && (
        <div style={{ marginTop: '10px', textAlign: 'start' }}>
          {_.orderBy(Object.entries(yearlyValues), ([y]) => y, ['desc']).map(
            ([year, { acc, total, accStudents, totalStudents }]) => {
              return (
                <div style={{ margin: '5px 0' }} key={`${title}-${year}`}>
                  <span>
                    <b>
                      {year}
                      {!showByYear && `-${`${Number(year) + 1}`.slice(-2)}`}:
                    </b>{' '}
                    {/* render num of students instead of credits if no credits are given from the course */}
                    {accStudents <= acc ? Math.round(acc).toLocaleString('fi') : accStudents}
                    {/* if no total students add students after accStudents */}
                    {acc <= accStudents && totalStudents < 1 && ' students'}
                    {/* render total if there are credits or students for either */}
                    {(total > 0 || totalStudents > 0) &&
                      ` / ${
                        // same logic as before to check if render num of students or credits
                        totalStudents <= total && total > 0
                          ? Math.round(total).toLocaleString('fi')
                          : `${totalStudents} students`
                      }`}
                  </span>
                </div>
              )
            }
          )}
        </div>
      )}
    </Segment>
  )
}

const VerticalLine = () => <div style={{ margin: '0 10px', fontSize: '20px' }}>|</div>

const Status = ({ getStatusDispatch, data, loading }) => {
  const DATE_FORMAT = 'DD.MM.YYYY'
  const [showYearlyValues, setShowYearlyValues] = useLocalStorage('showYearlyValues', true)
  const [showByYear, setShowByYear] = useLocalStorage('showByYear', false)
  const [drillStack, setDrillStack] = useState([])
  const [showSettings, setShowSettings] = useState(true)
  const [selectedDate, setSelectedDate] = useState(moment())
  const [codes, setCodes] = useState([])
  const { CoolDataScience } = InfoToolTips

  const isValidDate = d => moment.isMoment(d) && moment().diff(d) > 0

  useEffect(() => {
    if (selectedDate && isValidDate(selectedDate)) {
      getStatusDispatch({ date: selectedDate.valueOf(), showByYear })
    }
  }, [selectedDate, showByYear])

  useEffect(() => {
    if (codes.length > 0) {
      const updatedDrillStack = codes.reduce((acc, code) => {
        const drilled = data[code]
        // check if the code is on first level of drilldown
        if (drilled) acc.push(drilled.drill)
        // if not on first level then use the previous object in array
        // this might be source of bugs but its the best I could come up with
        else if (acc.length > 0 && acc[0][code]) acc.push(acc[0][code].drill)
        return acc
      }, [])
      setDrillStack(updatedDrillStack)
    }
  }, [data])

  const handleShowYearlyValuesToggled = () => {
    const yearlyValues = showYearlyValues
    setShowYearlyValues(!showYearlyValues)
    sendAnalytics(`S Show yearly values toggle ${!yearlyValues ? 'on' : 'off'}`, 'Status')
  }

  const handleShowByYearToggled = () => {
    const byYear = showByYear
    setShowByYear(!showByYear)
    sendAnalytics(`S Show by year toggle ${!byYear ? 'on' : 'off'}`, 'Status')
  }

  const pushToDrillStack = (values, code) => {
    const updatedCodes = [...codes].concat(code)
    const updatedDrillStack = [...drillStack].concat(values)
    setCodes(updatedCodes)
    setDrillStack(updatedDrillStack)
    sendAnalytics('S Drilldown clicked', 'Status')
  }

  const popFromDrillStack = () => {
    const updatedDrillStack = _.dropRight([...drillStack], 1)
    const updatedCodes = _.dropRight([...codes], 1)
    setCodes(updatedCodes)
    setDrillStack(updatedDrillStack)
    sendAnalytics('S Drillup clicked', 'Status')
  }

  const renderSettings = () => {
    return (
      <Accordion style={{ padding: 0, paddingTop: '10px', flex: 1 }}>
        <Accordion.Title style={{ padding: 0, cursor: 'default' }} active={showSettings}>
          <span style={{ cursor: 'pointer' }} onClick={() => setShowSettings(!showSettings)}>
            <Icon name="setting" />
            <span>Asetukset</span>
          </span>
        </Accordion.Title>
        <Accordion.Content style={{ padding: 0, marginTop: '10px' }} active={showSettings}>
          <Segment style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                background: 'red',
                transform: 'rotateY(0deg) rotate(45deg)',
                position: 'absolute',
                top: '-6px',
                left: '35px',
                border: '1px solid #dededf',
                borderRight: 'none',
                borderBottom: 'none',
                backgroundColor: 'white',
              }}
            />
            <Checkbox
              style={{ fontSize: '0.9em', fontWeight: 'normal' }}
              label="Näytä edelliset vuodet"
              onChange={handleShowYearlyValuesToggled}
              checked={showYearlyValues}
            />
            <VerticalLine />
            <Checkbox
              style={{ fontSize: '0.9em', fontWeight: 'normal' }}
              label="Näytä kalenterivuosittain"
              onChange={handleShowByYearToggled}
              checked={showByYear}
            />
            <VerticalLine />
            <Form>
              <Form.Field error={!isValidDate(selectedDate)} style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9em' }}>Näytä päivänä:</span>
                <Datetime
                  className="status-date-time-input"
                  dateFormat={DATE_FORMAT}
                  timeFormat={false}
                  closeOnSelect
                  value={selectedDate}
                  locale="fi"
                  isValidDate={isValidDate}
                  onChange={setSelectedDate}
                />
              </Form.Field>
            </Form>
          </Segment>
        </Accordion.Content>
      </Accordion>
    )
  }

  const DrilldownMessage = () => (
    <Message
      color="blue"
      content="Klikkaamalla tiedekuntaa pystyt porautumaan koulutusohjelma tasolle ja ohjelmaa klikkaamalla pystyt porautumaan kurssitasolle.
      Vasemmassa yläkulmassa olevaa nuolta klikkaamalla pääset edelliseen näkymään."
    />
  )

  if (!data || loading)
    return (
      <Segment style={{ padding: '40px' }} textAlign="center">
        <Dimmer inverted active />
        <Loader active={loading} />
      </Segment>
    )

  const orderedAbsDiffs = _.orderBy(
    Object.values(_.last(drillStack) || data).map(({ current, previous }) => {
      return Math.abs(Math.floor((getP(current, previous) - 1) * 1000) / 10)
    })
  )
  const medianDiff = orderedAbsDiffs[Math.round((orderedAbsDiffs.length - 1) / 2)]
  return (
    <>
      <h2>Uusien ohjelmien tuottamat opintopisteet</h2>
      <DrilldownMessage />
      <div style={{ display: 'flex', marginBottom: '20px', marginRight: '40px' }}>
        {drillStack.length > 0 && (
          <Icon onClick={popFromDrillStack} style={{ fontSize: '40px', cursor: 'pointer' }} name="arrow left" />
        )}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 240px)',
          gridTemplateRows: 'repeat(auto-fill) 20px',
          gridGap: '20px',
          justifyContent: 'center',
        }}
      >
        {_.orderBy(
          Object.entries(_.last(drillStack) || data),
          ([, { current, previous, currentStudents, previousStudents }]) =>
            getP(current || currentStudents, previous || previousStudents), // oh god<r
          ['desc']
        ).map(([code, stats]) => {
          const handleClick = () => pushToDrillStack(stats.drill, code)
          // check if the course has credits or not (if credits is zero but there are students who have completed it)
          const current =
            !stats.drill && stats.current === 0 && stats.currentStudents > 1 ? stats.currentStudents : stats.current
          const previous =
            !stats.drill && stats.previous === 0 && stats.previousStudents > 1 ? stats.previousStudents : stats.previous
          return (
            <StatusContainer
              key={code}
              clickable={!!stats.drill}
              handleClick={handleClick}
              title={getTextIn(stats.name)}
              current={current}
              previous={previous}
              showYearlyValues={showYearlyValues}
              min1={-medianDiff * 2}
              max1={medianDiff * 2}
              yearlyValues={stats.yearly}
              showByYear={showByYear}
            />
          )
        })}
      </div>
      {renderSettings()}
      <Message>
        {
          // eslint-disable-next-line react/no-children-prop
          <ReactMarkdown children={CoolDataScience.status} escapeHtml={false} />
        }
      </Message>
    </>
  )
}

const mapStateToProps = ({ coolDataScience }) => ({
  data: coolDataScience.data.status,
  loading: coolDataScience.pending.status,
})

export default connect(mapStateToProps, { getStatusDispatch: getStatus })(Status)
