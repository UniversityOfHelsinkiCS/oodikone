import React, { useState, useEffect } from 'react'
import oodiTXT from '../../static/oodi.txt'
import './oodiToOodikone.css'

const OodiToOodikone = () => {
  const [oodis, setOodis] = useState([])
  useEffect(() => {
    const getOodis = async () => {
      try {
        const data = await fetch(oodiTXT)
        setOodis(
          (await data.text())
            .split('**')
            .map(o => o.trim())
            .filter(oodi => !!oodi)
        )
      } catch (error) {
        setOodis([])
      }
    }
    getOodis()
  }, [])

  if (!oodis || oodis.length === 0) {
    return null
  }
  const oodi = oodis[Math.floor(Math.random() * oodis.length)].split('\n')
  return (
    <blockquote cite="http://www.helsinki.fi/discovery">
      <div style={{ textAlign: 'center' }}>
        {oodi.map((l, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <p key={index} style={{ marginBottom: '0.6rem' }}>
            {l}
          </p>
        ))}
      </div>

      <p style={{ marginTop: '1.3em', textAlign: 'center' }}>
        - <a href="http://www.helsinki.fi/discovery">R. U. Nokone</a>
      </p>
    </blockquote>
  )
}

export default OodiToOodikone
