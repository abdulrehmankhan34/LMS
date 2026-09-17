import mongoose from "mongoose";

const quizQuestionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true
  },

  question: {
    type: String,
    required: true
  },

  options: {
    type: [String],
    required: true
  },

  correctAnswer: {
    type: String,
    required: true
  }
});

const QuizQuestion = mongoose.model(
  "QuizQuestion",
  quizQuestionSchema
);

export default QuizQuestion;