import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },

  completedLectures: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture"
    }
  ]
});

const Progress = mongoose.model("Progress", progressSchema);

export default Progress;