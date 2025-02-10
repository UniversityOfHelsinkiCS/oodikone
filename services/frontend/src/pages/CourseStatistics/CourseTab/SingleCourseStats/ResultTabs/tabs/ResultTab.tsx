import { Stack } from '@mui/material'
import { useEffect, useState } from 'react'

import { courseStatisticsToolTips } from '@/common/InfoToolTips'
import { Section } from '@/components/material/Section'
import { AvailableStats, ProgrammeStats, ViewMode } from '@/types/courseStat'
import { GradeDistributionChart } from './charts/GradeDistributionChart'
import { PassRateChart } from './charts/PassRateChart'
import { ChartSettings } from './settings/ChartSettings'
import { TableSettings } from './settings/TableSettings'
import { AttemptsTable } from './tables/AttemptsTable'
import { StudentsTable } from './tables/StudentsTable'

type ResultTabSettings = {
  isRelative: boolean
  separate: boolean
  showGrades: boolean
  viewMode: ViewMode
}

export const ResultTab = ({
  availableStats,
  datasets,
  initialSettings,
  loading,
  updateSeparate,
  userHasAccessToAllStats,
}: {
  availableStats: AvailableStats
  datasets: (ProgrammeStats | undefined)[]
  initialSettings: { viewMode: ViewMode; separate: boolean }
  loading: boolean
  updateSeparate: (separate: boolean) => void
  userHasAccessToAllStats: boolean
}) => {
  const [settings, setSettings] = useState<ResultTabSettings>({
    isRelative: false,
    separate: initialSettings.separate,
    showGrades: false,
    viewMode: initialSettings.viewMode,
  })

  useEffect(() => {
    setSettings({ ...settings, separate: initialSettings.separate, viewMode: initialSettings.viewMode })
  }, [initialSettings])

  const toggleShowGrades = (showGrades: boolean) => {
    setSettings({ ...settings, showGrades })
  }

  const toggleSeparate = (separate: boolean) => {
    setSettings({ ...settings, separate })
    updateSeparate(separate)
  }

  return (
    <>
      <Section
        cypress={settings.viewMode === 'STUDENTS' ? 'StudentStatistics' : 'AttemptStatistics'}
        infoBoxContent={courseStatisticsToolTips.tables[settings.viewMode]}
        isLoading={loading}
        title={settings.viewMode === 'STUDENTS' ? 'Student statistics' : 'Attempt statistics'}
      >
        <Stack gap={2}>
          <TableSettings
            availableStats={availableStats}
            onSeparateChange={toggleSeparate}
            onShowGradesChange={toggleShowGrades}
            separate={settings.separate}
            showGrades={settings.showGrades}
          />
          {datasets
            .filter(data => data !== undefined)
            .map(data => (
              <div key={data.name}>
                {settings.viewMode === 'STUDENTS' ? (
                  <StudentsTable
                    data={data}
                    separate={settings.separate}
                    showGrades={settings.showGrades}
                    userHasAccessToAllStats={userHasAccessToAllStats}
                  />
                ) : (
                  <AttemptsTable data={data} settings={settings} userHasAccessToAllStats={userHasAccessToAllStats} />
                )}
              </div>
            ))}
        </Stack>
      </Section>
      {settings.showGrades ? (
        <Section
          cypress="GradeDistribution"
          infoBoxContent={courseStatisticsToolTips.gradeDistribution}
          isLoading={loading}
          title="Grade distribution"
        >
          <ChartSettings
            isRelative={settings.isRelative}
            setIsRelative={isRelative => setSettings({ ...settings, isRelative })}
          />
          {datasets
            .filter(data => data !== undefined)
            .map(data => (
              <GradeDistributionChart
                data={data}
                isRelative={settings.isRelative}
                key={data.name}
                userHasAccessToAllStats={userHasAccessToAllStats}
                viewMode={settings.viewMode}
              />
            ))}
        </Section>
      ) : (
        <Section
          cypress={settings.viewMode === 'STUDENTS' ? 'PassRateStudents' : 'PassRateAttempts'}
          infoBoxContent={courseStatisticsToolTips.passRate[settings.viewMode]}
          isLoading={loading}
          title="Pass rate"
        >
          <ChartSettings
            isRelative={settings.isRelative}
            setIsRelative={isRelative => setSettings({ ...settings, isRelative })}
          />
          {datasets
            .filter(data => data !== undefined)
            .map(data => (
              <PassRateChart
                data={data}
                isRelative={settings.isRelative}
                key={data.name}
                userHasAccessToAllStats={userHasAccessToAllStats}
                viewMode={settings.viewMode}
              />
            ))}
        </Section>
      )}
    </>
  )
}
