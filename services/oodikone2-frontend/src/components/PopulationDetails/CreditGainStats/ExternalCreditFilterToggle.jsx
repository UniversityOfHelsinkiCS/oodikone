import React from 'react'
import { Popup, Button, Icon } from 'semantic-ui-react'
import { useLocation } from 'react-router-dom'
import { useStore } from 'react-hookstore'
import { getMonths } from '../../../common/query'
import { requestStoreName, valueStoreName } from '../../FilterTray/filters/TotalCredits'

const ExternalCreditFilterToggle = ({ min, max }) => {
  const [totalCreditsExternal, setTotalCreditsExternal] = useStore(requestStoreName)
  const [currentFilterValue] = useStore(valueStoreName)
  const months = getMonths(useLocation())
  const limitedMax = max === 0 ? 1 : max

  const currentMin = currentFilterValue.min === '' ? null : Number(currentFilterValue.min)
  const currentMax = currentFilterValue.max === '' ? null : Number(currentFilterValue.max)
  const active = currentMin === min && currentMax === limitedMax

  const updateFilters = () =>
    active ? setTotalCreditsExternal({ min: null, max: null }) : setTotalCreditsExternal({ min, max: limitedMax })

  return (
    <Popup
      content={`Rajaa opiskelijat ensimmäisen ${months} kuukauden aikana saatujen opintopisteiden perusteella`}
      size="mini"
      trigger={
        <Button onClick={updateFilters} size="mini" icon basic={!active}>
          <Icon name="filter" />
        </Button>
      }
    />
  )
}

export default ExternalCreditFilterToggle
