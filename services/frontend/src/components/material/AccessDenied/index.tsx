import { useState, useEffect } from 'react'

import { ErrorBackground } from '../ErrorBackground'
import { EasterEgg } from './EasterEgg'

export const AccessDenied = () => {
  const [easterEggVisible, setEasterEggVisible] = useState(false)
  useEffect(() => {
    setTimeout(() => setEasterEggVisible(true), Math.floor(Math.random() * 25000 + 5000))
  }, [])

  const header = 'Welcome to Oodikone!'
  const content = (
    <>
      You're currently not allowed to enter but you will get an email when you're authorized"
      {easterEggVisible ? <EasterEgg /> : null}
    </>
  )

  return <ErrorBackground content={content} header={header} />
}
