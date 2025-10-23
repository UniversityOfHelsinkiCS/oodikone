import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { shape } from 'prop-types'
import { useEffect, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { TeacherStatisticsTable } from '@/components/Teachers/TeacherStatisticsTable'

const CourseTabDropdown = ({ options, doSelect, selected }) => (
  <FormControl fullWidth size="small">
    <InputLabel>Semester</InputLabel>
    <Select onChange={event => doSelect(event.target.value)} value={selected ?? ''} variant="outlined">
      {options.map(({ key, value, text }) => (
        <MenuItem key={key} value={value}>
          {text}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
)

export const CoursesTab = ({ courses, semesters }) => {
  const { getTextIn } = useLanguage()
  const [tab, setTab] = useState(0)
  const [selectedSemester, setSelectedSemester] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [semesterOptions, setSemesterOptions] = useState([])
  const [courseOptions, setCourseOptions] = useState([])

  const initialSemesterOptions = () => {
    return Object.values(semesters)
      .sort((s1, s2) => s2.id - s1.id)
      .map(({ name, id }) => ({
        key: id,
        value: id,
        text: getTextIn(name),
      }))
  }

  const initialCourseOptions = () => {
    const coursesValues = Object.values(courses)
    return coursesValues.map(({ name, id }) => ({
      key: id,
      value: id,
      description: id,
      text: getTextIn(name),
    }))
  }
  useEffect(() => {
    const initSemesterOptions = initialSemesterOptions()
    const initCourseOptions = initialCourseOptions()
    const courseWithMostCredits =
      Object.values(courses).length > 0
        ? Object.values(courses).reduce((c1, c2) => (c1.stats.credits > c2.stats.credits ? c1 : c2))
        : null
    setSemesterOptions(initSemesterOptions)
    setCourseOptions(initCourseOptions)
    setSelectedSemester(initSemesterOptions.length > 0 ? initSemesterOptions[0].value : null)
    setSelectedCourse(courseWithMostCredits != null ? courseWithMostCredits.id : null)
  }, [courses, semesters])

  const setCourse = selectedCourse => setSelectedCourse(selectedCourse)

  const setSemester = selectedSemester => setSelectedSemester(selectedSemester)

  const getCourseStats = courseid => {
    if (!courseid) {
      return []
    }
    const course = courses[courseid]
    return Object.entries(course.semesters).map(([semesterid, stats]) => ({
      id: semesterid,
      name: getTextIn(semesters[semesterid].name),
      ...stats,
    }))
  }

  const getSemesterStats = semesterid => {
    if (!semesterid) {
      return []
    }
    return Object.values(courses)
      .filter(course => !!course.semesters[semesterid])
      .map(({ id, name, semesters }) => ({
        id,
        name: getTextIn(name),
        ...semesters[semesterid],
      }))
  }

  const panes = [
    {
      label: 'Semester',
      render: () => (
        <>
          <CourseTabDropdown doSelect={setSemester} options={semesterOptions} selected={selectedSemester} />
          <TeacherStatisticsTable statistics={getSemesterStats(selectedSemester)} variant="course" />
        </>
      ),
    },
    {
      label: 'Course',
      render: () => (
        <>
          <CourseTabDropdown doSelect={setCourse} options={courseOptions} selected={selectedCourse} />
          <TeacherStatisticsTable statistics={getCourseStats(selectedCourse)} variant="semester" />
        </>
      ),
    },
  ]

  return (
    <>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ label }) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
      <Box sx={{ padding: 2 }}>{panes.at(tab)?.render() ?? null}</Box>
    </>
  )
}

CoursesTab.propTypes = {
  courses: shape({}).isRequired,
  semesters: shape({}).isRequired,
}
