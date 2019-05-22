const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: false, useFindAndModify: false })


const scheduleSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      index: true,
      unique: true
    },
    status: String,
    type: String,
    active: Boolean,
    updatedAt: Date
  }
)

module.exports = mongoose.model('Schedule', scheduleSchema) 