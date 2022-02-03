import React, { useState } from 'react'
import { Tab, Segment, Menu, Icon } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { PassRate, PassRateSettings } from './Panes/passRate'
import { Distribution, DistributionSettings } from './Panes/distribution'
import { Tables, TablesSettings } from './Panes/tables'
import { useTabs } from '../../../common/hooks'

import './resultTabs.css'
import TSA from '../../../common/tsa'

const ANALYTICS_CATEGORY = 'Course Statistics'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const PaneContent = ({ component: Component, settings: SettingsComponent, initialSettings, datasets, ...rest }) => {
  const [settings, setSettings] = useState(initialSettings)
  const [splitDirection, setSplitDirection] = useState('column')

  return (
    <Tab.Pane>
      <Segment basic>
        <div style={{ display: 'flex', marginBottom: '2em' }}>
          <SettingsComponent value={settings} onChange={setSettings} />
          <div style={{ flexGrow: 1 }} />
          {datasets.filter(i => i).length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
              <label>Split direction: </label>
              <Menu style={{ margin: 0 }}>
                <Menu.Item active={splitDirection === 'row'} onClick={() => setSplitDirection('row')}>
                  <Icon name="arrows alternate horizontal" />
                </Menu.Item>
                <Menu.Item active={splitDirection === 'column'} onClick={() => setSplitDirection('column')}>
                  <Icon name="arrows alternate vertical" />
                </Menu.Item>
              </Menu>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: splitDirection, gap: '2em' }}>
          {datasets
            .filter(i => i)
            .map(data => (
              <div style={{ flexGrow: 1, flexBasis: 1 }}>
                <h3>{data.name}</h3>
                <Component data={data} settings={settings} {...rest} />
              </div>
            ))}
        </div>
      </Segment>
    </Tab.Pane>
  )
}

const ResultTabs = ({ primary, comparison, history }) => {
  const [tab, setTab] = useTabs('cs_tab', 0, history)
  // const [viewMode, setViewMode] = useState(viewModeNames.STUDENT)
  // const [selectedView, setSelectedView] = useState(false)
  // const [isRelative, setIsRelative] = useState(false)
  // const [showGrades, setShowGrades] = useState(false)
  const { userHasAccessToAllStats } = primary

  /* const handleModeChange = newViewMode => {
    sendAnalytics(`Current view mode '${newViewMode}'`, 'Course statistics')
    setViewMode(newViewMode)
  } */

  /* useEffect(() => {
    const newViewMode = selectedView ? viewModeNames.ATTEMPTS : viewModeNames.STUDENT
    handleModeChange(newViewMode)
  }, [selectedView]) */

  const handleTabChange = (...params) => {
    const { activeIndex } = params[1]
    const currentTab = params[1].panes[activeIndex]
    sendAnalytics(`Current tab '${currentTab.menuItem.content}'`, 'Course statistics')
    setTab(...params)
    // setViewMode(resetViewMode ? viewMode : viewModeNames.ATTEMPTS)
  }

  /* const getRadioButton = (firstLabel, secondLabel, value, setValue) => (
    <div className="toggleContainer">
      <label className="toggleLabel">{firstLabel}</label>
      <Radio toggle data-cy="gradeToggle" checked={value} onChange={() => setValue(!value)} />
      <label className="toggleLabel">{secondLabel}</label>
    </div>
  ) */

  /* const renderViewModeSelector = () => {
    const isTogglePane = tab !== 0
    const getButtonMenu = () => (
      <Menu secondary>
        {Object.values(viewModeNames).map(name => (
          <Menu.Item key={name} name={name} active={viewMode === name} onClick={() => handleModeChange(name)} />
        ))}
        {viewMode === 'Attempts' && getRadioButton('Totals', 'Grade distribution', showGrades, setShowGrades)}
        {viewMode === 'Attempts' && showGrades && getRadioButton('Absolute', 'Relative', isRelative, setIsRelative)}
      </Menu>
    )

    const getToggle = () => {
      return (
        <div className="chartToggleContainer">
          {tab === 1 && getRadioButton('Student', 'Attempts', selectedView, setSelectedView)}
          {(tab === 2 || comparison) && getRadioButton('Absolute', 'Relative', isRelative, setIsRelative)}
        </div>
      )
    }

    // Remove "false" and activate infoboxes when the texts for them are ready
    return (
      <div className="modeSelectorContainer">
        {isTogglePane ? getToggle() : getButtonMenu()}
        <InfoBox content={infotooltips.CourseStatistics[tab][viewMode]} />
      </div>
    )
  } */

  /* const getPanes = () => {
    return [
      {
        menuItem: { key: 'Table', icon: 'table', content: 'Table' },
        render: () => (
          <Tables
            separate={separate}
            comparison={comparison}
            primary={primary}
            viewMode={viewMode}
            isRelative={isRelative}
            showGrades={showGrades}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        ),
      },
      {
        menuItem: { key: 'pass', icon: 'balance', content: 'Pass rate chart' },
        render: () => (
          <PassRate
            comparison={comparison}
            primary={primary}
            viewMode={viewMode}
            isRelative={isRelative && !!comparison}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        ),
      },
      {
        menuItem: { key: 'grade', icon: 'chart bar', content: 'Grade distribution chart' },
        render: () => (
          <Distribution
            comparison={comparison}
            primary={primary}
            isRelative={isRelative}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        ),
      },
    ];

    return paneMenuItems.map(p => {
      const { menuItem, renderFn } = p
      return {
        menuItem,
        render: () => (
          <Grid padded="vertically" columns="equal">
            <Grid.Row className="modeSelectorRow">{renderViewModeSelector()}</Grid.Row>
            {renderFn()}
          </Grid>
        ),
      }
    })
  } */

  const paneTypes = [
    {
      label: 'Tables',
      icon: 'table',
      initialSettings: { showDetails: false, viewMode: 'STUDENT' },
      settings: TablesSettings,
      component: Tables,
    },
    {
      label: 'Pass rate chart',
      icon: 'balance',
      initialSettings: { viewMode: 'STUDENT' },
      settings: PassRateSettings,
      component: PassRate,
    },
    {
      label: 'Grade distribution chart',
      icon: 'chart bar',
      initialSettings: { isRelative: false, viewMode: 'STUDENT' },
      settings: DistributionSettings,
      component: Distribution,
    },
  ]

  const panes = paneTypes.map(
    ({ icon, label, initialSettings, component: Component, settings: SettingsComponent }) => ({
      menuItem: { icon, content: label },
      render: () => (
        <PaneContent
          component={Component}
          settings={SettingsComponent}
          userHasAccessToAllStats={userHasAccessToAllStats}
          initialSettings={initialSettings}
          datasets={[primary, comparison]}
        />
      ),
    })
  )

  return (
    <div>
      <Tab id="CourseStatPanes" panes={panes} onTabChange={handleTabChange} activeIndex={tab} />
    </div>
  )
}

export default withRouter(ResultTabs)
