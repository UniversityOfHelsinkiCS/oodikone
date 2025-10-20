import Tooltip from '@mui/material/Tooltip'

import { FilterToggleIcon } from '@/components/common/FilterToggleIcon'
import { isCourseSelected, toggleCourseSelection } from '@/components/FilterView/filters/courses'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Name } from '@oodikone/shared/types'

interface CourseFilterToggleProps {
  courseCode: string
  courseName: Name
}

export const CourseFilterToggle = ({ courseCode, courseName }: CourseFilterToggleProps) => {
  const { getTextIn } = useLanguage()
  const { useFilterSelector, filterDispatch } = useFilters()

  const isActive = useFilterSelector(isCourseSelected(courseCode))
  const courseElement = <b>{getTextIn(courseName)}</b>

  const title = (
    <span>
      {isActive ? 'Poista rajaus' : 'Rajaa opiskelijat'} kurssin {courseElement} perusteella
    </span>
  )

  return (
    <Tooltip arrow placement="top" title={title}>
      <div>
        <FilterToggleIcon isActive={isActive} onClick={() => filterDispatch(toggleCourseSelection(courseCode))} />
      </div>
    </Tooltip>
  )
}
