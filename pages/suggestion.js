import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import "../src/app/styles/main.scss";

import '../pages/events/event.css';
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

const SuggestionList = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

    const [selectedFeedback, setSelectedFeedback] = useState(null);
  

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const eventsCollection = collection(db, "NTmeet");
      const eventsSnapshot = await getDocs(eventsCollection);
      let allFeedback = [];

      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        const eventId = eventDoc.id;
        const eventName = eventData.name || "Unknown Event";

        const usersCollection = collection(db, `NTmeet/${eventId}/registeredUsers`);
        const usersSnapshot = await getDocs(usersCollection);

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const phoneNumber = userData.phoneNumber || "";

          let userName = "Unknown User";
          if (phoneNumber) {
            const membersCollection = collection(db, "NTMembers");
            const q = query(membersCollection, where("phoneNumber", "==", phoneNumber));
            const membersSnapshot = await getDocs(q);
            if (!membersSnapshot.empty) {
              const memberData = membersSnapshot.docs[0].data();
              userName = memberData.name || "Unknown User";
            }
          }

          if (userData.feedback && userData.feedback.length > 0) {
            userData.feedback.forEach((feedbackEntry, index) => {
              const formattedDate = feedbackEntry.timestamp
                ? new Date(feedbackEntry.timestamp).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A";

              allFeedback.push({
                id: `${userDoc.id}-${index}`,
                eventId,
                userDocId: userDoc.id,
                eventName,
                userName,
                suggestion: feedbackEntry.custom || feedbackEntry.predefined || "N/A",
                date: formattedDate,
                status: feedbackEntry.status || "Yet to be Discussed",
              });
            });
          }
        }
      }

      setFeedbackList(allFeedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (feedbackId, eventId, userDocId) => {
    try {
      const userRef = doc(db, `NTmeet/${eventId}/registeredUsers`, userDocId);
      const userSnapshot = await getDocs(collection(userRef, "feedback"));
      
      userSnapshot.docs.forEach(async (feedbackDoc) => {
        await updateDoc(feedbackDoc.ref, { status: "Discussed" });
      });

      setFeedbackList((prevList) =>
        prevList.map((feedback) =>
          feedback.id === feedbackId ? { ...feedback, status: "Discussed" } : feedback
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div className="sessions-panel-wrapper">
        <div className='logosContainer'>
          <img src="/ujustlogo.png" alt="Logo" className="logo" />
        </div>
     
      <section className="c-form box">
        
      <div>
      <h2>Suggestion List</h2>
      {loading ? (
        <div className="loader">
          <span className="loader2"></span>
        </div>
      ) : (
        <table className="table-class">
         <thead>
  <tr>
    <th>Event</th>
    <th>User</th>
    <th>Action</th>
  </tr>
</thead>

          <tbody>
  {feedbackList.map((feedback, index) => (
    <tr key={index}>
      <td>{feedback.eventName}</td>
      <td>{feedback.userName}</td>
      <td>
        <button 
          className="m-button-7" 
          onClick={() => setSelectedFeedback(feedback)}
        >
          View Details
        </button>
      </td>
    </tr>
  ))}
</tbody>

        </table>
      )}

      {/* Modal */}
      {selectedFeedback && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Feedback Details</h3>

            <p><strong>Date:</strong> {selectedFeedback.date}</p>
            <p><strong>Suggestion:</strong> {selectedFeedback.suggestion}</p>
            <p>
              <strong>Status:</strong>{" "}
              {selectedFeedback.status === "Discussed" ? (
                <span className="status-discussed">Discussed</span>
              ) : (
                <button
                  className="status-button"
                  onClick={() => {
                    updateStatus(
                      selectedFeedback.id,
                      selectedFeedback.eventId,
                      selectedFeedback.userDocId
                    );
                    setSelectedFeedback(null); // Close modal after update
                  }}
                >
                  Mark as Discussed
                </button>
              )}
            </p>
            <button className="close-modal" onClick={() => setSelectedFeedback(null)}>
              x
            </button>
          </div>
        </div>
      )}
    </div>
      </section>
      </div>

  );
};

export default SuggestionList;
