import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Divider, Segment, Button, Popup, Loader, Icon, Checkbox, Form } from 'semantic-ui-react'
import _ from 'lodash'
import moment from 'moment'
import ReactMarkdown from 'react-markdown'
import Datetime from 'react-datetime'
import DrillStack from './DrillStack'

import WithHelpTooltip from './WithHelpTooltip'
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

const settingDefinitions = {
  showByYear: {
    label: 'Näytä kalenterivuosittain',
    short: 'Näytä tilastot kalenterivuosittain lukuvuosien sijasta.',
    long: `
      Kun tämä valinta on käytössä, vuosittaiset ajanjaksot lasketaan kalenterivuoden alusta sen loppuun.
      Muulloin vuosittaiset ajanjaksot lasketaan lukukauden alusta seuraavan lukukauden alkuun.
    `,
    defaultValue: false,
  },

  showYearlyValues: {
    label: 'Näytä edelliset vuodet',
    short: 'Näytä tilastot vuosittain, alkaen vuodesta 2017.',
    long: `
      Näyttää tilastot vuodesta 2017 eteenpäin.

      Jokaiselta vuodelta näytetään kaksi tilastoa: ajanjakson kokonaistilasto ja ns. tähän mennessä "*kertynyt*" tilasto.
      Kokonaistilasto vastaa nimensä mukaisesti koko ajanjaksoa, kun taas *kertynyt* tilasto kattaa ajanjakson vuoden 
      tai lukuvuoden alusta "Näytä päivänä"-valintaa vastaavaan päivämäärään tuona vuotena. Luvut näytetään muodossa *<kerynyt>*/*<kokonais>*.
      Kuluvalta vuodelta näytetään ainoastaan kertynyt tilasto.
    `,
    defaultValue: false,
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
    defaultValue: false,
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
    defaultValue: null,
  },

  showStudentCounts: {
    label: 'Näytä kurssien opiskelijamäärät',
    short: 'Näyttää suoritettujen opintopisteiden sijasta opiskelijoiden määrät kurssitason näkymässä.',
    long: `
      Oletuksena kurssitason näkymässä näytetään organisaatio- ja ohjelmatason näkymien tapaan suoritettujen opintopisteiden
      kokonaismäärä. Kun tämä valinta on käytössä, tämän sijasta näytettävät luvut vastaavat kurssin suorittaneiden 
      *yksilöityjen* opiskelijoiden määrää. Kukin opiskelija lasketaan siis vain kerran tähän tilastoon.
    `,
    defaultValue: false,
  },
}

const StatusContainer = ({
  stats,
  handleClick,
  min1,
  max1,
  showYearlyValues,
  showRelativeValues,
  showByYear,
  showStudentCounts,
  clickable,
}) => {
  const title = getTextIn(stats.name)

  let current
  let previous

  if (stats.type === 'course') {
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
                {stats.type === 'course' && showStudentCounts ? (
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

const StatusContent = ({ data, settings }) => {
  const { showByYear, showRelativeValues, showYearlyValues, showStudentCounts } = settings

  return (
    <DrillStack
      historyKey="Status"
      data={data}
      rootLabel="Helsingin Yliopisto"
      renderCard={(data, drill, { medianDiff }) => (
        <StatusContainer
          key={data.code}
          clickable={!!data.children}
          stats={data}
          handleClick={drill}
          showRelativeValues={showRelativeValues}
          showYearlyValues={showYearlyValues}
          showStudentCounts={showStudentCounts}
          min1={-2 * medianDiff}
          max1={2 * medianDiff}
          showByYear={showByYear}
        />
      )}
    />
  )
}

const isValidDate = d => moment().diff(moment(d)) > 0

const StatusSettings = ({ onSettingsChange, settings, onOpenDetails }) => {
  const { selectedDate } = settings
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

  const createSettingToggle = key => (
    <div style={itemStyles}>
      <WithHelpTooltip tooltip={settingDefinitions[key].short} onOpenDetails={() => onOpenDetails(key)}>
        <Checkbox
          style={{ fontSize: '0.9em', fontWeight: 'normal' }}
          label={settingDefinitions[key].label}
          checked={settings[key]}
          onChange={() => changeSetting(key, !settings[key])}
        />
      </WithHelpTooltip>
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', padding: 0, flexDirection: 'column' }}>
      {createSettingToggle('showYearlyValues')}
      {createSettingToggle('showByYear')}
      {createSettingToggle('showRelativeValues')}
      {createSettingToggle('showStudentCounts')}
      <div style={itemStyles}>
        <Form>
          <Form.Field
            error={selectedDate !== null && !isValidDate(selectedDate)}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <WithHelpTooltip
              tooltip={settingDefinitions.showCountingFrom.short}
              onOpenDetails={() => onOpenDetails('showCountingFrom')}
            >
              <span style={{ fontSize: '0.9em' }}>{settingDefinitions.showCountingFrom.label}</span>
            </WithHelpTooltip>
            <Datetime
              className="status-date-time-input"
              dateFormat={DATE_FORMAT}
              timeFormat={false}
              closeOnSelect
              value={moment(selectedDate)}
              locale="fi"
              isValidDate={isValidDate}
              inputProps={{ placeholder: 'Valise päivämäärä' }}
              onChange={value => {
                changeSetting('selectedDate', value.format(DATE_FORMAT) === moment().format(DATE_FORMAT) ? null : value)
              }}
            />
          </Form.Field>
        </Form>
      </div>
    </div>
  )
}

const getDefaultSettings = () =>
  _.chain(settingDefinitions)
    .toPairs()
    .map(([key, { defaultValue }]) => [key, defaultValue])
    .fromPairs()
    .value()

const createDrillData = (storeData, showRelativeValues) => {
  if (!storeData) return null

  return Object.values(storeData).map(item => ({
    key: item.code,
    label: getTextIn(item.name),
    children: createDrillData(item.drill),
    currentValue: showRelativeValues ? item.current / item.currentStudents : item.current,
    previousValue: showRelativeValues ? item.previous / item.previousStudents : item.previous,
    ..._.omit(item, 'drill'),
  }))
}

const Status = () => {
  const [explicitSettings, setSettings] = useLocalStorage('trendsStatusSettings', {})
  const [usageDetailsOpen, setUsageDetailsOpen] = useState(false)
  const moreDetailsRef = useRef(null)

  const storeData = useSelector(state => state.coolDataScience.data.status)
  const loading = useSelector(state => state.coolDataScience.pending.status)
  const dispatch = useDispatch()

  const settings = useMemo(() => _.defaults(explicitSettings, getDefaultSettings()), [explicitSettings])

  const data = useMemo(
    () => createDrillData(storeData, settings.showRelativeValues),
    [storeData, settings.showRelativeValues]
  )

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

  const [settingsOpen, setSettingsOpen] = useState(false)
  const attentionSeekers = useRef({})

  const scrollToAttentionSeeker = el => {
    el.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    })
  }

  const attentionSeekerRef = key => ref => {
    if (ref !== null && attentionSeekers.current[key] === true) {
      scrollToAttentionSeeker(ref)
    }

    attentionSeekers.current[key] = ref
  }

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
            onOpenDetails={key => {
              if (moreDetailsRef.current) {
                moreDetailsRef.current.scrollIntoView({
                  block: 'start',
                  inline: 'end',
                  behavior: 'smooth',
                })
              }

              if (attentionSeekers.current[key]) {
                scrollToAttentionSeeker(attentionSeekers.current[key])
              } else {
                attentionSeekers.current[key] = true
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
          {_.toPairs(settingDefinitions).map(([key, { label, long }]) => (
            <div key={key}>
              <Divider />
              <div style={{ padding: '0 1em' }} ref={attentionSeekerRef(key)}>
                <b>
                  Valinta "<i>{label}</i>"
                </b>
                <div style={{ margin: '0.5em', fontSize: '0.9em' }}>
                  <ReactMarkdown escapeHtml={false}>{long.replace(/(^|\n)[ \t]+/g, '\n')}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </Popup>
      </div>

      {data && !loading ? (
        <StatusContent settings={settings} data={data} />
      ) : (
        <Loader active={loading} inline="centered" />
      )}
    </>
  )
}

export default Status
