import React, { useState } from 'react'
import { Message } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { getHideSisWarningFlag, setHideSisWarningFlag } from '../../common'

const SisChangeMessage = () => {
  const [open, setOpen] = useState(true)

  const handleDismiss = () => {
    setOpen(false)
    setHideSisWarningFlag(true)
  }

  if (!open || getHideSisWarningFlag()) return null

  const commonReasons = [
    'Osalla opiskelijoista voi olla opintopisteiden kokonaismäärässä eroja. Tämä koskee erityisesti tiedekuntia, joissa on runsaasti osasuorituksia.',
    "Populaatioiden 'Advanced settings' -valikossa vaihto-opiskelijoiden ja tutkintoon johtamattomien opinto-oikeuksien näyttäminen ei välttämättä toimi."
  ]

  return (
    <Message onDismiss={handleDismiss} info size="huge">
      <Message.Header>Oodikone käyttää nyt Sisua</Message.Header>
      <p>
        Opiskelijoiden tiedot saattavat siirtymän myötä poiketa joiltain osin aiemmasta. Erityisesti siirtymän tiedetään
        vaikuttaneen seuraaviin asioihin:
      </p>
      <Message.List items={commonReasons} />

      <p>
        Mikäli huomaat tiedoissa virheitä, laitathan palautetta sähköpostitse{' '}
        <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a> tai{' '}
        <Link to="/feedback">palautelomakkeella</Link>.
      </p>
    </Message>
  )
}

export default SisChangeMessage
