const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: false, useFindAndModify: false })


const scheduleSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      unique: true
    },
    status: String,
    type: String,
    active: Boolean,
    updatedAt: {
      type: Date,
      index: true
    }
  }
)

module.exports = mongoose.model('Schedule', scheduleSchema) 