import { useState, useEffect } from 'react'

import { EasterEgg } from '@/components/AccessDenied/EasterEgg'
import { ErrorBackground } from '@/components/ErrorBoundary/ErrorBackground'

export const AccessDenied = () => {
  const [easterEggVisible, setEasterEggVisible] = useState(false)
  useEffect(() => {
    setTimeout(() => setEasterEggVisible(true), Math.floor(Math.random() * (20 * 60 * 1000) + 30 * 1000))
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
