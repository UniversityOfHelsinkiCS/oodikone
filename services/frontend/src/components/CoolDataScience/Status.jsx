import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Segment, Popup, Loader, Dimmer, Icon, Accordion, Checkbox, Message, Form } from 'semantic-ui-react'
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

const StatusContainer = ({ stats, handleClick, min1, max1, showYearlyValues, showRelativeValues, showByYear }) => {
  const title = getTextIn(stats.name)
  const clickable = !!stats.drill

  let current
  let previous

  if (!stats.drill) {
    current = stats.currentStudents
    previous = stats.previousStudents
  } else {
    current = stats.current
    previous = stats.previous

    if (showRelativeValues) {
      current /= stats.currentStudents
      previous /= stats.previousStudents
    }
  }

  const diff = current - previous
  const p = getP(current, previous)
  const change = p - 1

  const getColor = v => {
    if (v > 0.025) return '#6ab04c'
    if (v < -0.025) return '#ff7979'
    return '#7B9FCF'
  }

  const plussify = (x, decimals = 0) =>
    x.toLocaleString('fi', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      signDisplay: 'always',
    })

  const getDisplayValue = (value, denominator) => {
    let displayValue

    if (denominator === 0) {
      displayValue = value === 0 ? 0 : Infinity
    } else if (showRelativeValues) {
      displayValue = value / denominator
    } else {
      displayValue = value
    }

    return displayValue.toLocaleString('fi', {
      minimumFractionDigits: showRelativeValues ? 2 : 0,
      maximumFractionDigits: showRelativeValues ? 2 : 0,
    })
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
        <Popup position="bottom center" size="tiny" trigger={<span className="status-title">{title}</span>}>
          {stats.code}
        </Popup>
        <div style={{ margin: '10px 0' }}>
          <Icon
            style={{
              color: getColor(change),
              transform: `rotateZ(${-mapValueToRange(change * 100, min1, max1, -45, 45)}deg)`,
            }}
            size="huge"
            name="arrow right"
          />
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: getColor(change) }}>
            {plussify(diff, showRelativeValues ? 2 : 0)}
          </span>
          <br />
          <span style={{ fontWeight: 'bold', color: getColor(change) }}>({plussify(change * 100, 1)}%)</span>
          <br />
        </div>
      </div>
      {showYearlyValues && (
        <div className={`years item-type-${stats.type}`}>
          {_.orderBy(Object.entries(stats.yearly), ([y]) => y, ['desc']).map(([year, yearStats]) => {
            return (
              <span className="year-row">
                <b className="year-label">
                  {year}
                  {!showByYear && `-${`${Number(year) + 1}`.slice(-2)}`}:
                </b>
                {stats.type === 'course' ? (
                  <>
                    <span className="year-value">{yearStats.accStudents}</span>
                    {!!yearStats.totalStudents && (
                      <>
                        <span className="separator">{yearStats.totalStudents !== undefined && '/'}</span>
                        <span className="year-value">{yearStats.totalStudents}</span>
                      </>
                    )}
                    <span className="unit">students</span>
                  </>
                ) : (
                  <>
                    <span className="year-value accumulated">
                      {getDisplayValue(yearStats.acc, yearStats.accStudents)}
                    </span>
                    <span className="separator">{yearStats.total !== undefined && '/'}</span>
                    <span className="year-value total">
                      {yearStats.total !== undefined && getDisplayValue(yearStats.total, yearStats.totalStudents)}
                    </span>
                  </>
                )}
              </span>
            )
          })}
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
  const [showRelativeValues, setShowRelativeValues] = useLocalStorage('showRelativeValues', false)
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

  const handleShowRelativeValuesChanged = () => {
    sendAnalytics(`S Show relative values toggle ${!showRelativeValues ? 'on' : 'off'}`)
    setShowRelativeValues(!showRelativeValues)
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
            <Checkbox
              style={{ fontSize: '0.9em', fontWeight: 'normal' }}
              label="Näytä suhteutettuna opiskelijoiden määrään"
              onChange={handleShowRelativeValuesChanged}
              checked={showRelativeValues}
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
    Object.values(_.last(drillStack) || data).map(({ current, currentStudents, previous, previousStudents }) => {
      return Math.abs(
        Math.floor(
          (getP(
            showRelativeValues ? current / currentStudents : current,
            showRelativeValues ? previous / previousStudents : previous
          ) -
            1) *
            1000
        ) / 10
      )
    })
  )

  const medianDiff = orderedAbsDiffs[Math.round((orderedAbsDiffs.length - 1) / 2)]

  return (
    <>
      <h2>Koulutusohjelmien tuottamat opintopisteet</h2>
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

          return (
            <StatusContainer
              key={code}
              stats={stats}
              handleClick={handleClick}
              showRelativeValues={showRelativeValues}
              showYearlyValues={showYearlyValues}
              min1={-medianDiff * 2}
              max1={medianDiff * 2}
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
