import React from 'react'

import { gradeFilter } from '@/components/FilterView/filters'
import { FilterToggle } from '@/components/FilterView/FilterToggle'
import { useFilters } from '@/components/FilterView/useFilters'

export const ExternalGradeFilterToggle = ({ grade }) => {
  const { useFilterSelector, filterDispatch } = useFilters()

  const isActive = useFilterSelector(gradeFilter.selectors.isGradeSelected(grade))

  return (
    <FilterToggle
      active={isActive}
      applyFilter={() => filterDispatch(gradeFilter.actions.selectGrade(grade))}
      clearFilter={() => filterDispatch(gradeFilter.actions.unselectGrade(grade))}
      filter={gradeFilter}
      filterName="Grade Filter"
      popupContent="Rajaa opiskelijat kurssin arvosanan perusteella."
    />
  )
}
