import React, { Component } from 'react'
import { Tab, Grid, Radio, Form, Menu } from 'semantic-ui-react'
import { dataSeriesType, viewModeNames } from './Panes/util'
import PassRate from './Panes/passRate'
import Distribution from './Panes/distribution'
import Tables from './Panes/tables'


const paneViewIndex = {
  TABLE: 0,
  PASS_RAGE: 1,
  GRADE_DISTRIBUTION: 2
}


class ResultTabs extends Component {
  state = {
    activeIndex: paneViewIndex.TABLE,
    viewMode: viewModeNames.CUMULATIVE
  }

  getPanes = () => {
    const { primary, comparison } = this.props
    const { viewMode } = this.state

    const paneMenuItems = [
      { menuItem: { key: 'Table', icon: 'table', content: 'Table' },
        renderFn: () => <Tables comparison={comparison} primary={primary} viewMode={viewMode} /> },
      { menuItem: { key: 'pass', icon: 'balance', content: 'Pass rate chart' },
        renderFn: () => <PassRate comparison={comparison} primary={primary} viewMode={viewMode} /> },
      { menuItem: { key: 'grade', icon: 'chart bar', content: 'Grade distribution chart' },
        renderFn: () => <Distribution comparison={comparison} primary={primary} viewMode={viewMode} /> }
    ]

    return paneMenuItems.map((p) => {
      const { menuItem, renderFn } = p
      return {
        menuItem,
        render: () => (
          <Grid padded="vertically" columns="equal">
            <Grid.Row>
              {renderFn()}
            </Grid.Row>
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
            name={name}
            active={viewMode === name}
            onClick={() => this.handleModeChange(name)}
          />))}
      </Menu>
    )

    const getToggle = () => {
      const isToggleChecked = viewMode === viewModeNames.STUDENT
      const newMode = isToggleChecked ? viewModeNames.CUMULATIVE : viewModeNames.STUDENT

      return (
        <Form>
          <Form.Group inline >
            <Form.Field>
              <label>{viewModeNames.CUMULATIVE}</label>
            </Form.Field>
            <Form.Field>
              <Radio
                checked={isToggleChecked}
                toggle
                onChange={() => this.handleModeChange(newMode)}
              />
            </Form.Field>
            <Form.Field>
              <label>{viewModeNames.STUDENT}</label>
            </Form.Field>
          </Form.Group>
        </Form>
      )
    }

    return isTogglePane ? getToggle() : getButtonMenu()
  }

  render() {
    return (
      <div>
        {this.renderViewModeSelector()}
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
