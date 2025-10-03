import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import SchoolIcon from '@mui/icons-material/School'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { useTabs } from '@/hooks/tabs'
import { ByCreditTypeTab } from './ByCreditTypeTab'
import { BySemesterTab } from './BySemesterTab'

export const ProgrammeCoursesTab = ({
  academicYear,
  combinedProgramme,
  setAcademicYear,
  studyProgramme,
}: {
  academicYear: boolean
  combinedProgramme: string
  studyProgramme: string
  setAcademicYear: (value: boolean) => void
}) => {
  const [currentTab, setCurrentTab] = useTabs(2, 'by')

  const tabs = [
    {
      key: 'ByCreditTypeTab',
      cypress: 'by-credit-type-tab',
      label: 'By credit type',
      icon: <SchoolIcon />,
      component: (
        <ByCreditTypeTab
          academicYear={academicYear}
          combinedProgramme={combinedProgramme}
          key="ByCreditTypeTab"
          setAcademicYear={setAcademicYear}
          studyProgramme={studyProgramme}
        />
      ),
    },
    {
      key: 'BySemesterTab',
      cypress: 'by-semester-tab',
      label: 'By semester',
      icon: <CalendarMonthIcon />,
      component: <BySemesterTab key="BySemesterTab" studyProgramme={studyProgramme} />,
    },
  ]

  return (
    <Stack gap={2}>
      <Tabs data-cy="programme-courses-tabs" onChange={(_event, newTab) => setCurrentTab(newTab)} value={currentTab}>
        {tabs.map(tab => (
          <Tab data-cy={tab.cypress} icon={tab.icon} iconPosition="start" key={tab.key} label={tab.label} />
        ))}
      </Tabs>
      {tabs.map(tab => currentTab === tabs.indexOf(tab) && tab.component)}
    </Stack>
  )
}
