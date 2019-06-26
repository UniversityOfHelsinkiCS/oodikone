import React, { Component } from 'react'
import { Tab, Grid, Radio, Menu } from 'semantic-ui-react'
import { dataSeriesType, viewModeNames } from './Panes/util'
import PassRate from './Panes/passRate'
import Distribution from './Panes/distribution'
import Tables from './Panes/tables'

import './resultTabs.css'

const paneViewIndex = {
  TABLE: 0,
  PASS_RAGE: 1,
  GRADE_DISTRIBUTION: 2
}

class ResultTabs extends Component {
  state = {
    activeIndex: paneViewIndex.TABLE,
    viewMode: viewModeNames.CUMULATIVE,
    isRelative: false
  }

  getPanes = () => {
    const { primary, comparison } = this.props
    const { viewMode, isRelative } = this.state

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
              {this.renderViewModeSelector()}
            </Grid.Row>
            {renderFn()}
          </Grid>
        )
      }
    })
  }

  handleTabChange = (e, { activeIndex }) => {
    const { viewMode, activeIndex: oldIndex } = this.state
    const resetViewMode = oldIndex === paneViewIndex.TABLE
      && viewMode === viewModeNames.GRADES

    this.setState({
      activeIndex,
      viewMode: resetViewMode ? viewModeNames.CUMULATIVE : viewMode
    })
  }

  handleModeChange = (viewMode) => {
    this.setState({ viewMode })
  }

  renderViewModeSelector = () => {
    const { activeIndex, viewMode } = this.state

    const isTogglePane = activeIndex !== 0

    const getButtonMenu = () => (
      <Menu secondary>
        {Object.values(viewModeNames).map(name => (
          <Menu.Item
            key={name}
            name={name}
            active={viewMode === name}
            onClick={() => this.handleModeChange(name)}
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
              onChange={() => this.handleModeChange(newMode)}
            />
            <label className="toggleLabel" htmlFor={toggleId}>{viewModeNames.STUDENT}</label>
          </div>
          {this.props.comparison &&
            <div className="toggleContainer">
              <label className="toggleLabel">Absolute</label>
              <Radio
                toggle
                checked={this.state.isRelative}
                onChange={() => this.setState({ isRelative: !this.state.isRelative })}
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

  render() {
    return (
      <div>
        <Tab
          panes={this.getPanes()}
          onTabChange={this.handleTabChange}
        />
      </div>)
  }
}

ResultTabs.propTypes = {
  primary: dataSeriesType.isRequired,
  comparison: dataSeriesType
}

ResultTabs.defaultProps = {
  comparison: undefined
}

export default ResultTabs
