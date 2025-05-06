import { Popup } from 'semantic-ui-react'

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

  return (
    <Popup
      content={
        isActive ? (
          <span>
            Poista rajaus kurssin <b>{getTextIn(courseName)}</b> perusteella
          </span>
        ) : (
          <span>
            Rajaa opiskelijat kurssin <b>{getTextIn(courseName)}</b> perusteella
          </span>
        )
      }
      position="top right"
      trigger={
        <div>
          <FilterToggleIcon isActive={isActive} onClick={() => filterDispatch(toggleCourseSelection(courseCode))} />
        </div>
      }
    />
  )
}
