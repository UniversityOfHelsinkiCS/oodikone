import qs from 'query-string'
import React from 'react'
import { useLocation } from 'react-router-dom'

import { creditsEarnedFilter as creditFilter } from '@/components/FilterView/filters'
import { FilterToggle } from '@/components/FilterView/FilterToggle'
import { useFilters } from '@/components/FilterView/useFilters'

export const ExternalCreditFilterToggle = ({ min, max }) => {
  const { filterDispatch, useFilterSelector } = useFilters()
  const { min: currentMin, max: currentMax } = useFilterSelector(creditFilter.selectors.selectOptions)

  const location = useLocation()
  const { months } = qs.parse(location.search)
  const limitedMax = max === 0 ? 1 : max
  const active = currentMin === min && currentMax === limitedMax

  return (
    <FilterToggle
      active={active}
      applyFilter={() => filterDispatch(creditFilter.actions.setOptions({ min, max: limitedMax }))}
      clearFilter={() => filterDispatch(creditFilter.actions.reset())}
      filter={creditFilter}
      filterName="Credit Filter"
      popupContent={`Rajaa opiskelijat ensimmäisen ${months} kuukauden aikana saatujen opintopisteiden perusteella`}
    />
  )
}
