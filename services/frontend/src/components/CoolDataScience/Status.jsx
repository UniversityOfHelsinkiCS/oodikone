import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Divider, Segment, Button, Popup, Loader, Icon, Checkbox, Form, Breadcrumb } from 'semantic-ui-react'
import _ from 'lodash'
import moment from 'moment'
import ReactMarkdown from 'react-markdown'
import Datetime from 'react-datetime'

import { useHistory, useLocation } from 'react-router-dom'
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

const actionTooltips = {
  showByYear: {
    label: 'Näytä kalenterivuosittain',
    short: 'Näytä tilastot kalenterivuosittain lukuvuosien sijasta.',
    long: `
      Kun tämä valinta on käytössä, vuosittaiset ajanjaksot lasketaan kalenterivuoden alusta sen loppuun.
      Muulloin vuosittaiset ajanjaksot lasketaan lukukauden alusta seuraavan lukukauden alkuun.
    `,
  },

  showYearlyValues: {
    label: 'Näytä edelliset vuodet',
    short: 'Näytä tilastot vuosittain, alkaen vuodesta 2017.',
    long: 'Näyttää tilastot vuodesta 2017 eteenpäin. Huomaa, että nykyisen vuoden arvo vuosilistauksessa riippuu valinnastasi "Näytä kalenterivuosittain" -kohdassa.',
  },

  showRelativeValues: {
    label: 'Näytä suhteutettuna opiskelijoiden määrään',
    short:
      'Näyttää tilastot suhteutettuna opiskelijoiden määrään kyseisellä aikavälillä ja kyseisessä organisaatiossa.',
    long: `
      Näyttää tilastot suhteutettuna opiskelijoiden määrään kyseisellä aikavälillä ja kyseisessä organisaatiossa.
      Opiskelijoiden määrä perustuu ajanjaksolla kyseisen organisaation alaisista kursseista suoritusmerkintöjä saaneiden opiskelijoiden määrään.
      Luku siis sisältää muutkin kuin kyseiseen ohjelman tai osaston opinto-oikeuden omaavat opiskelijat.
    `,
  },

  showCountingFrom: {
    label: 'Näytä päivänä',
    short: 'Valitse päivä johon asti kertyneet tilastot näytetään.',
    long: `
      Tämä valinta määrittää päivämäärän, jota käyttäen kertyneet tilastot lasketaan.
      Esimerkiksi "Näytä kalenterivuosittain" valinnan ollessa pois päältä,
      lasketaan kertyneet tilastot (vrt. lukuvuosien kokonaistilastot) kunkin lukuvuoden alusta
      tätä päivämäärää vastaavaan päivään kyseisenä lukuvuonna.
    `,
  },
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
              transitionProperty: 'transform',
              transitionDuration: '200ms',
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

const StatusContent = ({ data, settings, onDrill }) => {
  const { showByYear, showRelativeValues, showYearlyValues } = settings

  const orderedAbsDiffs = _.chain(data)
    .map(({ current, currentStudents, previous, previousStudents }) => {
      const currentValue = showRelativeValues ? current / currentStudents : current
      const previousValue = showRelativeValues ? previous / previousStudents : previous
      return Math.abs(Math.floor((getP(currentValue, previousValue) - 1) * 1000) / 10)
    })
    .orderBy()
    .value()

  const medianDiff = orderedAbsDiffs[Math.round((orderedAbsDiffs.length - 1) / 2)]

  return (
    <>
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
          data,
          ({ current, previous, currentStudents, previousStudents }) =>
            getP(current || currentStudents, previous || previousStudents), // oh god<r
          ['desc']
        ).map(stats => {
          const handleClick = () => onDrill(stats.code)

          return (
            <StatusContainer
              key={stats.code}
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
    </>
  )
}

const WithHelpTooltip = ({ children, tooltip, onOpenDetails, ...rest }) => {
  const popupContext = useRef()

  const trigger = (
    <div>
      {children}
      <div ref={popupContext} style={{ display: 'inline-block', paddingTop: '0.2em', cursor: 'help' }}>
        <Icon ref={popupContext} style={{ marginLeft: '0.3em', color: '#888' }} name="question circle outline" />
      </div>
    </div>
  )

  const popupProps = _.defaults(rest, {
    position: 'right center',
  })

  return (
    <>
      <Popup hoverable size="tiny" trigger={trigger} context={popupContext} {...popupProps} mouseEnterDelay={1000}>
        <div>{tooltip}</div>
        <span style={{ color: '#2185d0', cursor: 'pointer' }} onClick={onOpenDetails}>
          Lue lisää...
        </span>
      </Popup>
    </>
  )
}

const isValidDate = d => moment().diff(moment(d)) > 0

const StatusSettings = ({ onSettingsChange, settings, onOpenDetails }) => {
  const { showYearlyValues, showByYear, showRelativeValues, selectedDate } = settings
  const DATE_FORMAT = 'DD.MM.YYYY'

  const changeSetting = (property, value) => {
    sendAnalytics(`S Set setting "${property}" to ${value}`, 'Status')

    onSettingsChange({
      ...settings,
      [property]: value,
    })
  }

  const itemStyles = {
    margin: '0.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', padding: 0, flexDirection: 'column' }}>
      <div style={itemStyles}>
        <WithHelpTooltip tooltip={actionTooltips.showYearlyValues.short} onOpenDetails={onOpenDetails}>
          <Checkbox
            style={{ fontSize: '0.9em', fontWeight: 'normal' }}
            label={actionTooltips.showYearlyValues.label}
            checked={showYearlyValues}
            onChange={() => changeSetting('showYearlyValues', !showYearlyValues)}
          />
        </WithHelpTooltip>
      </div>
      <div style={itemStyles}>
        <WithHelpTooltip tooltip={actionTooltips.showByYear.short} onOpenDetails={onOpenDetails}>
          <Checkbox
            style={{ fontSize: '0.9em', fontWeight: 'normal' }}
            label={actionTooltips.showByYear.label}
            checked={showByYear}
            onChange={() => changeSetting('showByYear', !showByYear)}
          />
        </WithHelpTooltip>
      </div>
      <div style={itemStyles}>
        <WithHelpTooltip tooltip={actionTooltips.showRelativeValues.short} onOpenDetails={onOpenDetails}>
          <Checkbox
            style={{ fontSize: '0.9em', fontWeight: 'normal' }}
            label={actionTooltips.showRelativeValues.label}
            checked={showRelativeValues}
            onChange={() => changeSetting('showRelativeValues', !showRelativeValues)}
          />
        </WithHelpTooltip>
      </div>
      <div style={itemStyles}>
        <Form>
          <Form.Field error={!isValidDate(selectedDate)} style={{ display: 'flex', alignItems: 'center' }}>
            <WithHelpTooltip tooltip={actionTooltips.showCountingFrom.short} onOpenDetails={onOpenDetails}>
              <span style={{ fontSize: '0.9em' }}>{actionTooltips.showCountingFrom.label}</span>
            </WithHelpTooltip>
            <Datetime
              className="status-date-time-input"
              dateFormat={DATE_FORMAT}
              timeFormat={false}
              closeOnSelect
              value={moment(selectedDate)}
              locale="fi"
              isValidDate={isValidDate}
              onChange={value => changeSetting('selectedDate', value)}
            />
          </Form.Field>
        </Form>
      </div>
    </div>
  )
}

const getDefaultSettings = () => ({
  showYearlyValues: true,
  showByYear: false,
  showRelativeValues: false,
  showSettings: true,
  selectedDate: null,
})

const Status = () => {
  const [explicitSettings, setSettings] = useLocalStorage('trendsStatusSettings', {})
  const [usageDetailsOpen, setUsageDetailsOpen] = useState(false)
  const moreDetailsRef = useRef(null)
  const history = useHistory()
  const location = useLocation()

  const drillStack = location.state?.drillStack ?? []

  const data = useSelector(state => state.coolDataScience.data.status)
  const loading = useSelector(state => state.coolDataScience.pending.status)
  const dispatch = useDispatch()

  const settings = useMemo(() => _.defaults(explicitSettings, getDefaultSettings()), [explicitSettings])

  const { CoolDataScience } = InfoToolTips

  useEffect(() => {
    const { selectedDate, showByYear } = settings

    let date

    if (!selectedDate) {
      date = moment().valueOf()
    } else if (isValidDate(selectedDate)) {
      date = moment(selectedDate).valueOf()
    } else {
      return
    }

    dispatch(
      getStatus({
        date,
        showByYear,
      })
    )
  }, [settings.selectedDate, settings.showByYear])

  const pushToDrillStack = code => {
    history.push('/trends/status', {
      drillStack: [...drillStack, code],
    })

    sendAnalytics('S Drilldown clicked', 'Status')
  }

  const breadcrumb = useMemo(() => {
    const stack = _.chain(drillStack)
      .reduce(
        ([stack, data], code) => {
          let content = code
          let next = null

          if (data) {
            const entry = data[code]

            if (entry) {
              content = getTextIn(entry.name)
              next = entry.drill
            }
          }

          const item = {
            key: code,
            content,
            link: !!next,
            active: !next,
            onClick: () => {
              history.push('/trends/status', {
                drillStack: [...stack.map(({ key }) => key).splice(1), code],
              })
            },
          }

          return [[...stack, item], next]
        },
        [[], data]
      )
      .value()[0]

    const hy = {
      key: '',
      content: getTextIn({
        fi: 'Helsingin Yliopisto',
        en: 'University of Helsinki',
        sv: 'Helsingfors universitet',
      }),
      link: true,
      onClick: () =>
        history.push('/trends/status', {
          drillStack: [],
        }),
    }

    return [hy, ...stack]
  }, [data, drillStack])

  const drilledData = useMemo(
    () =>
      _.chain(drillStack)
        .reduce((data, code) => data && _.values(data).find(item => item.code === code)?.drill, data)
        .defaultTo({})
        .values()
        .value(),
    [data, drillStack]
  )

  const popFromDrillStack = () => {
    const newDrillStack = [...drillStack]
    newDrillStack.pop()
    history.push('/trends/status', {
      drillStack: newDrillStack,
    })

    sendAnalytics('S Drillup clicked', 'Status')
  }

  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }} ref={moreDetailsRef}>
        <h2 style={{ margin: 0, flexGrow: 1 }}>Koulutusohjelmien tuottamat opintopisteet</h2>
        <Popup
          trigger={
            <Button>
              <Icon name="settings" /> Asetukset
            </Button>
          }
          position="bottom right"
          on="click"
          wide="very"
          open={settingsOpen}
          onOpen={() => setSettingsOpen(true)}
          onClose={() => {
            // Close the popup only after the event has had a chance to propagate.
            setTimeout(() => setSettingsOpen(false), 0)
          }}
          style={{ padding: '0.25em 0em', maxHeight: '80vh' }}
        >
          <StatusSettings
            settings={settings}
            onSettingsChange={setSettings}
            onOpenDetails={() => {
              if (moreDetailsRef.current) {
                moreDetailsRef.current.scrollIntoView({
                  block: 'start',
                  inline: 'end',
                  behavior: 'smooth',
                })
              }

              setUsageDetailsOpen(true)
            }}
          />
        </Popup>
        <Popup
          trigger={
            <Button>
              <Icon name="question circle" /> Käyttöohje
            </Button>
          }
          position="bottom right"
          on="click"
          wide="very"
          open={usageDetailsOpen}
          onOpen={() => setUsageDetailsOpen(true)}
          onClose={() => setUsageDetailsOpen(false)}
          style={{ padding: '0', paddingBottom: '0.5em', maxHeight: '80vh', overflowY: 'auto' }}
        >
          <div style={{ padding: '1em' }}>
            {
              // eslint-disable-next-line react/no-children-prop
              <ReactMarkdown children={CoolDataScience.status} escapeHtml={false} />
            }
          </div>
          {_.toPairs(actionTooltips).map(([key, { label, long }]) => (
            <div key={key}>
              <Divider />
              <div style={{ padding: '0 1em' }}>
                <b>
                  Valinta "<i>{label}</i>"
                </b>
                <div style={{ margin: '0.5em' }}>{long}</div>
              </div>
            </div>
          ))}
        </Popup>
      </div>

      <div style={{ display: 'flex', marginBottom: '20px', marginRight: '40px', alignItems: 'center' }}>
        <Breadcrumb icon="right angle" sections={breadcrumb} size="large" />
        {drillStack.length > 0 && (
          <Icon
            onClick={popFromDrillStack}
            style={{ cursor: 'pointer', color: 'rgba(0,0,0,.28)', marginLeft: '0.4em', marginTop: '-0.17em' }}
            name="arrow left"
          />
        )}
      </div>

      {data && !loading ? (
        <StatusContent settings={settings} onDrill={pushToDrillStack} data={drilledData} />
      ) : (
        <Loader active={loading} inline="centered" />
      )}
    </>
  )
}

export default Status
