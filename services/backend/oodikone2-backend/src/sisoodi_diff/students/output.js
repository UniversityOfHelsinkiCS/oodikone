const codes = new Set()
const { argv } = process

const output = (msg, type = 'message') => {
  if (type === 'code' && argv.includes('only-codes')) {
    return codes.add(msg)
  }

  if (argv.includes('only-codes') || type === 'code') {
    return
  }

  console.log(msg)
}

const printCodes = () => {
  if (argv.includes('only-codes')) {
    codes.forEach(s => console.log(s))
  }
}

module.exports = {
  output,
  printCodes
}
