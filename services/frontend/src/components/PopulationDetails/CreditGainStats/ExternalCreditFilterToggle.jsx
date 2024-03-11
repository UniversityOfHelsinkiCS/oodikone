import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { getMonths } from '@/common/query'
import { creditsEarnedFilter as creditFilter } from '@/components/FilterView/filters'
import { FilterToggle } from '@/components/FilterView/FilterToggle'
import { useFilters } from '@/components/FilterView/useFilters'

export const ExternalCreditFilterToggle = ({ min, max }) => {
  const { filterDispatch } = useFilters()
  const { min: currentMin, max: currentMax } = useSelector(creditFilter.selectors.selectOptions)

  const months = getMonths(useLocation())
  const limitedMax = max === 0 ? 1 : max
  const active = currentMin === min && currentMax === limitedMax

  return (
    <FilterToggle
      active={active}
      applyFilter={() => filterDispatch(creditFilter.actions.setOptions({ min, max: limitedMax }))}
      clearFilter={() => filterDispatch(creditFilter.actions.clear())}
      filter={creditFilter}
      filterName="Credit Filter"
      popupContent={`Rajaa opiskelijat ensimmäisen ${months} kuukauden aikana saatujen opintopisteiden perusteella`}
    />
  )
}
