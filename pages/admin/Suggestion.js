import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import "../../src/app/styles/main.scss";
import Layout from '../../component/Layout';
import { collection, getDocs,getDoc, query, where, doc, updateDoc } from "firebase/firestore";

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
            const membersCollection = collection(db, "NTMember");
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

  const updatePredefined = async (feedbackId, eventId, userDocId, newPredefined) => {
    try {
      const userRef = doc(db, `NTmeet/${eventId}/registeredUsers`, userDocId);
      const userSnapshot = await getDoc(userRef);
  
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        
        // Update only the `predefined` field in the specific feedback entry
        const updatedFeedback = userData.feedback.map((feedback, index) =>
          `${userDocId}-${index}` === feedbackId 
            ? { ...feedback, predefined: newPredefined } 
            : feedback
        );
  
        // Update Firestore
        await updateDoc(userRef, { feedback: updatedFeedback });
  
        // Update state to reflect changes in UI
        setFeedbackList((prevList) =>
          prevList.map((feedback) =>
            feedback.id === feedbackId ? { ...feedback, predefined: newPredefined } : feedback
          )
        );
      }
    } catch (error) {
      console.error("Error updating predefined field:", error);
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
                    <select
  className="predefined-dropdown"
  value={feedback.predefined}
  onChange={(e) => updatePredefined(feedback.id, feedback.eventId, feedback.userDocId, e.target.value)}
>
  <option value="Acknowledged">Acknowledged</option>
  <option value="Accepted">Accepted</option>
  <option value="Declined">Declined</option>
  <option value="UJustBe Queue">UJustBe Queue</option>
  <option value="NT Queue">NT Queue</option>
  <option value="Approved">Approved</option>
</select>

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
