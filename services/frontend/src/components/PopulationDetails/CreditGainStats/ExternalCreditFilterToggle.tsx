import { studentNumberFilter } from '@/components/FilterView/filters'
import { FilterToggle } from '@/components/FilterView/FilterToggle'
import { useFilters } from '@/components/FilterView/useFilters'

export const ExternalCreditFilterToggle = ({ students, helpText }: { students: string[]; helpText: string }) => {
  const { filterDispatch, useFilterSelector } = useFilters()
  const currentFilterIsActive = useFilterSelector(studentNumberFilter.selectors.studentListIsEqualToAllowlist(students))
  const someFilterIsActive = useFilterSelector(studentNumberFilter.selectors.isActive())

  return (
    <FilterToggle
      active={currentFilterIsActive}
      applyFilter={() => filterDispatch(studentNumberFilter.actions.setAllowlist(students))}
      clearFilter={() => filterDispatch(studentNumberFilter.actions.setAllowlist([]))}
      disabled={someFilterIsActive ? !currentFilterIsActive : null}
      popupContent={helpText}
    />
  )
}
