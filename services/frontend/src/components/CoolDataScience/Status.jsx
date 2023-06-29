import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Loader } from 'semantic-ui-react'
import _ from 'lodash'
import moment from 'moment'
import useLanguage from 'components/LanguagePicker/useLanguage'
import DrillStack from './DrillStack'
import StatusCard from './StatusCard'
import Toolbar from './Toolbar'
import TSA from '../../common/tsa'
import { useLocalStorage } from '../../common/hooks'
import InfoToolTips from '../../common/InfoToolTips'
import { getStatus } from '../../redux/coolDataScience'
import './status.css'

const ANALYTICS_CATEGORY = 'Trends'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const settingDefinitions = _.map(
  [
    {
      key: 'showByYear',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      key: 'showYearlyValues',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      key: 'showRelativeValues',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      key: 'showStudentCounts',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      key: 'showCountingFrom',
      type: 'date',
      defaultValue: () => moment().endOf('day'),
      persist: false,
    },
  ],
  setting => ({
    ...setting,
    ...InfoToolTips.CoolDataScience.status.settings[setting.key],
  })
)

const StatusContainer = ({
  stats,
  handleClick,
  min1,
  max1,
  showYearlyValues,
  showRelativeValues,
  showCountingFrom,
  showByYear,
  showStudentCounts,
  clickable,
}) => {
  const { getTextIn } = useLanguage()
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

  let yearlyValues = null

  if (showYearlyValues) {
    yearlyValues = _.chain(stats.yearly)
      .toPairs()
      .map(([year, stats]) => ({
        dateRange: {
          start: showByYear ? moment([year]).startOf('year') : moment([year]).month(7).date(1),
          end: showByYear
            ? moment([year]).startOf('year')
            : moment([parseInt(year, 10) + 1])
                .month(6)
                .date(31),
        },
        stats,
      }))
      .filter(({ dateRange: { start } }) => moment(showCountingFrom).isSameOrAfter(start))
      .orderBy(({ dateRange: { start } }) => start, ['desc'])
      .map(({ dateRange, stats }) => ({
        label: _.chain([dateRange.start, dateRange.end])
          .map(date => date.year())
          .uniq()
          .join('-')
          .value(),
        accumulated: showStudentCounts && stats.type === 'course' ? stats.accStudents : stats.acc,
        total: showStudentCounts && stats.type === 'course' ? stats.totalStudents : stats.total,
      }))
      .value()
  }

  return (
    <StatusCard
      title={title}
      clickable={clickable}
      onClick={handleClick}
      changeRange={[min1, max1]}
      currentValue={current}
      previousValue={previous}
      precision={0}
      tooltip={stats.code}
      unit={stats.type === 'course' && showStudentCounts ? 'students' : null}
      yearlyValues={yearlyValues}
    />
  )
}

const StatusContent = ({ data, settings }) => {
  const { showByYear, showRelativeValues, showYearlyValues, showStudentCounts, showCountingFrom } = settings

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
          showCountingFrom={showCountingFrom}
          min1={-2 * medianDiff}
          max1={2 * medianDiff}
          showByYear={showByYear}
        />
      )}
    />
  )
}

const getDefaultSettings = () =>
  _.chain(settingDefinitions)
    .map(({ key, defaultValue }) => (typeof defaultValue === 'function' ? [key, defaultValue()] : [key, defaultValue]))
    .fromPairs()
    .value()

const createDrillData = (storeData, showRelativeValues, getTextIn) => {
  if (!storeData) return null

  return Object.values(storeData).map(item => ({
    key: item.code,
    label: getTextIn(item.name),
    children: createDrillData(item.drill, showRelativeValues, getTextIn),
    currentValue: showRelativeValues ? item.current / item.currentStudents : item.current,
    previousValue: showRelativeValues ? item.previous / item.previousStudents : item.previous,
    ..._.omit(item, 'drill'),
  }))
}

const isValidDate = d => moment().diff(moment(d)) > 0

const Status = () => {
  const [explicitSettings, setSettings] = useLocalStorage('trendsStatusSettings', {})
  const [nonpersistentExplicitSettings, setNonpersistentSettings] = useState({})
  const { getTextIn } = useLanguage()
  const storeData = useSelector(state => state.coolDataScience.data.status)
  const loading = useSelector(state => state.coolDataScience.pending.status)
  const dispatch = useDispatch()

  const settings = useMemo(
    () => _.defaults({ ...explicitSettings, ...nonpersistentExplicitSettings }, getDefaultSettings()),
    [explicitSettings, nonpersistentExplicitSettings]
  )

  const data = useMemo(
    () => createDrillData(storeData, settings.showRelativeValues, getTextIn),
    [storeData, settings.showRelativeValues]
  )

  const { CoolDataScience } = InfoToolTips

  useEffect(() => {
    const { showCountingFrom, showByYear } = settings

    let date

    if (!showCountingFrom) {
      date = moment().endOf('day').valueOf()
    } else if (isValidDate(showCountingFrom)) {
      date = moment(showCountingFrom).endOf('day').valueOf()
    } else {
      return
    }

    dispatch(
      getStatus({
        date,
        showByYear,
      })
    )
  }, [settings.showCountingFrom, settings.showByYear])

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
        <h2 style={{ margin: 0, flexGrow: 1 }}>Koulutusohjelmien tuottamat opintopisteet</h2>
        <Toolbar
          value={settings}
          settings={settingDefinitions}
          generalHelp={CoolDataScience.status.general}
          changeSetting={changeSetting}
        />
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
