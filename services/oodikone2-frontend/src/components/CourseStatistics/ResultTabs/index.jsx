import React, { useState } from 'react'
import { Tab, Grid, Radio, Menu } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { shape, bool } from 'prop-types'
import { dataSeriesType, viewModeNames } from './Panes/util'
import PassRate from './Panes/passRate'
import Distribution from './Panes/distribution'
import Tables from './Panes/tables'
import { useTabs } from '../../../common/hooks'

import './resultTabs.css'
import TSA from '../../../common/tsa'

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
  const [isRelative, setIsRelative] = useState(false)

  const handleTabChange = (...params) => {
    const resetViewMode = params[1].activeIndex === paneViewIndex.TABLE && viewMode === viewModeNames.GRADES
    const { activeIndex } = params[1]
    const currentTab = params[1].panes[activeIndex]
    sendAnalytics(`Current tab '${currentTab.menuItem.content}'`, 'Course statistics')
    setTab(...params)
    setViewMode(resetViewMode ? viewModeNames.ATTEMPTS : viewMode)
  }

  const handleModeChange = newViewMode => {
    sendAnalytics(`Current view mode '${newViewMode}'`, 'Course statistics')
    setViewMode(newViewMode)
  }

  const getRelativeButton = () => (
    <div className="toggleContainer">
      <label className="toggleLabel">Absolute</label>
      <Radio toggle checked={isRelative} onChange={() => setIsRelative(!isRelative)} />
      <label className="toggleLabel">Relative</label>
    </div>
  )

  const renderViewModeSelector = () => {
    const isTogglePane = tab !== 0
    const getButtonMenu = () => (
      <>
        <Menu secondary>
          {Object.values(viewModeNames).map(name => (
            <Menu.Item key={name} name={name} active={viewMode === name} onClick={() => handleModeChange(name)} />
          ))}
        </Menu>
        {viewMode === 'Grades' && getRelativeButton()}
      </>
    )

    const getToggle = () => {
      const isToggleChecked = viewMode === viewModeNames.STUDENT
      const newMode = isToggleChecked ? viewModeNames.ATTEMPTS : viewModeNames.STUDENT
      const toggleId = 'viewModeToggle'
      return (
        <div style={{ display: 'flex' }}>
          <div className="toggleContainer">
            <label className="toggleLabel" htmlFor={toggleId}>
              {viewModeNames.ATTEMPTS}
            </label>
            <Radio id={toggleId} checked={isToggleChecked} toggle onChange={() => handleModeChange(newMode)} />
            <label className="toggleLabel" htmlFor={toggleId}>
              {viewModeNames.STUDENT}
            </label>
          </div>
          {(tab === 2 || props.comparison) && getRelativeButton()}
        </div>
      )
    }

    return <div className="modeSelectorContainer">{isTogglePane ? getToggle() : getButtonMenu()}</div>
  }

  const getPanes = () => {
    const { primary, comparison, separate } = props
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
          />
        )
      },
      {
        menuItem: { key: 'grade', icon: 'chart bar', content: 'Grade distribution chart' },
        renderFn: () => (
          <Distribution comparison={comparison} primary={primary} viewMode={viewMode} isRelative={isRelative} />
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
