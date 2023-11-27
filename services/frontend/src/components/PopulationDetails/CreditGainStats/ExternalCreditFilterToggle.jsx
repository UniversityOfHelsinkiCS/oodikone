import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { getMonths } from '../../../common/query'
import { FilterToggle } from '../../FilterView/FilterToggle'
import { creditsEarnedFilter as creditFilter } from '../../FilterView/filters'
import { useFilters } from '../../FilterView/useFilters'

export const ExternalCreditFilterToggle = ({ min, max }) => {
  const { filterDispatch } = useFilters()
  const { min: currentMin, max: currentMax } = useSelector(creditFilter.selectors.selectOptions)

  const months = getMonths(useLocation())
  const limitedMax = max === 0 ? 1 : max
  const active = currentMin === min && currentMax === limitedMax

  return (
    <FilterToggle
      filter={creditFilter}
      active={active}
      applyFilter={() => filterDispatch(creditFilter.actions.setOptions({ min, max: limitedMax }))}
      clearFilter={() => filterDispatch(creditFilter.actions.clear())}
      popupContent={`Rajaa opiskelijat ensimmäisen ${months} kuukauden aikana saatujen opintopisteiden perusteella`}
      filterName="Credit Filter"
    />
  )
}
