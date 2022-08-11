const { randomBytes, createCipheriv, createDecipheriv } = require('crypto')

const algorithm = 'aes-256-cbc'
const key = randomBytes(32)
const iv = randomBytes(16)

const encrypt = text => {
  const cipher = createCipheriv(algorithm, Buffer.from(key), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex'),
  }
}

const decrypt = text => {
  const iv = Buffer.from(text.iv, 'hex')
  const encryptedText = Buffer.from(text.encryptedData, 'hex')
  const decipher = createDecipheriv(algorithm, Buffer.from(key), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString()
}

module.exports = { encrypt, decrypt }
