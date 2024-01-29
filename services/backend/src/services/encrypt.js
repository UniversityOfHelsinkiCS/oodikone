const { createCipheriv, createDecipheriv, randomBytes } = require('crypto')
const { CRYPT_KEY } = require('../conf-backend')

const algorithm = 'aes-256-cbc'

const encrypt = text => {
  if (!CRYPT_KEY) throw Error('Define crypt key in environment variables')
  const iv = randomBytes(16)
  const cipher = createCipheriv(algorithm, Buffer.from(CRYPT_KEY), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex'),
  }
}

const decrypt = text => {
  if (!CRYPT_KEY) throw Error('Define crypt key in environment variables')
  const iv = Buffer.from(text.iv, 'hex')
  const encryptedText = Buffer.from(text.encryptedData, 'hex')
  const decipher = createDecipheriv(algorithm, Buffer.from(CRYPT_KEY), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString()
}

module.exports = { encrypt, decrypt }
