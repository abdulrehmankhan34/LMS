import express from "express";
import dotenv from "dotenv";
import User from "./models/User.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import authMiddleware from "./middleware/authMiddleware.js";
import roleMiddleware from "./middleware/roleMiddleware.js";
import Course from "./models/Course.js";
import Enrollment from "./models/Enrollment.js"
import Lecture from "./models/Lecture.js";
import Assignment from "./models/Assignment.js";
import Quiz from "./models/Quiz.js";
import QuizQuestion from "./models/QuizQuestion.js";
import QuizAttempt from "./models/QuizAttempt.js";
import Progress from "./models/Progress.js";
dotenv.config();



const app = express()
app.use(express.json())

app.post("/users", async (req, res) => {

  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create(
      {
        name,
        email,
        password: hashedPassword
      }
    )
    res.status(201).json(user)

  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
);
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );
    console.log("JWT Token:", token); // Log the generated token for debugging

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {

    res.status(400).json({
      message: error.message
    });
  }
});
app.post("/courses",
  authMiddleware, roleMiddleware("teacher"), async (req, res) => {
    try {
      const { title, description, price } = req.body;
      const teacherId = req.user.userId; // Get the teacher's ID from the authenticated user
      const course = await Course.create({
        title,
        description,
        price,
        teacher: teacherId
      });
      res.status(201).json(course);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
app.put("/courses/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const courseId = req.params.id;
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (course.teacher.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "You can only update your own course"
        });
      }
      const { title, description, price } = req.body;
      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { title, description, price },
        { new: true }
      );
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.status(200).json({ message: "Course Updated Successfully", course: updatedCourse });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app.delete("/courses/:id",
  authMiddleware, roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const courseId = req.params.id;
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      console.log("COURSE TEACHER ID:", course.teacher.toString());
      console.log("LOGGED IN USER ID:", req.user.userId);
      if (course.teacher.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "You can only delete your own course"
        });
      }
      const deletedCourse = await Course.findByIdAndDelete(courseId);
      if (!deletedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.status(200).json({ message: "Course deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
app.get("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
app.post("/enroll", authMiddleware, roleMiddleware("student"), async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.userId;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    });
    if (existingEnrollment) {
      return res.status(400).json({ message: "You are already enrolled in this course" });
    }
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId
    });
    res.status(201).json({ message: "Enrollment created successfully", enrollment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
})

app.get(
  "/my-enrollments",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const studentId = req.user.userId;
      const enrollments = await Enrollment.find({
        student: studentId
      }).populate("course");
      res.status(200).json({ message: "Enrollments found", enrollments });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }
);

app.post(
  "/lectures",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const { title, description, courseId } = req.body;
      const teacherId = req.user.userId;
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          message: "Course not found"
        });
      }
      if (course.teacher.toString() !== teacherId) {
        return res.status(403).json({
          message: "You are not authorized to add lecture to this course"
        });
      }
      const lecture = await Lecture.create({
        title,
        description,
        course: courseId
      });
      res.status(201).json({
        message: "Lecture created successfully",
        lecture
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }
);
app.get(
  "/lectures",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {

      const lectures = await Lecture.find();
      res.status(200).json({ message: "Lectures found", lectures });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }
);
app.get(
  "/lectures/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const lectureId = req.params.id;

      const lecture = await Lecture.findById(lectureId);

      if (!lecture) {
        return res.status(404).json({
          message: "Lecture not found"
        });
      }

      res.status(200).json({
        message: "Lecture found",
        lecture
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.put(
  "/lectures/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const lectureId = req.params.id;
      const lecture = await Lecture.findById(lectureId).populate("course");
      if (!lecture) {
        return res.status(404).json({
          message: "Lecture not found"
        });
      }
      if (lecture.course.teacher.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "You are not authorized to update this lecture"
        });
      }
      const { title, description } = req.body;
      lecture.title = title;
      lecture.description = description;
      // lecture.videoUrl = videoUrl;
      await lecture.save();
      res.status(200).json({
        message: "Lecture updated successfully",
        lecture
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.delete(
  "/lectures/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const lectureId = req.params.id;
      const lecture = await Lecture.findById(lectureId).populate("course");
      if (!lecture) {
        return res.status(404).json({
          message: "Lecture not found"
        });
      }
      if (lecture.course.teacher.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "You are not authorized to delete this lecture"
        });
      }
      await Lecture.findByIdAndDelete(lectureId);

      res.status(200).json({
        message: "Lecture deleted successfully"
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.post(
  "/assignments",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const { title, description, courseId, dueDate } = req.body;
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          message: "Course not found",
        });
      }
      if (course.teacher.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "You are not authorized to create an assignment for this course",
        });
      }
      const assignment = await Assignment.create({
        title,
        description,
        course: courseId,
        dueDate,
      });
      res.status(201).json({
        message: "Assignment created successfully",
        assignment,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }
);
app.get("/assignments", authMiddleware, roleMiddleware("teacher"), async (req, res) => {
  try {
    const assignments = await Assignment.find().populate("course");
    res.status(200).json({ message: "Assignments found", assignments });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
})
app.get(
  "/assignments/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const assignmentId = req.params.id;

      const assignment = await Assignment.findById(assignmentId)
        .populate("course");

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found"
        });
      }

      res.status(200).json({
        message: "Assignment found",
        assignment
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.put(
  "/assignments/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const assignment = await Assignment.findById(assignmentId).populate("course");
      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found"
        });
      }
      if (assignment.course.teacher.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "You are not authorized to update this assignment"
        });
      }
      const { title, description, dueDate } = req.body;
      assignment.title = title;
      assignment.description = description;
      assignment.dueDate = dueDate;
      await assignment.save();
      res.status(200).json({
        message: "Assignment updated successfully",
        assignment
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error",
      });
    }
  }
);
app.delete(
  "/assignments/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const assignmentId = req.params.id;

      const assignment = await Assignment.findById(assignmentId)
        .populate("course");

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found"
        });
      }

      if (assignment.course.teacher.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "You are not authorized to delete this assignment"
        });
      }

      await Assignment.findByIdAndDelete(assignmentId);

      res.status(200).json({
        message: "Assignment deleted successfully"
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.post("/quizzes", authMiddleware, roleMiddleware("teacher"), async (req, res) => {
  try {
    const { title, description, courseId } = req.body;
    const course = await Course.findById(courseId);
    if(!course) {
      res.status(404).json({ message: "Course not found" });
    }
    if(course.teacher.toString() !== req.user.userId) {
      res.status(403).json({ message: "You are not authorized to create a quiz for this course" });
    }
    const quiz = await Quiz.create({
      title,
      description,
      course: courseId
    });
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (error) {
    res.status(400).json({ message: error.message
    })
  }
})
app.get(
  "/quizzes",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const quizzes = await Quiz.find().populate("course");

      res.status(200).json({
        message: "Quizzes found",
        quizzes
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.get(
  "/quizzes/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const quizId = req.params.id;
      const quiz = await Quiz.findById(quizId).populate("course");
      if(!quiz) {
        return res.status(404).json({
          message: "Quiz not found"
        });
      }
      if(quiz.course.teacher.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "You are not authorized to view this quiz"
        });
      } 
      res.status(200).json({
        message: "Quiz found",
        quiz
      });
    }
    catch (error) {
      res.status(500).json({
        message: "Server error",  
      });
    }
  }
);
app.put(
  "/quizzes/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const quizId = req.params.id;
      const quiz = await Quiz.findById(quizId).populate("course");
      if(!quiz) {
        return res.status(404).json({
          message: "Quiz not found"
        });
      }
      if(quiz.course.teacher.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "You are not authorized to update this quiz"
        });
      }
      const { title, description } = req.body;
      quiz.title = title;
      quiz.description = description;
      await quiz.save();
      res.status(200).json({
        message: "Quiz updated successfully",
        quiz
      });
    }
    catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
)
app.delete(
  "/quizzes/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const quizId = req.params.id;
      const quiz = await Quiz.findById(quizId).populate("course");
      if(!quiz) {
        return res.status(404).json({
          message: "Quiz not found"
        });
      }
      if(quiz.course.teacher.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "You are not authorized to delete this quiz"
        });
      }
      await Quiz.findByIdAndDelete(quizId);
      res.status(200).json({
        message: "Quiz deleted successfully"
      });
    }
    catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.post(
  "/quiz-questions",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const { quizId, question, options, correctAnswer } = req.body;

      const quiz = await Quiz.findById(quizId);

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found"
        });
      }

      const quizQuestion = await QuizQuestion.create({
        quiz: quizId,
        question,
        options,
        correctAnswer
      });

      res.status(201).json({
        message: "Quiz question created",
        quizQuestion
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.get(
  "/quiz-questions",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const questions = await QuizQuestion.find().populate("quiz");

      res.status(200).json({
        message: "Quiz questions found",
        questions
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.put(
  "/quiz-questions/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const { question, options, correctAnswer } = req.body;

      const quizQuestion = await QuizQuestion.findByIdAndUpdate(
        req.params.id,
        {
          question,
          options,
          correctAnswer
        },
        { new: true }
      );

      if (!quizQuestion) {
        return res.status(404).json({
          message: "Quiz question not found"
        });
      }

      res.status(200).json({
        message: "Quiz question updated",
        quizQuestion
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.delete(
  "/quiz-questions/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  async (req, res) => {
    try {
      const quizQuestion = await QuizQuestion.findByIdAndDelete(
        req.params.id
      );

      if (!quizQuestion) {
        return res.status(404).json({
          message: "Quiz question not found"
        });
      }

      res.status(200).json({
        message: "Quiz question deleted"
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.post(
  "/quiz-attempt",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const { quizId, answers } = req.body;
      const studentId = req.user.userId;

      const quiz = await Quiz.findById(quizId);

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found"
        });
      }

      const questions = await QuizQuestion.find({
        quiz: quizId
      });

      let score = 0;

      for (const studentAnswer of answers) {
        const question = questions.find(
          (q) => q._id.toString() === studentAnswer.question
        );

        if (
          question &&
          question.correctAnswer === studentAnswer.answer
        ) {
          score++;
        }
      }

      const quizAttempt = await QuizAttempt.create({
        student: studentId,
        quiz: quizId,
        answers,
        score
      });

      res.status(201).json({
        message: "Quiz attempted successfully",
        quizAttempt
      });

    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }
);
app.post(
  "/progress",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const { courseId } = req.body;
      const studentId = req.user.userId;

      const course = await Course.findById(courseId);
    
      if (!course) {
        return res.status(404).json({
          message: "Course not found"
        });
      }

      const enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId
      });

      if (!enrollment) {
        return res.status(403).json({
          message: "You are not enrolled in this course"
        });
      }

      const existingProgress = await Progress.findOne({
        student: studentId,
        course: courseId
      });

      if (existingProgress) {
        return res.status(400).json({
          message: "Progress already exists for this course"
        });
      }

      const progress = await Progress.create({
        student: studentId,
        course: courseId,
        completedLectures: []
      });

      res.status(201).json({
        message: "Progress created successfully",
        progress
      });

    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }
);
app.put(
  "/progress/complete-lecture/:lectureId",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const studentId = req.user.userId;
      console.log("STUDENT ID:", studentId); // Log the student ID for debugging
      const lectureId = req.params.lectureId;
      console.log("LECTURE ID:", lectureId); // Log the lecture ID for debugging

      const lecture = await Lecture.findById(lectureId);

      if (!lecture) {
        return res.status(404).json({
          message: "Lecture not found"
        });
      }

      const progress = await Progress.findOne({
        student: studentId,
        course: lecture.course
      });

      if (!progress) {
        return res.status(404).json({
          message: "Progress not found"
        });
      }

      if (progress.completedLectures.includes(lectureId)) {
        return res.status(400).json({
          message: "Lecture already completed"
        });
      }

      progress.completedLectures.push(lectureId);

      await progress.save();
    
      res.status(200).json({
        message: "Lecture marked as completed",
        progress
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.get(
  "/progress",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const studentId = req.user.userId;

      const progress = await Progress.findOne({
        student: studentId
      }).populate("course");

      if (!progress) {
        return res.status(404).json({
          message: "Progress not found"
        });
      }

      const totalLectures = await Lecture.countDocuments({
        course: progress.course._id
      });

      const completedLectures = progress.completedLectures.length;

      const progressPercentage =
        totalLectures === 0
          ? 0
          : (completedLectures / totalLectures) * 100;

      res.status(200).json({
        message: "Progress found",
        course: progress.course.title,
        totalLectures,
        completedLectures,
        progressPercentage
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message
      });
    }
  }
);
app.get("/profile", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "Protected route accessed",
    user: req.user
  });
});
app.get(
  "/admin-test",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    res.json({
      message: "Admin route accessed successfully",
      user: req.user
    });
  }
);
app.get(
  "/teacher-test",
  authMiddleware,
  roleMiddleware("admin", "teacher"),
  (req, res) => {
    res.json({
      message: "Admin or Teacher can access this route",
      user: req.user
    });
  }
);
app.get("/", (req, res) => {
  res.send("Hello World")
})


export default app