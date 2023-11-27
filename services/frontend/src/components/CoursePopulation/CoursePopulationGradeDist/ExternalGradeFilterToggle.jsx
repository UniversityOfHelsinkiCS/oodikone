import React from 'react'
import { FilterToggle } from '../../FilterView/FilterToggle'
import { useFilters } from '../../FilterView/useFilters'
import { gradeFilter } from '../../FilterView/filters'

export const ExternalGradeFilterToggle = ({ grade }) => {
  const { useFilterSelector, filterDispatch } = useFilters()

  const isActive = useFilterSelector(gradeFilter.selectors.isGradeSelected(grade))

  return (
    <FilterToggle
      filter={gradeFilter}
      active={isActive}
      applyFilter={() => filterDispatch(gradeFilter.actions.selectGrade(grade))}
      clearFilter={() => filterDispatch(gradeFilter.actions.unselectGrade(grade))}
      filterName="Grade Filter"
      popupContent="Rajaa opiskelijat kurssin arvosanan perusteella."
    />
  )
}
