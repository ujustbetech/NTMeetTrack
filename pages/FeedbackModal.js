import React from "react";

const FeedbackModal = ({ show, onClose, feedbackList }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Overall Feedback</h2>
        <button className="close-button" onClick={onClose}>✖</button>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>User Name</th>
                <th>Event ID</th>
                <th>Suggestion</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.length > 0 ? (
                feedbackList.map((feedback, index) => (
                  <tr key={feedback.id}>
                    <td>{index + 1}</td>
                    <td>{feedback.userName}</td>
                    <td>{feedback.eventId}</td>
                    <td>{feedback.suggestion}</td>
                    <td>{feedback.status}</td>
                    <td>{feedback.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No feedback available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
