import React, { useState } from 'react'
import { Segment, Tab } from 'semantic-ui-react'
import { GradeDistributionChart } from './charts/GradeDistributionChart'
import { PassRateChart } from './charts/PassRateChart'
import { ChartSettings } from './settings/ChartSettings'
import { TableSettings } from './settings/TableSettings'

const TableSection = ({
  availableStats,
  datasets,
  settings,
  setSettings,
  setSplitDirection,
  tableComponent: Table,
  toggleSeparate,
  styleContainer,
  styleData,
  userHasAccessToAllStats,
}) => {
  return (
    <>
      <div style={{ marginBottom: '1em' }}>
        <TableSettings
          availableStats={availableStats}
          datasets={datasets}
          onChange={setSettings}
          onSeparateChange={toggleSeparate}
          setSplitDirection={setSplitDirection}
          value={settings}
        />
      </div>
      <div style={styleContainer}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div key={data.name} style={styleData}>
              <Table data={data} settings={settings} userHasAccessToAllStats={userHasAccessToAllStats} />
            </div>
          ))}
      </div>
    </>
  )
}

const PassRateChartSection = ({
  datasets,
  isRelative,
  setIsRelative,
  styleContainer,
  styleData,
  userHasAccessToAllStats,
  viewMode,
}) => {
  return (
    <>
      <ChartSettings isRelative={isRelative} setIsRelative={setIsRelative} tab="PassRate" viewMode={viewMode} />
      <div style={styleContainer}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div key={data.name} style={styleData}>
              <PassRateChart
                data={data}
                isRelative={isRelative}
                userHasAccessToAllStats={userHasAccessToAllStats}
                viewMode={viewMode}
              />
            </div>
          ))}
      </div>
    </>
  )
}

const GradeDistributionChartSection = ({
  datasets,
  isRelative,
  setIsRelative,
  styleContainer,
  styleData,
  userHasAccessToAllStats,
}) => {
  return (
    <>
      <ChartSettings isRelative={isRelative} setIsRelative={setIsRelative} tab="GradeDistribution" />
      <div style={styleContainer}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div key={data.name} style={styleData}>
              <GradeDistributionChart
                data={data}
                isRelative={isRelative}
                userHasAccessToAllStats={userHasAccessToAllStats}
              />
            </div>
          ))}
      </div>
    </>
  )
}

/**
 * A generalized pane component that is used on the Students and the Attempts tabs.
 * Contains settings and table for the corresponding tab and the pass rate chart.
 *
 * @param tableComponent - Should be either StudentsTable or AttemptsTable
 */
export const Pane = ({
  availableStats,
  datasets,
  initialSettings,
  tableComponent,
  updateQuery,
  userHasAccessToAllStats,
}) => {
  const [settings, setSettings] = useState(initialSettings)

  const setSplitDirection = splitDirection => {
    setSettings({ ...settings, splitDirection })
  }

  const toggleSeparate = separate => {
    setSettings({ ...settings, separate })
    updateQuery(separate)
  }

  const halfWidth = datasets.filter(dataset => dataset).length > 1 && settings.splitDirection === 'row'
  const styleContainer = {
    display: 'flex',
    flexDirection: settings.splitDirection,
    justifyContent: 'space-between',
  }
  const styleData = {
    flexGrow: 1,
    flexBasis: 1,
    marginBottom: halfWidth ? '0px' : '20px',
    maxWidth: halfWidth ? '49%' : '100%',
  }

  return (
    <Tab.Pane>
      <Segment basic>
        <TableSection
          availableStats={availableStats}
          datasets={datasets}
          setSettings={setSettings}
          setSplitDirection={setSplitDirection}
          settings={settings}
          styleContainer={styleContainer}
          styleData={styleData}
          tableComponent={tableComponent}
          toggleSeparate={toggleSeparate}
          userHasAccessToAllStats={userHasAccessToAllStats}
        />
        {settings.showGrades ? (
          <GradeDistributionChartSection
            datasets={datasets}
            isRelative={settings.isRelative}
            setIsRelative={isRelative => setSettings({ ...settings, isRelative })}
            styleContainer={styleContainer}
            styleData={styleData}
            userHasAccessToAllStats={userHasAccessToAllStats}
          />
        ) : (
          <PassRateChartSection
            datasets={datasets}
            isRelative={settings.isRelative}
            setIsRelative={isRelative => setSettings({ ...settings, isRelative })}
            styleContainer={styleContainer}
            styleData={styleData}
            userHasAccessToAllStats={userHasAccessToAllStats}
            viewMode={settings.viewMode}
          />
        )}
      </Segment>
    </Tab.Pane>
  )
}
