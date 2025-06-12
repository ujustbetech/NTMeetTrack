import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import Layout from "../../component/Layout";
import Swal from "sweetalert2";
import "../../src/app/styles/main.scss";

const SuggestionList = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const suggestionsRef = collection(db, "suggestions");
      const snapshot = await getDocs(suggestionsRef);

      const suggestionsData = snapshot.docs.map(docItem => {
        const data = docItem.data();
        let formattedDate = "N/A";

        if (data.date?.toDate) {
          const dateObj = data.date.toDate();
          formattedDate = dateObj.toLocaleDateString("en-GB"); // dd/mm/yyyy
        }

        return {
          id: docItem.id,
          eventName: data.eventName || "N/A",
          taskDescription: data.taskDescription || "N/A",
          createdBy: data.createdBy || "N/A",
          assignedTo: data.assignedTo || "N/A",
          date: formattedDate,
          status: data.status || "Pending",
        };
      });

      setSuggestions(suggestionsData);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (suggestionId, newStatus) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Change status to "${newStatus}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, update it!",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      try {
        const docRef = doc(db, "suggestions", suggestionId);
        await updateDoc(docRef, { status: newStatus });

        setSuggestions(prev =>
          prev.map(s =>
            s.id === suggestionId ? { ...s, status: newStatus } : s
          )
        );

        Swal.fire("Updated!", "Status has been updated.", "success");
      } catch (error) {
        Swal.fire("Error", "Failed to update status.", "error");
        console.error("Error updating status:", error);
      }
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <Layout>
      <section className="c-form box">
        <div>
          <h2>Suggestion List</h2>
          {loading ? (
            <div className="loader"><span className="loader2"></span></div>
          ) : (
            <table className="table-class">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Task Description</th>
                  <th>Created By</th>
                  <th>Assigned To</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s, index) => (
                  <tr key={index}>
                    <td>{s.eventName}</td>
                    <td>{s.taskDescription}</td>
                    <td>{s.createdBy}</td>
                    <td>{s.assignedTo}</td>
                    <td>{s.date}</td>
                    <td>
                      <select
                        className="predefined-dropdown"
                        value={s.status}
                        onChange={(e) => updateStatus(s.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Review">In Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
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

export default SuggestionList;
