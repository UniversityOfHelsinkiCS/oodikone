import Tooltip from '@mui/material/Tooltip'

import { FilterToggleIcon } from '@/components/common/FilterToggleIcon'
import { isCourseSelected, toggleCourseSelection } from '@/components/FilterView/filters/courses'
import { useFilters } from '@/components/FilterView/useFilters'

export const CourseFilterToggle = ({ courseCode, courseName }: { courseCode: string; courseName: string }) => {
  const { useFilterSelector, filterDispatch } = useFilters()

  const isActive = useFilterSelector(isCourseSelected(courseCode))

  const title = (
    <span>
      {isActive ? 'Poista rajaus' : 'Rajaa opiskelijat'} kurssin <b>{courseName}</b> perusteella
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
