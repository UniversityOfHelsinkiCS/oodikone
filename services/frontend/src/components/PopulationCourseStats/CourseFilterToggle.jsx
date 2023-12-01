import React from 'react'
import { Popup } from 'semantic-ui-react'
import { isCourseSelected, toggleCourseSelection } from 'components/FilterView/filters/courses'
import { FilterToggleIcon } from 'components/common/FilterToggleIcon'
import { useFilters } from 'components/FilterView/useFilters'
import { useLanguage } from 'components/LanguagePicker/useLanguage'

export const CourseFilterToggle = ({ course }) => {
  const { getTextIn } = useLanguage()
  const { useFilterSelector, filterDispatch } = useFilters()

  const isActive = useFilterSelector(isCourseSelected(course.code))

  return (
    <Popup
      trigger={
        <FilterToggleIcon
          style={{ cursor: 'pointer' }}
          isActive={isActive}
          onClick={() => filterDispatch(toggleCourseSelection(course.code))}
        />
      }
      content={
        isActive ? (
          <span>
            Poista rajaus kurssin <b>{getTextIn(course.name)}</b> perusteella
          </span>
        ) : (
          <span>
            Rajaa opiskelijat kurssin <b>{getTextIn(course.name)}</b> perusteella
          </span>
        )
      }
      position="top right"
    />
  )
}
