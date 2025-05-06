import { FormatListNumbered as FormatListNumberedIcon } from '@mui/icons-material'
import { Checkbox, IconButton, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material'
import { useEffect, useState } from 'react'

import { useAddProgressCriteriaCourseMutation } from '@/redux/progressCriteria'
import { isMedicalProgramme } from '@/util/studyProgramme'
import { ProgrammeCourse, ProgressCriteria } from '@oodikone/shared/types'

export const CriterionLabelSelectButton = ({
  course,
  criteria,
  studyProgramme,
}: {
  course: ProgrammeCourse
  criteria: ProgressCriteria
  studyProgramme: string
}) => {
  const [addProgressCriteriaCourse] = useAddProgressCriteriaCourseMutation()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  useEffect(() => {
    const selected = Object.keys(criteria.courses).filter(key => criteria.courses[key].includes(course.code))
    setSelectedOptions(selected)
  }, [criteria, course.code])

  const options = [
    {
      key: 'yearOne',
      label: 'First',
      year: 1,
    },
    {
      key: 'yearTwo',
      label: 'Second',
      year: 2,
    },
    {
      key: 'yearThree',
      label: 'Third',
      year: 3,
    },
  ]

  if (isMedicalProgramme(studyProgramme)) {
    options.push(
      {
        key: 'yearFour',
        label: 'Fourth',
        year: 4,
      },
      {
        key: 'yearFive',
        year: 5,
        label: 'Fifth',
      },
      {
        key: 'yearSix',
        year: 6,
        label: 'Sixth',
      }
    )
  }

  const handleCheckboxChange = (key: string, year: number) => {
    let courses: string[]

    if (selectedOptions.includes(key)) {
      courses = criteria.courses[key]?.filter((courseCode: string) => courseCode !== course.code)
      void addProgressCriteriaCourse({ programmeCode: studyProgramme, courses, year })
    } else {
      courses = criteria.courses ? [...criteria.courses[key], course.code] : [course.code]
    }

    void addProgressCriteriaCourse({ programmeCode: studyProgramme, courses, year })

    setSelectedOptions(prevSelected =>
      prevSelected.includes(key) ? prevSelected.filter(item => item !== key) : [...prevSelected, key]
    )
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Tooltip arrow placement="top" title={'Modify criterion labels'}>
        <IconButton data-cy="toggle-visibility-button" onClick={handleMenuOpen}>
          <FormatListNumberedIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} onClose={handleMenuClose} open={Boolean(anchorEl)}>
        {options.map(option => (
          <MenuItem key={option.key} onClick={() => handleCheckboxChange(option.key, option.year)}>
            <Checkbox checked={selectedOptions.includes(option.key)} />
            <ListItemText primary={`${option.label} year`} />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
