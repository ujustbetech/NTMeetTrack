import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";

const ExportFeedback = () => {
  const [feedbackData, setFeedbackData] = useState([]);

  // ✅ Fetch all feedback with Event Name
  const fetchFeedback = async () => {
    try {
      const eventsCollection = collection(db, "NTmeet");
      const eventsSnapshot = await getDocs(eventsCollection);
      let allFeedback = [];

      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        const eventId = eventDoc.id;
        const eventName = eventData.name || "Unknown Event"; // 🔹 Fetch event name

        const usersCollection = collection(db, `NTmeet/${eventId}/registeredUsers`);
        const usersSnapshot = await getDocs(usersCollection);

        usersSnapshot.docs.forEach((userDoc) => {
          const userData = userDoc.data();
          if (userData.feedback && userData.feedback.length > 0) {
            userData.feedback.forEach((feedbackEntry) => {
              allFeedback.push({
                EventName: eventName, // 🔹 Use event name instead of event ID
                UserID: userDoc.id,
                Custom_Feedback: feedbackEntry.custom || "N/A",
                Predefined_Feedback: feedbackEntry.predefined || "N/A",
                Timestamp: feedbackEntry.timestamp || "N/A",
              });
            });
          }
        });
      }

      setFeedbackData(allFeedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  // ✅ Convert Data & Export to Excel
  const exportToExcel = () => {
    if (feedbackData.length === 0) {
      alert("No feedback data available to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(feedbackData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Feedback");

    XLSX.writeFile(workbook, "User_Feedback.xlsx");
  };

  // ✅ Fetch feedback when component loads
  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <button className="m-button-7" onClick={exportToExcel} style={{ marginLeft: '10px', marginBottom: '20px', color: 'white' }}>
      Export Suggestions
    </button>
  );
};

export default ExportFeedback;
