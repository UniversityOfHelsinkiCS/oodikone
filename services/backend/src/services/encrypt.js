const { randomBytes, createCipheriv } = require('crypto')

const algorithm = 'aes-256-cbc'
const key = randomBytes(32)
const iv = randomBytes(16)

const encrypt = text => {
  const cipher = createCipheriv(algorithm, Buffer.from(key), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])

  return encrypted.toString('hex')
}

module.exports = encrypt
