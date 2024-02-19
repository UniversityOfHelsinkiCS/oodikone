import React, { useState } from 'react'
import { GradeDistributionChart } from '../charts/GradeDistributionChart'
import { PassRateChart } from '../charts/PassRateChart'
import { GradeDistributionChartSettings } from '../settings/GradeDistributionChartSettings'
import { PassRateChartSettings } from '../settings/PassRateChartSettings'
import { TableSettings } from '../settings/TableSettings'
import { PaneContent } from './PaneContent'

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
      <PassRateChartSettings isRelative={isRelative} setIsRelative={setIsRelative} />
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
      <GradeDistributionChartSettings isRelative={isRelative} setIsRelative={setIsRelative} />
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
 * @param tableComponent Should be either StudentsTable or AttemptsTable
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
  const styleContainer = { display: 'flex', flexDirection: settings.splitDirection, justifyContent: 'space-between' }
  const styleData = { flexGrow: 1, flexBasis: 1, maxWidth: halfWidth ? '49%' : '100%' }

  return (
    <PaneContent>
      <TableSection
        availableStats={availableStats}
        datasets={datasets}
        settings={settings}
        setSettings={setSettings}
        setSplitDirection={setSplitDirection}
        tableComponent={tableComponent}
        toggleSeparate={toggleSeparate}
        styleContainer={styleContainer}
        styleData={styleData}
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
    </PaneContent>
  )
}
