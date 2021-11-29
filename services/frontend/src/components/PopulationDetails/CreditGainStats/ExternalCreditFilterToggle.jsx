import React from 'react'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'
import { getMonths } from '../../../common/query'
import { contextKey as creditFilterContextKey } from '../../FilterTray/filters/CreditsEarned'
import ExternalFilterToggle from '../../FilterTray/ExternalFilterToggle'

const ExternalCreditFilterToggle = ({ min, max }) => {
  // FIXME: const { currentValue: currentFilterValue, setRequestedValue } = useCreditFilter()

  const months = getMonths(useLocation())
  const limitedMax = max === 0 ? 1 : max

  const currentMin = null // FIXME: currentFilterValue.min === '' ? null : Number(currentFilterValue.min)
  const currentMax = null // FIXME: currentFilterValue.max === '' ? null : Number(currentFilterValue.max)
  const active = currentMin === min && currentMax === limitedMax

  return (
    <ExternalFilterToggle
      filterPanelContextKey={creditFilterContextKey}
      applyFilter={() => {} /* FIXME: setRequestedValue({ min, max: limitedMax }) */}
      clearFilter={() => {} /* FIXME: setRequestedValue({ min: null, max: null }) */}
      active={active}
      popupContent={`Rajaa opiskelijat ensimmäisen ${months} kuukauden aikana saatujen opintopisteiden perusteella`}
      filterName="Credit Filter"
    />
  )
}

ExternalCreditFilterToggle.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
}

ExternalCreditFilterToggle.defaultProps = {
  min: null,
  max: null,
}

export default ExternalCreditFilterToggle
