/* eslint-disable react/prop-types */

import React, { useState } from 'react'
import { Message } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'
import { getHideSisWarningFlag, setHideSisWarningFlag, getUserRoles } from '../../common'

const SisChangeMessage = props => {
  const [open, setOpen] = useState(true)
  const { userRoles, rights } = props

  const handleDismiss = () => {
    setOpen(false)
    setHideSisWarningFlag(true)
  }

  if (!open || getHideSisWarningFlag()) return null

  const reasons = [
    'Osalla opiskelijoista voi olla opintopisteiden kokonaismäärässä eroja. Tämä koskee erityisesti tiedekuntia, joissa on runsaasti osasuorituksia.',
    "Populaatioiden 'Advanced settings' -valikossa vaihto-opiskelijoiden ja tutkintoon johtamattomien opinto-oikeuksien näyttäminen ei välttämättä toimi."
  ]

  // Kasvatustiedehuomiot
  if (
    rights.includes('KH60_001') ||
    rights.includes('MH60_001') ||
    rights.includes('MH60_002') ||
    userRoles.includes('admin')
  ) {
    reasons.push(
      'Varhaiskasvatuksen opettaja -tutkintosuunnan on opiskelijoita, joiden opinto-oikeudet näyttävät virheellisiltä.'
    )
  }

  // Oikeustiedehuomiot
  if (rights.includes('KH20_001') || rights.includes('MH20_001') || userRoles.includes('admin')) {
    reasons.push('Oikeustieteellisen tiedekunnan tuottamat opintopisteet näkyvät Trends-osiossa väärin.')
  }

  return (
    <Message onDismiss={handleDismiss} info size="huge">
      <Message.Header>Oodikone käyttää nyt Sisua</Message.Header>
      <p>
        Opiskelijoiden tiedot saattavat siirtymän myötä poiketa joiltain osin aiemmasta. Erityisesti siirtymän tiedetään
        vaikuttaneen seuraaviin asioihin:
      </p>
      <Message.List items={reasons} />
      <p>
        Mikäli huomaat tiedoissa virheitä, laitathan palautetta sähköpostitse{' '}
        <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a> tai{' '}
        <Link to="/feedback">palautelomakkeella</Link>.
      </p>
    </Message>
  )
}

const mapStateToProps = ({
  auth: {
    token: { roles, rights }
  }
}) => ({
  userRoles: getUserRoles(roles),
  rights
})

export default connect(mapStateToProps, null, null, {
  areStatePropsEqual: isEqual
})(SisChangeMessage)
