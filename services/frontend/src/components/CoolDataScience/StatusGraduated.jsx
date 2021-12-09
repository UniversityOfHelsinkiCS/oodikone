import React, { useState, useMemo, useEffect, useRef } from 'react'
import PropTypes, { shape, bool, func } from 'prop-types'
import { connect } from 'react-redux'
import { Divider, Segment, Loader, Dimmer, Icon, Checkbox, Form, Popup, Button } from 'semantic-ui-react'
import _ from 'lodash'
import moment from 'moment'
import ReactMarkdown from 'react-markdown'
import Datetime from 'react-datetime'

import WithHelpTooltip from './WithHelpTooltip'
import TSA from '../../common/tsa'
import { getTextIn } from '../../common'
import { useLocalStorage } from '../../common/hooks'
import InfoToolTips from '../../common/InfoToolTips'
import DrillStack from './DrillStack'
import { getStatusGraduated } from '../../redux/coolDataScience'
import './status.css'

const ANALYTICS_CATEGORY = 'Trends'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const getP = (a, b) => {
  if (a === 0 || b === 0) return 1
  return a / b
}

const isValidDate = d => moment().diff(moment(d)) > 0

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
      Näyttää vuosittaisen valmistumiskertymän tähän päivään mennessä vuonna X
      sekä koko lukuvuoden X valmistuneet muodossa *"kerääntymä vuonna X / koko
      lukuvuoden X valmistuneet"*.
    `,
    defaultValue: false,
  },

  showCountingFrom: {
    key: 'selectedDate',
    label: 'Näytä päivänä',
    short: 'Valitse päivä johon asti kertyneet tilastot näytetään.',
    long: `
      Tämä valinta määrittää päivämäärän, jota käyttäen kertyneet tilastot lasketaan.
      Esimerkiksi "Näytä kalenterivuosittain" valinnan ollessa pois päältä,
      lasketaan kertyneet tilastot (vrt. lukuvuosien kokonaistilastot) kunkin lukuvuoden alusta
      tätä päivämäärää vastaavaan päivään kyseisenä lukuvuonna.
    `,
    defaultValue: () => moment(),
  },
}

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

const createDrillData = data => {
  if (!data) return null

  return Object.values(data).map(item => ({
    key: item.code,
    label: getTextIn(item.name),
    currentValue: item.current,
    previousValue: item.previous,
    children: createDrillData(item.drill),
    ..._.omit(item, 'drill'),
  }))
}

const getDefaultSettings = () =>
  _.chain(settingDefinitions)
    .toPairs()
    .map(([key, { key: definedKey, defaultValue }]) =>
      typeof defaultValue === 'function' ? [definedKey ?? key, defaultValue()] : [definedKey ?? key, defaultValue]
    )
    .fromPairs()
    .value()

const Status = ({ getStatusGraduatedDispatch, data, loading }) => {
  const [explicitSettings, setSettings] = useLocalStorage('trendsGraduationStatusSettings', {})
  const [usageDetailsOpen, setUsageDetailsOpen] = useState(false)
  const moreDetailsRef = useRef(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const attentionSeekers = useRef({})

  const settings = useMemo(() => _.defaults(explicitSettings, getDefaultSettings()), [explicitSettings])

  const { showYearlyValues, showByYear, selectedDate } = settings

  const { CoolDataScience } = InfoToolTips
  const isValidDate = d => moment.isMoment(d) && moment().diff(d) > 0

  useEffect(() => {
    if (selectedDate && isValidDate(selectedDate)) {
      getStatusGraduatedDispatch({ date: selectedDate.valueOf(), showByYear })
    }
  }, [selectedDate, showByYear])

  const drillData = useMemo(() => createDrillData(data), [data])

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

  if (!data || loading)
    return (
      <div style={{ padding: '2rem' }}>
        <Dimmer inverted active />
        <Loader active={loading} />
      </div>
    )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }} ref={moreDetailsRef}>
        <h2 style={{ margin: 0, flexGrow: 1 }}>Koulutusohjelmista valmistuneet</h2>
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
              <ReactMarkdown children={CoolDataScience.statusGraduated} escapeHtml={false} />
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

      <DrillStack
        historyKey="StatusGraduated"
        data={drillData}
        renderCard={(data, drill, { medianDiff }) => (
          <StatusContainer
            key={data.code}
            clickable={!!data.children}
            handleClick={drill}
            title={getTextIn(data.name)}
            current={data.current}
            previous={data.previous}
            showYearlyValues={showYearlyValues}
            min1={-medianDiff * 2}
            max1={medianDiff * 2}
            yearlyValues={data.yearly}
            showByYear={showByYear}
          />
        )}
      />
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
