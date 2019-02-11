// Commented out because it uses User table definition which doesnt exist.
// It would be best to avoid using services and use plain SQL instead

// const { User } = require('../../models/index')
// const users = require('../../services/users')

// const uniques = async () => {
//   const duplicates = {}
//   const primary = {}
//   const dbusers = await User.findAll()
//   for (let dbuser of dbusers) {
//     const { username, id } = dbuser
//     if (!primary[username]) {
//       primary[username] = id
//     } else {
//       const alternatives = duplicates[username] || []
//       duplicates[username] = alternatives.concat(id)
//     }
//   }
//   return { primary, duplicates}
// }

// const setElementsToPrimary = async (primary) => {
//   for (let [username, uid] of Object.entries(primary)) {
//     const elements = await users.getUserElementDetails(username)
//     const codes = elements.map(e => e.code)
//     await users.enableElementDetails(uid, codes)
//   }
// }

// const deleteDuplicates = async (duplicates) => {
//   for (let codes of Object.values(duplicates)) {
//     for (let uid of codes) {
//       const user = await User.findById(uid)
//       await user.destroy()
//     }
//   }
// }

// module.exports = {
//   up: async () => {
//     const { primary, duplicates } = await uniques()
//     await setElementsToPrimary(primary)
//     await deleteDuplicates(duplicates)
//   },
//   down: () => {
//   }
// }
