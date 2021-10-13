import React, { useState, useEffect } from 'react'
import PropTypes, { shape, bool, func } from 'prop-types'
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
import { getStatusGraduated } from '../../redux/coolDataScience'
import './status.css'

const ANALYTICS_CATEGORY = 'Trends'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const getP = (a, b) => {
  if (a === 0 || b === 0) return 1
  return a / b
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
  const mapValueToRange = (x, min1, max1, min2, max2) => {
    if (x < min1) return min2
    if (x > max1) return max2
    return ((x - min1) * (max2 - min2)) / (max1 - min1) + min2
  }

  const getColor = v => {
    if (v > 2.5) return '#6ab04c'
    if (v < -2.5) return '#ff7979'
    return '#7B9FCF'
  }

  const plussify = x => {
    if (x > 0) return `+${x.toLocaleString('fi')}`
    return x.toLocaleString('fi')
  }

  // TODO: Maybe just fix this in backend and add default value 0 for everything?

  const getDiffAndChange = (current, previous, noTitleDataToShow, hasChangedButCantShowPercentage) => {
    if (noTitleDataToShow) return [0, 0]
    const diff = Math.round(current - previous)
    let change
    if (hasChangedButCantShowPercentage) {
      change = diff > 0 ? 100 : -100
    } else {
      change = Math.round((getP(current, previous) - 1) * 1000) / 10
    }
    return [diff, change]
  }

  const noTitleDataToShow = current === null
  const hasChangedButCantShowPercentage = (previous === 0 || current === 0) && previous !== current
  const [diff, change] = getDiffAndChange(current, previous, noTitleDataToShow, hasChangedButCantShowPercentage)

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
        {noTitleDataToShow ? (
          <div>
            <span style={{ fontSize: 20, fontWeight: 'bold', color: getColor(0) }}>
              Ei vielä dataa tältä lukuvuodelta.
            </span>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: 20, fontWeight: 'bold', color: getColor(change) }}>{plussify(diff)}</span>
            {hasChangedButCantShowPercentage ? null : (
              <div>
                <br />
                <span style={{ fontWeight: 'bold', color: getColor(change) }}>({plussify(change)}%)</span>
              </div>
            )}
          </div>
        )}
      </div>
      {showYearlyValues && (
        <div style={{ marginTop: '10px', textAlign: 'start' }}>
          {_.orderBy(Object.entries(yearlyValues), ([y]) => y, ['desc']).map(([year, { acc, total }]) => {
            return (
              <div style={{ margin: '5px 0' }} key={`${title}-${year}`}>
                <span>
                  <b>
                    {year}
                    {!showByYear && `-${`${Number(year) + 1}`.slice(-2)}`}:
                  </b>{' '}
                  {acc} {total > 0 ? `/ ${total}` : ''}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Segment>
  )
}

StatusContainer.propTypes = {
  title: PropTypes.string.isRequired,
  current: PropTypes.number,
  previous: PropTypes.number,
  clickable: PropTypes.bool.isRequired,
  handleClick: PropTypes.func.isRequired,
  min1: PropTypes.number.isRequired,
  max1: PropTypes.number.isRequired,
  showYearlyValues: PropTypes.bool.isRequired,
  yearlyValues: PropTypes.shape({}).isRequired,
  showByYear: PropTypes.bool.isRequired,
}

StatusContainer.defaultProps = {
  current: null,
  previous: 0,
}

const VerticalLine = () => <div style={{ margin: '0 10px', fontSize: '20px' }}>|</div>

const Status = ({ getStatusGraduatedDispatch, data, loading }) => {
  const DATE_FORMAT = 'DD.MM.YYYY'
  const [showYearlyValues, setShowYearlyValues] = useLocalStorage('showYearlyValues', true)
  const [showByYear, setShowByYear] = useLocalStorage('showByYear', true)
  const [drillStack, setDrillStack] = useState([])
  const [showSettings, setShowSettings] = useState(true)
  const [selectedDate, setSelectedDate] = useState(moment())
  const [codes, setCodes] = useState([])
  const { CoolDataScience } = InfoToolTips
  const isValidDate = d => moment.isMoment(d) && moment().diff(d) > 0

  useEffect(() => {
    if (selectedDate && isValidDate(selectedDate)) {
      getStatusGraduatedDispatch({ date: selectedDate.valueOf(), showByYear })
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
    sendAnalytics(`SG Show yearly values toggle ${!yearlyValues ? 'on' : 'off'}`, 'Status graduated')
  }

  const handleShowByYearToggled = () => {
    const byYear = showByYear
    setShowByYear(!showByYear)
    sendAnalytics(`SG Show by year toggle ${!byYear ? 'on' : 'off'}`, 'Status graduated')
  }

  const pushToDrillStack = (values, code) => {
    const updatedCodes = [...codes].concat(code)
    const updatedDrillStack = [...drillStack].concat(values)
    setCodes(updatedCodes)
    setDrillStack(updatedDrillStack)
    sendAnalytics('SG Drilldown clicked', 'Status graduated')
  }

  const popFromDrillStack = () => {
    const updatedDrillStack = _.dropRight([...drillStack], 1)
    const updatedCodes = _.dropRight([...codes], 1)
    setCodes(updatedCodes)
    setDrillStack(updatedDrillStack)
    sendAnalytics('SG Drillup clicked', 'Status graduated')
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
      content="Klikkaamalla tiedekuntaa pystyt porautumaan koulutusohjelma tasolle.
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
      <h2>Koulutusohjelmista valmistuneet</h2>
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
          ([, { current, previous }]) => getP(current, previous), // oh god<r
          ['desc']
        ).map(([code, stats]) => {
          const handleClick = () => pushToDrillStack(stats.drill, code)

          return (
            <StatusContainer
              key={code}
              clickable={!!stats.drill}
              handleClick={handleClick}
              title={getTextIn(stats.name)}
              current={stats.current}
              previous={stats.previous}
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
          <ReactMarkdown children={CoolDataScience.statusGraduated} escapeHtml={false} />
        }
      </Message>
    </>
  )
}

Status.propTypes = {
  data: shape({}).isRequired,
  loading: bool.isRequired,
  getStatusGraduatedDispatch: func.isRequired,
}

const mapStateToProps = ({ coolDataScience }) => ({
  data: coolDataScience.data.graduated,
  loading: coolDataScience.pending.graduated,
})

export default connect(mapStateToProps, { getStatusGraduatedDispatch: getStatusGraduated })(Status)
