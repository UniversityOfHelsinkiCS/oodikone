const createstamper = () => {
  let timestamp = new Date()
  const start = () => {
    timestamp = new Date()
  }

  const stamp = (msg) => {
    console.log(`${msg}, duration: ${new Date() - timestamp}`)
    timestamp = new Date()
  }

  return {
    start,
    stamp
  }
}

module.exports = {
  createstamper
}