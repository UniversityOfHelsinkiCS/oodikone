import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { ColorizedCoursesTableContext } from '@/components/ColorizedCoursesTable/common'
import { FacultiesTab } from '@/components/ColorizedCoursesTable/FacultiesTab'
import { SemestersTab } from '@/components/ColorizedCoursesTable/SemestersTab'
import { LoadingSection } from '@/components/Loading'
import { useSemesters } from '@/hooks/useSemesters'
import '@/components/ColorizedCoursesTable/index.css'
import { CalendarMonthIcon, SchoolIcon } from '@/theme'

export const ColorizedCoursesTable = ({ fetchDataHook, fetchDataHookParams, panes, mode }) => {
  const { semesters: allSemesters, currentSemester } = useSemesters()
  const semesters = Object.values(allSemesters).filter(
    // 135 = Fall 2017
    // INFO: If semesters is defined, currentSemester will be defined.
    semester => semester.semestercode >= 135 && semester.semestercode <= currentSemester!.semestercode
  )

  const { data, isFetching, isLoading, isError } = fetchDataHook(fetchDataHookParams)

  const [tab, setTab] = useState(0)
  const [numberMode, setNumberMode] = useState('completions')
  const [colorMode, setColorMode] = useState('none')
  const [semesterFilter, setSemesterFilter] = useState<{ start: number; end: number }>({ start: 135, end: 135 })
  const [filterEmptyCourses, setFilterEmptyCourses] = useState(true)

  const selectedSemesters = useMemo(() => {
    const selectedSemestersArray: number[] = []
    if (semesterFilter?.start && semesterFilter?.end) {
      for (let i = semesterFilter.start; i <= semesterFilter.end; i++) {
        selectedSemestersArray.push(i)
      }
    }

    return [...new Set(selectedSemestersArray)]
  }, [semesterFilter])

  useEffect(() => {
    if (!semesters?.length) {
      return
    }
    if (!semesterFilter) {
      setSemesterFilter({
        start: semesters[0].semestercode,
        end: semesters[semesters.length - 1].semestercode,
      })
    }
  }, [semesters, semesterFilter])

  const possiblePanes = [
    {
      name: 'Faculties',
      label: 'By faculties',
      icon: <SchoolIcon />,
      render: () => <FacultiesTab />,
    },
    {
      name: 'Semesters',
      label: 'By semesters',
      icon: <CalendarMonthIcon />,
      render: () => <SemestersTab languagecenterview={mode === 'languagecenterview'} />,
    },
  ]

  const displayedPanes = possiblePanes.filter(pane => panes.includes(pane.name))

  if (isError) {
    return (
      <Typography alignSelf="center" component="h6" variant="h5">
        Something went wrong, please try refreshing the page.
      </Typography>
    )
  }

  if (!data || isFetching || isLoading || !semesterFilter || !semesters?.length) {
    return <LoadingSection sx={{ padding: 16 }} />
  }

  const settingsContext = {
    semesterFilter,
    setSemesterFilter,
    numberMode,
    setNumberMode,
    semesters,
    colorMode,
    setColorMode,
    selectedSemesters,
    data,
    filterEmptyCourses,
    setFilterEmptyCourses,
  }

  return (
    <Stack alignItems="center">
      {displayedPanes.length > 1 && (
        <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
          {displayedPanes.map(pane => (
            <Tab icon={pane.icon} iconPosition="start" key={pane.label} label={pane.label} />
          ))}
        </Tabs>
      )}
      <ColorizedCoursesTableContext.Provider value={settingsContext}>
        {displayedPanes.at(tab)?.render() ?? null}
      </ColorizedCoursesTableContext.Provider>
    </Stack>
  )
}
