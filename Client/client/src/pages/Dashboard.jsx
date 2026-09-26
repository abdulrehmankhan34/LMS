import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const token = localStorage.getItem("token");

        // Enrolled courses
        const response = await axios.get(
          "http://localhost:3000/my-enrollments",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        console.log(response.data);

        setEnrollments(response.data.enrollments);

        // Lectures
      for (const enrollment of response.data.enrollments) {
  const courseId = enrollment.course._id;

  // Lectures
  const lectureResponse = await axios.get(
    `http://localhost:3000/student-lectures/${courseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  setLectures(lectureResponse.data.lectures);

  // Assignments
  const assignmentResponse = await axios.get(
    `http://localhost:3000/student-assignments/${courseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  setAssignments(assignmentResponse.data.assignments);
}

        // Progress
        const progressResponse = await axios.get(
          "http://localhost:3000/progress",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        console.log(progressResponse.data);

        setProgress(progressResponse.data);

      } catch (error) {
        console.log(error.response?.data);
      }
    };

    fetchEnrollments();
  }, []);

  // Complete Lecture
  const handleCompleteLecture = async (lectureId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
  `http://localhost:3000/progress/complete-lecture/${lectureId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log(response.data);

      // Progress dobara fetch karna
      const progressResponse = await axios.get(
        "http://localhost:3000/progress",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setProgress(progressResponse.data);

    } catch (error) {
      console.log(error.response?.data);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/login");
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <h2>My Enrolled Courses</h2>

      {enrollments.map((enrollment) => (
        <div
          key={enrollment._id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginBottom: "10px"
          }}
        >
          <h3>{enrollment.course.title}</h3>

          <p>{enrollment.course.description}</p>

          <p>Price: {enrollment.course.price}</p>

          <h2>My Lectures</h2>

          {lectures.map((lecture) => (
            <div
              key={lecture._id}
              style={{
                border: "1px solid #ccc",
                padding: "15px",
                marginBottom: "10px"
              }}
            >
              <h3>{lecture.title}</h3>

              <p>{lecture.description}</p>

              {progress?.completedLectureIds?.includes(lecture._id) ? (
  <button disabled>
    Lecture Completed
  </button>
) : (
  <button
    onClick={() =>
      handleCompleteLecture(lecture._id)
    }
  >
    Complete Lecture
  </button>
)}
            </div>
          ))}
        </div>
      ))}

      {progress && (
        <div>
          <h2>Course Progress</h2>

          <p>Course: {progress.course}</p>

          <p>
            Lectures: {progress.completedLectures} /{" "}
            {progress.totalLectures}
          </p>

          <p>
            Progress: {progress.progressPercentage}%
          </p>
        </div>
      )}
      <h2>My Assignments</h2>

{assignments.map((assignment) => (
  <div
    key={assignment._id}
    style={{
      border: "1px solid #ccc",
      padding: "15px",
      marginBottom: "10px"
    }}
  >
    <h3>{assignment.title}</h3>

    <p>{assignment.description}</p>

    <p>
      Due Date: {assignment.dueDate}
    </p>
  </div>
))}

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;