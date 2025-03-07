import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

import { CRYPT_KEY } from '../config'

const algorithm = 'aes-256-cbc'

export const encrypt = (text: string) => {
  if (!CRYPT_KEY) throw Error('Define crypt key in environment variables')
  const iv = randomBytes(16)
  const cipher = createCipheriv(algorithm, Buffer.from(CRYPT_KEY, 'hex'), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex'),
  }
}

export type EncrypterData = { iv: string; encryptedData: string }
export const decrypt = (data: EncrypterData) => {
  if (!CRYPT_KEY) throw Error('Define crypt key in environment variables')
  const iv = Buffer.from(data.iv, 'hex')
  const encryptedText = Buffer.from(data.encryptedData, 'hex')
  const decipher = createDecipheriv(algorithm, Buffer.from(CRYPT_KEY, 'hex'), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString()
}
