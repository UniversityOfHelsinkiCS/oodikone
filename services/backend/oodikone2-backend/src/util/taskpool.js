const taskpool = (poolsize=5) => {

  const queue = []
  let hasPendingTask = false
  let getPendingTask = undefined
  let sleep = true

  const nextTask = () => {
    if (queue.length <= poolsize && hasPendingTask) {
      const task = getPendingTask()
      queue.push(task)
    }
    return queue.pop()
  }

  const execute = async () => {
    sleep = false
    while (queue.length > 0 || hasPendingTask) {
      const task = nextTask()
      await task()
    }
    sleep = true
  }

  const enqueue = task => {
    return new Promise((resolve) => {
      if (queue.length < poolsize) {
        queue.push(task)
        resolve()
      } else {
        hasPendingTask = true
        getPendingTask = () => {
          resolve()
          hasPendingTask = false
          return task
        }
      }
      if (sleep === true) {
        execute()
      }
    })
  }

  const complete = () => {
    return new Promise((resolve) => {
      queue.unshift(() => {
        resolve()
      })
      if (sleep === true) {
        execute()
      }
    })
  }

  return {
    execute,
    enqueue,
    complete
  }
}

module.exports = {
  taskpool
}