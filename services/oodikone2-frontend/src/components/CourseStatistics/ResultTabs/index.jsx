import React, { useEffect, useState } from 'react'
import { Tab, Grid, Radio, Menu } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { shape, bool } from 'prop-types'
import { dataSeriesType, viewModeNames } from './Panes/util'
import PassRate from './Panes/passRate'
import Distribution from './Panes/distribution'
import Tables from './Panes/tables'
import InfoBox from '../../InfoBox'
import { useTabs } from '../../../common/hooks'

import './resultTabs.css'
import TSA from '../../../common/tsa'
import infotooltips from '../../../common/InfoToolTips'

const ANALYTICS_CATEGORY = 'Course Statistics'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const paneViewIndex = {
  TABLE: 0,
  PASS_RAGE: 1,
  GRADE_DISTRIBUTION: 2
}

const ResultTabs = props => {
  const [tab, setTab] = useTabs('cs_tab', 0, props.history)
  const [viewMode, setViewMode] = useState(viewModeNames.ATTEMPTS)
  const [selectedView, setSelectedView] = useState(true)
  const [isRelative, setIsRelative] = useState(false)
  const [showGrades, setShowGrades] = useState(false)

  const handleModeChange = newViewMode => {
    sendAnalytics(`Current view mode '${newViewMode}'`, 'Course statistics')
    setViewMode(newViewMode)
  }

  useEffect(() => {
    const newViewMode = selectedView ? viewModeNames.ATTEMPTS : viewModeNames.STUDENT
    handleModeChange(newViewMode)
  }, [selectedView])

  const handleTabChange = (...params) => {
    const resetViewMode = params[1].activeIndex === paneViewIndex.TABLE && viewMode === viewModeNames.ATTEMPTS
    const { activeIndex } = params[1]
    const currentTab = params[1].panes[activeIndex]
    sendAnalytics(`Current tab '${currentTab.menuItem.content}'`, 'Course statistics')
    setTab(...params)
    setViewMode(resetViewMode ? viewModeNames.ATTEMPTS : viewMode)
  }

  const getRadioButton = (id, firstLabel, secondLabel, value, setValue) => (
    <div className="toggleContainer">
      <label className="toggleLabel">{firstLabel}</label>
      <Radio id={id} toggle checked={value} onChange={() => setValue(!value)} />
      <label className="toggleLabel">{secondLabel}</label>
    </div>
  )

  const renderViewModeSelector = () => {
    const isTogglePane = tab !== 0
    const getButtonMenu = () => (
      <Menu secondary>
        {Object.values(viewModeNames).map(name => (
          <Menu.Item key={name} name={name} active={viewMode === name} onClick={() => handleModeChange(name)} />
        ))}
        {viewMode === 'Attempts' && getRadioButton('gradeToggle', 'Totals', 'Grade distribution', showGrades, setShowGrades)}
        {viewMode === 'Attempts' && showGrades && getRadioButton('relativeToggle', 'Absolute', 'Relative', isRelative, setIsRelative)}
      </Menu>
    )

    const getToggle = () => {
      return (
        <div className="chartToggleContainer">
          {tab === 1 && getRadioButton('studentToggle', 'Student', 'Attempts', selectedView, setSelectedView)}
          {(tab === 2 || props.comparison) && getRadioButton('relativeToggle', 'Absolute', 'Relative', isRelative, setIsRelative)}
        </div>
      )
    }

    // Remove "false" and activate infoboxes when the texts for them are ready
    return (
      <div className="modeSelectorContainer">
        {isTogglePane ? getToggle() : getButtonMenu()}
        {false && <InfoBox content={infotooltips.CourseStatistics[tab][viewMode]} />}
      </div>
    )
  }

  const getPanes = () => {
    const { primary, comparison, separate } = props
    const { userHasAccessToAllStats } = primary

    const paneMenuItems = [
      {
        menuItem: { key: 'Table', icon: 'table', content: 'Table' },
        renderFn: () => (
          <Tables
            separate={separate}
            comparison={comparison}
            primary={primary}
            viewMode={viewMode}
            isRelative={isRelative}
            showGrades={showGrades}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        )
      },
      {
        menuItem: { key: 'pass', icon: 'balance', content: 'Pass rate chart' },
        renderFn: () => (
          <PassRate
            comparison={comparison}
            primary={primary}
            viewMode={viewMode}
            isRelative={isRelative && !!comparison}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        )
      },
      {
        menuItem: { key: 'grade', icon: 'chart bar', content: 'Grade distribution chart' },
        renderFn: () => (
          <Distribution
            comparison={comparison}
            primary={primary}
            isRelative={isRelative}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        )
      }
    ]

    return paneMenuItems.map(p => {
      const { menuItem, renderFn } = p
      return {
        menuItem,
        render: () => (
          <Grid padded="vertically" columns="equal">
            <Grid.Row className="modeSelectorRow">{renderViewModeSelector()}</Grid.Row>
            {renderFn()}
          </Grid>
        )
      }
    })
  }

  return (
    <div>
      <Tab id="CourseStatPanes" panes={getPanes()} onTabChange={handleTabChange} activeIndex={tab} />
    </div>
  )
}

ResultTabs.propTypes = {
  primary: dataSeriesType.isRequired,
  comparison: dataSeriesType,
  history: shape({}).isRequired,
  separate: bool
}

ResultTabs.defaultProps = {
  comparison: undefined,
  separate: false
}

export default withRouter(ResultTabs)
