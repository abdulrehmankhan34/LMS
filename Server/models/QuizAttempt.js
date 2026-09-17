import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true
  },

  answers: [
    {
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuizQuestion",
        required: true
      },

      answer: {
        type: String,
        required: true
      }
    }
  ],

  score: {
    type: Number,
    default: 0
  },

  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const QuizAttempt = mongoose.model(
  "QuizAttempt",
  quizAttemptSchema
);

export default QuizAttempt;