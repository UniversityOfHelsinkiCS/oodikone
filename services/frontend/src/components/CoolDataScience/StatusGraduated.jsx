import React, { useState, useMemo, useEffect } from 'react'
import PropTypes, { shape, bool, func } from 'prop-types'
import { connect } from 'react-redux'
import { Loader } from 'semantic-ui-react'
import _ from 'lodash'
import moment from 'moment'

import useLanguage from 'components/LanguagePicker/useLanguage'
import StatusCard from './StatusCard'
import Toolbar from './Toolbar'
import TSA from '../../common/tsa'
import { useLocalStorage } from '../../common/hooks'
import InfoToolTips from '../../common/InfoToolTips'
import DrillStack from './DrillStack'
import { getStatusGraduated } from '../../redux/coolDataScience'
import './status.css'

const ANALYTICS_CATEGORY = 'Trends'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const settingDefinitions = [
  {
    key: 'showByYear',
    type: 'checkbox',
    defaultValue: false,
  },
  {
    key: 'showYearlyValues',
    type: 'checkbox',
    defaultValue: false,
  },
  {
    key: 'showCountingFrom',
    type: 'date',
    defaultValue: () => moment(),
    persist: false,
  },
].map(setting => ({ ...setting, ...InfoToolTips.CoolDataScience.statusGraduated.settings[setting.key] }))

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
  let displayedYearlyValues = null

  if (showYearlyValues) {
    displayedYearlyValues = Object.entries(yearlyValues)
      .sort(([b], [a]) => a - b)
      .map(([year, { acc, total }], i) => ({
        label: showByYear ? year : `${year}-${`${Number(year) + 1}`.slice(-2)}`,
        accumulated: acc,
        total: i > 0 ? total : null,
      }))
  }

  return (
    <StatusCard
      title={title}
      changeRange={[min1, max1]}
      currentValue={current}
      previousValue={previous}
      clickable={clickable}
      onClick={handleClick}
      precision={0}
      yearlyValues={displayedYearlyValues}
    />
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

const createDrillData = (data, getTextIn) => {
  if (!data) return null

  return Object.entries(data).map(([key, item]) => ({
    key,
    label: getTextIn(item.name),
    currentValue: item.current,
    previousValue: item.previous,
    children: createDrillData(item.drill, getTextIn),
    ..._.omit(item, 'drill'),
  }))
}

const getDefaultSettings = () =>
  _.chain(settingDefinitions)
    .map(({ key, defaultValue }) => (typeof defaultValue === 'function' ? [key, defaultValue()] : [key, defaultValue]))
    .fromPairs()
    .value()

const Status = ({ getStatusGraduatedDispatch, data, loading }) => {
  const [explicitSettings, setSettings] = useLocalStorage('trendsGraduationStatusSettings', {})
  const [nonpersistentExplicitSettings, setNonpersistentSettings] = useState({})
  const { getTextIn } = useLanguage()

  const settings = useMemo(
    () => _.defaults({ ...explicitSettings, ...nonpersistentExplicitSettings }, getDefaultSettings()),
    [explicitSettings, nonpersistentExplicitSettings]
  )

  if (typeof settings.showCountingFrom === 'string') {
    settings.showCountingFrom = moment(settings.showCountingFrom)
  } else if (settings.showCountingFrom === null) {
    settings.showCountingFrom = moment()
  }

  const { showYearlyValues, showByYear, showCountingFrom } = settings

  const { CoolDataScience } = InfoToolTips
  const isValidDate = d => moment.isMoment(d) && moment().diff(d) > 0

  useEffect(() => {
    if (showCountingFrom && isValidDate(showCountingFrom)) {
      getStatusGraduatedDispatch({ date: showCountingFrom.valueOf(), showByYear })
    }
  }, [showCountingFrom, showByYear])

  const drillData = useMemo(() => createDrillData(data, getTextIn), [data])

  const changeSetting = (property, value) => {
    sendAnalytics(`S Set setting "${property}" to ${value}`, 'Status')

    if (settingDefinitions.find(s => s.key === property).persist === false) {
      setNonpersistentSettings({
        ...nonpersistentExplicitSettings,
        [property]: value,
      })
    } else {
      setSettings({
        ...settings,
        [property]: value,
      })
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, flexGrow: 1 }}>Koulutusohjelmista valmistuneet</h2>
        <Toolbar
          value={settings}
          settings={settingDefinitions}
          generalHelp={CoolDataScience.statusGraduated.general}
          changeSetting={changeSetting}
        />
      </div>

      {data && !loading ? (
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
      ) : (
        <Loader active inline="centered" />
      )}
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
