/* eslint-disable */

const { router, wrapper } = require('./router').routerWithWrapper()
const axios = require('axios')

wrapper.get('/ping', async (req, res) => {
  res.json({
    message: 'pong'
  })
})

wrapper.get('/v3/mandatory_courses/:code', async (req, res) => {
  const courses = []
  const included = new Set()

  const dumb_flatten = module => {
    if (module.children) {
      module.children.forEach(child => {
        dumb_flatten(child)
      })
    } else if (module.code && !module.code.startsWith('KK') && !courses.map(c => c.code).includes(module.code)) {
      courses.push({
        name: {
          fi: module.name,
          en: module.name
        },
        code: module.code,
        label: { id: `${courses.length}`, label: module.code.replace('-', '').slice(0, 4), orderNumber: courses.length }
      })
    }
  }

  const better_flatten = (module, label) => {
    if (module.children) {
      module.children.forEach(child => {
        better_flatten(child, module.module ? module.module.name : label)
      })
    } else if (module.code && !module.code.startsWith('KK')) {
      courses.push({
        name: {
          fi: module.name,
          en: module.name
        },
        code: module.code,
        label: { id: `${courses.length}`, label, orderNumber: courses.length }
      })
    }
  }

  const superFlattenFlatten = (module, label) => {
    if (module.children) {
      module.children.forEach(child => {
        superFlattenFlatten(child, module.module ? module.module.name : label)
      })
    } else if (Array.isArray(module)) {
      module.forEach(elem => superFlattenFlatten(elem, label))
    } else if (module.code && !module.code.startsWith('KK')) {
      if (!included.has(`${label}${module.code}`)) {
        included.add(`${label}${module.code}`)
        courses.push({
          name: {
            fi: module.name,
            en: module.name
          },
          code: module.code,
          label: { id: `${courses.length}`, label, orderNumber: courses.length }
        })
      }
    }
  }

  const code = req.params.code
  const response = await axios.get(`http://sis-updater-scheduler:8082/v1/courses/${code}?token=dev&superFlatten=true`)

  // dumb_flatten(response.data)
  // better_flatten(response.data)
  superFlattenFlatten(response.data)

  const byCode = (c1, c2) => (c1.code < c2.code ? -1 : 1)

  courses.sort(byCode)
  res.json(courses)
})

module.exports = router
