import React from 'react'
import PropTypes from 'prop-types'
import { Popup, Button, Icon } from 'semantic-ui-react'
import { useLocation } from 'react-router-dom'
import { getMonths } from '../../../common/query'
import useCreditFilter from '../../FilterTray/filters/TotalCredits/useCreditFilter'

const ExternalCreditFilterToggle = ({ min, max }) => {
  const { currentValue: currentFilterValue, setRequestedValue } = useCreditFilter()
  const months = getMonths(useLocation())
  const limitedMax = max === 0 ? 1 : max

  const currentMin = currentFilterValue.min === '' ? null : Number(currentFilterValue.min)
  const currentMax = currentFilterValue.max === '' ? null : Number(currentFilterValue.max)
  const active = currentMin === min && currentMax === limitedMax

  const updateFilters = () =>
    active ? setRequestedValue({ min: null, max: null }) : setRequestedValue({ min, max: limitedMax })

  return (
    <Popup
      content={`Rajaa opiskelijat ensimmäisen ${months} kuukauden aikana saatujen opintopisteiden perusteella`}
      size="mini"
      trigger={
        <Button onClick={updateFilters} size="mini" icon basic={!active} primary={active}>
          <Icon name="filter" />
        </Button>
      }
    />
  )
}

ExternalCreditFilterToggle.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number
}

ExternalCreditFilterToggle.defaultProps = {
  min: null,
  max: null
}

export default ExternalCreditFilterToggle
