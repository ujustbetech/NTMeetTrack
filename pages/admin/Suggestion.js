import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import "../../src/app/styles/main.scss";
import Layout from '../../component/Layout';
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

const FeedbackList = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <Layout>
      <section className="c-form box">
        <div>
          <h2>Suggestion List</h2>
          {loading ? (
            <div className='loader'><span className="loader2"></span></div>
          ) : (
            <table className="table-class">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>User Name</th>
                  <th>Suggestion</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {feedbackList.map((feedback, index) => (
                  <tr key={index}>
                    <td>{feedback.eventName}</td>
                    <td>{feedback.userName}</td>
                    <td>{feedback.suggestion}</td>
                    <td>{feedback.date}</td>
                    <td>
                      {feedback.status === "Discussed" ? (
                        <span className="status-discussed">Discussed</span>
                      ) : (
                        <button
                          className="status-button"
                          onClick={() => updateStatus(feedback.id, feedback.eventId, feedback.userDocId)}
                        >
                          Mark as Discussed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default FeedbackList;
