import React, { useState } from 'react'
import { Message } from 'semantic-ui-react'

const SisChangeMessage = () => {
  const [open, setOpen] = useState(true)

  const handleDismiss = () => {
    setOpen(false)
  }

  if (!open) return null

  return (
    <Message
      icon="inbox"
      onDismiss={handleDismiss}
      header="Oodikone käyttää nyt Sisua."
      content="Tiedot saattavat olla paikoin virheellisiä Oodin vaihduttua Sisuun. Laitathan palautetta, jos huomaat selkeitä virheitä tiedoissa."
      color="blue"
      floating
      size="huge"
    />
  )
}

export default SisChangeMessage
