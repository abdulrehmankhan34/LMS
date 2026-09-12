import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
    {
        title: {
            type: String, 
            required: true
        },
        description: {
            type: String,
            required: true
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        }
    }
)

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;