import React, { useState } from 'react'
import { Tab, Grid, Radio, Menu } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { shape } from 'prop-types'
import { dataSeriesType, viewModeNames } from './Panes/util'
import PassRate from './Panes/passRate'
import Distribution from './Panes/distribution'
import Tables from './Panes/tables'
import { useTabs } from '../../../common'

import './resultTabs.css'

const paneViewIndex = {
  TABLE: 0,
  PASS_RAGE: 1,
  GRADE_DISTRIBUTION: 2
}

const ResultTabs = (props) => {
  const [tab, setTab] = useTabs(
    'cs_tab',
    0,
    props.history
  )
  const [viewMode, setViewMode] = useState(viewModeNames.CUMULATIVE)
  const [isRelative, setIsRelative] = useState(false)

  const handleTabChange = (...params) => {
    const resetViewMode = params[1].activeIndex === paneViewIndex.TABLE
      && viewMode === viewModeNames.GRADES

    setTab(...params)
    setViewMode(resetViewMode ? viewModeNames.CUMULATIVE : viewMode)
  }

  const handleModeChange = (newViewMode) => {
    setViewMode(newViewMode)
  }

  const renderViewModeSelector = () => {
    const isTogglePane = tab !== 0

    const getButtonMenu = () => (
      <Menu secondary>
        {Object.values(viewModeNames).map(name => (
          <Menu.Item
            key={name}
            name={name}
            active={viewMode === name}
            onClick={() => handleModeChange(name)}
          />))}
      </Menu>
    )

    const getToggle = () => {
      const isToggleChecked = viewMode === viewModeNames.STUDENT
      const newMode = isToggleChecked ? viewModeNames.CUMULATIVE : viewModeNames.STUDENT
      const toggleId = 'viewModeToggle'
      return (
        <div style={{ display: 'flex' }}>
          <div className="toggleContainer">
            <label className="toggleLabel" htmlFor={toggleId}>{viewModeNames.CUMULATIVE}</label>
            <Radio
              id={toggleId}
              checked={isToggleChecked}
              toggle
              onChange={() => handleModeChange(newMode)}
            />
            <label className="toggleLabel" htmlFor={toggleId}>{viewModeNames.STUDENT}</label>
          </div>
          {props.comparison &&
            <div className="toggleContainer">
              <label className="toggleLabel">Absolute</label>
              <Radio
                toggle
                checked={isRelative}
                onChange={() => setIsRelative(!isRelative)}
              />
              <label className="toggleLabel">Relative</label>
            </div>
          }
        </div>
      )
    }

    return (
      <div className="modeSelectorContainer">
        {isTogglePane ? getToggle() : getButtonMenu()}
      </div>
    )
  }

  const getPanes = () => {
    const { primary, comparison } = props

    const paneMenuItems = [
      {
        menuItem: { key: 'Table', icon: 'table', content: 'Table' },
        renderFn: () =>
          (<Tables
            comparison={comparison}
            primary={primary}
            viewMode={viewMode}
          />)
      },
      {
        menuItem: { key: 'pass', icon: 'balance', content: 'Pass rate chart' },
        renderFn: () =>
          (<PassRate
            comparison={comparison}
            primary={primary}
            viewMode={viewMode}
            isRelative={isRelative && comparison}
          />)
      },
      {
        menuItem: { key: 'grade', icon: 'chart bar', content: 'Grade distribution chart' },
        renderFn: () =>
          (<Distribution
            comparison={comparison}
            primary={primary}
            viewMode={viewMode}
            isRelative={isRelative && comparison}
          />)
      }
    ]

    return paneMenuItems.map((p) => {
      const { menuItem, renderFn } = p
      return {
        menuItem,
        render: () => (
          <Grid padded="vertically" columns="equal">
            <Grid.Row className="modeSelectorRow">
              {renderViewModeSelector()}
            </Grid.Row>
            {renderFn()}
          </Grid>
        )
      }
    })
  }

  return (
    <div>
      <Tab
        panes={getPanes()}
        onTabChange={handleTabChange}
        activeIndex={tab}
      />
    </div>
  )
}

ResultTabs.propTypes = {
  primary: dataSeriesType.isRequired,
  comparison: dataSeriesType,
  history: shape({}).isRequired
}

ResultTabs.defaultProps = {
  comparison: undefined
}

export default withRouter(ResultTabs)
