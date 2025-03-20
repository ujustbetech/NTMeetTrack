import { useEffect, useState } from 'react';
import { db } from '../../../../firebaseConfig';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion,query,orderBy,onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/router'; 
import Layout from '../../../../component/Layout';
import "../../../../src/app/styles/main.scss";
import { IoMdClose } from "react-icons/io";
import { CiSearch } from "react-icons/ci";
import ExportToExcel from '../../ExporttoExcel';
import { GrFormView } from "react-icons/gr";
import Modal from 'react-modal';
import { FaSearch } from "react-icons/fa";
import EditEvent from '../edit/[id]';

Modal.setAppElement('#__next'); 
const customStyles = {
  content: { 
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: '500px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
  },
};

const RegisteredUsers = () => {
  const router = useRouter();
  const { id, eventId } = router.query; 
  const [eventDetails, setEventDetails] = useState(null);

  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [registeredNumberFilter, setRegisteredNumberFilter] = useState('');
  const [ujbCodeFilter, setUjbCodeFilter] = useState('');
  const [userNameFilter, setUserNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [feedbacks, setFeedbacks] = useState({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [addFeedbackModalIsOpen, setAddFeedbackModalIsOpen] = useState(false); // State for add feedback modal
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedFeedbacks, setSelectedFeedbacks] = useState([]);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(''); 
  const [predefinedFeedback, setPredefinedFeedback] = useState(''); 
  const [customFeedback, setCustomFeedback] = useState(''); 
   const [eventName, setEventName] = useState('');
      const [eventTime, setEventTime] = useState('');
      const [agendaPoints, setAgendaPoints] = useState(['']);
      const [zoomLink, setZoomLink] = useState('');
      const [loading, setLoading] = useState(false);
 
      const [success, setSuccess] = useState('');
      const [feedbackList, setFeedbackList] = useState([]);
   
      
        const fetchFeedback = async () => {
          
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
  
      // Fetch event data when ID changes
   
  
      // Handle event update
      const handleUpdateEvent = async (e) => {
          e.preventDefault();
          if (!eventName || !eventTime || !zoomLink || agendaPoints.some(point => point.trim() === '')) {
              setError('Please fill in all fields.');
              return;
          }
  
          try {
              const eventDocRef = doc(db, 'NTmeet', id);
              await updateDoc(eventDocRef, {
                  name: eventName,
                  time: Timestamp.fromDate(new Date(eventTime)),
                  agenda: agendaPoints,
                  zoomLink: zoomLink,
              });
  
              setSuccess('Event updated successfully!');
              router.push('/admin/event/manageEvent'); // Redirect after update
          } catch (error) {
              console.error("Error updating event:", error);
              setError('Error updating event. Please try again.');
          }
      };
  

  
  const predefinedFeedbacks = [
    "Available",
    "Not Available",
    "Not Connected Yet",
    "Called but no response",
    "Tentative",
    "Other response",
  ];

  useEffect(() => {
    if (!eventId) return;  // Ensure eventId is available
  
    const registeredUsersRef = collection(db, `NTmeet/${eventId}/registeredUsers`);
    const usersQuery = query(registeredUsersRef, orderBy('registeredAt', 'desc'));
  
    const unsubscribe = onSnapshot(usersQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const userDetails = snapshot.docs.map((doc) => ({
          id: doc.id, // User's phone number as doc ID
          ...doc.data(),
        }));
  
        try {
          const nameAndUJBPromises = userDetails.map(async (user) => {
            const userDocRef = doc(db, `userdetails/${user.id}`);
            const userDocSnap = await getDoc(userDocRef);
  
            return {
              id: user.id,
              name: userDocSnap.exists() ? userDocSnap.data()[" Name"] : 'Unknown',
              ujbcode: userDocSnap.exists() ? userDocSnap.data()["UJB Code"] : 'Unknown',
              category: userDocSnap.exists() ? userDocSnap.data()["Category"] : 'Unknown',
              ...user,
            };
          });
  
          const completeUsers = await Promise.all(nameAndUJBPromises);
          setRegisteredUsers(completeUsers);
          console.log("Fetched Users with Details:", completeUsers);
  
        } catch (error) {
          console.error("Error fetching additional user details:", error);
        }
      } else {
        console.log("No registered users found.");
        setRegisteredUsers([]);
      }
    }, (error) => {
      console.error('Error fetching registered users:', error);
    });
  
    return () => unsubscribe();  // Cleanup listener on unmount
  }, [eventId]);
  
 useEffect(() => {
    const filtered = registeredUsers.filter((user) =>
      (user.id || '').toLowerCase().includes(registeredNumberFilter.toLowerCase()) &&
      (user.ujbcode || '').toLowerCase().includes(ujbCodeFilter.toLowerCase()) &&
      (user.name || '').toLowerCase().includes(userNameFilter.toLowerCase()) &&
      (user.category || '').toLowerCase().includes(categoryFilter.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [registeredUsers, registeredNumberFilter, ujbCodeFilter, userNameFilter, categoryFilter]);
  

  const handleSearchChange = (e, setFilter) => {
    setFilter(e.target.value);
  };

  
  const openModal = (userFeedbacks, userName) => {
    setSelectedFeedbacks(userFeedbacks || []);
    setSelectedUserName(userName);
    setModalIsOpen(true);
  };

  // Open add feedback modal
  const openAddFeedbackModal = (userId, userName) => {
    setCurrentUserId(userId);
    setSelectedUserName(userName);
    setAddFeedbackModalIsOpen(true);
  };

  // Close feedback modal
  const closeModal = () => {
    setModalIsOpen(false);
  };

  // Close add feedback modal
  const closeAddFeedbackModal = () => {
    setAddFeedbackModalIsOpen(false);
    setPredefinedFeedback(''); 
    setCustomFeedback(''); 
  };

  
  const handlePredefinedFeedbackChange = (userId, feedback) => {
    setFeedbacks(prev => ({
      ...prev,
      [userId]: { ...prev[userId], predefined: feedback, custom: prev[userId]?.custom || '' }
    }));
  };

  // Handle custom feedback change in input
  const handleCustomFeedbackChange = (userId, feedback) => {
    setFeedbacks(prev => ({
      ...prev,
      [userId]: { ...prev[userId], custom: feedback }
    }));
  };


  const submitFeedback = async (userId) => {
    const { predefined, custom } = feedbacks[userId] || {};
    if (!predefined && !custom) { 
      alert("Please provide feedback before submitting.");
      return;
    }
    
    const timestamp = new Date().toLocaleString(); 
    const feedbackEntry = {
      predefined: predefined || 'No predefined feedback',
      custom: custom || 'No custom feedback',
      timestamp: `Submitted on: ${timestamp}`
    };

    await updateFeedback(userId, feedbackEntry);
  };

  // Update feedback in Firestore
  const updateFeedback = async (userId, feedbackEntry) => {
    try {
      const userRef = doc(db, `NTmeet/${eventId}/registeredUsers`, userId);
      
      await updateDoc(userRef, {
        feedback: arrayUnion(feedbackEntry)
      });
      
      alert("Feedback submitted successfully!");
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert("Error submitting feedback. Please try again.");
    }
  };

  // Submit feedback from the add feedback modal
  const submitAddFeedback = async () => {
    if (!predefinedFeedback && !customFeedback) {
      alert("Please provide feedback before submitting.");
      return;
    }

    const timestamp = new Date().toLocaleString();
    const feedbackEntry = {
      predefined: predefinedFeedback || 'No predefined feedback',
      custom: customFeedback || 'No custom feedback',
      timestamp: `Submitted on: ${timestamp}`
    };

    await updateFeedback(currentUserId, feedbackEntry);
    closeAddFeedbackModal();
  };
  useEffect(() => {
    console.log("Event ID:", eventId);
    if (!eventId) return;
  }, [eventId]);
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return; // Ensure eventId exists
  
      try {
        const eventDocRef = doc(db, "NTmeet", eventId);  // Make sure db is imported
        const eventSnap = await getDoc(eventDocRef);
  
        if (eventSnap.exists()) {

          setEventDetails(eventSnap.data()); // ✅ Set state
          setEventName(eventSnap.data().name)
          setEventTime(eventSnap.data().time)
          setAgendaPoints(eventSnap.data().agenda)
          setZoomLink(eventSnap.data().
          zoomLink)
        } else {
          console.log("No event found!");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };
  
    fetchEventDetails();
  }, [eventId]);
  
  useEffect(() => {
    console.log("Updated Event Details in State:", eventDetails);
  }, [eventDetails]);
  

  return (
    <Layout>
    <section className='c-form box'>
                <h2>Edit Event</h2>
                <button className="m-button-5" onClick={() => router.back()}>
                    Back
                </button>

                {loading ? (
                    <p>Loading event details...</p>
                ) : error ? (
                    <p style={{ color: 'red' }}>{error}</p>
                ) : (
                    <form onSubmit={handleUpdateEvent}>
                        <ul>
                            <li className='form-row'>
                                <h4>Event Name</h4>
                                <div className='multipleitem'>
                                    <input
                                        type="text"
                                        value={eventName}
                                        onChange={(e) => setEventName(e.target.value)}
                                        required
                                    />
                                </div>
                            </li>

                            <li className='form-row'>
                                <h4>Date</h4>
                                <div className='multipleitem'>
                                    <input
                                        type="datetime-local"
                                        value={eventTime}
                                        onChange={(e) => setEventTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </li>

                            <li className='form-row'>
                                <h4>Agenda</h4>
                                <div className='multipleitem'>
                                    {agendaPoints.map((point, index) => (
                                        <textarea
                                            key={index}
                                            value={point}
                                            onChange={(e) => {
                                                const updatedPoints = [...agendaPoints];
                                                updatedPoints[index] = e.target.value;
                                                setAgendaPoints(updatedPoints);
                                            }}
                                            required
                                        />
                                    ))}
                                </div>
                            </li>

                            <li className='form-row'>
                                <h4>Zoom Link</h4>
                                <div className='multipleitem'>
                                    <input
                                        type="text"
                                        value={zoomLink}
                                        onChange={(e) => setZoomLink(e.target.value)}
                                        required
                                    />
                                </div>
                            </li>

                            {success && <p style={{ color: 'green' }}>{success}</p>}

                            <li className='form-row'>
                                <div>
                                    <button className='submitbtn' type='submit'>Update</button>
                                </div>
                            </li>
                        </ul>
                    </form>
                )}
            </section>
   
            {/* <section className="c-form box">
        <div>
          <h2>Suggestion List</h2>
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
                    <button
                      onClick={() => updateStatus(feedback.id, feedback.eventId, feedback.userDocId)}
                      disabled={feedback.status === "Discussed"}
                    >
                      {feedback.status === "Discussed" ? "Discussed" : "Mark as Discussed"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section> */}
      <section className='c-userslist box'>
        {/* <ExportToExcel eventId={eventId} /> */}
      

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <table className='table-class'>
          
        </table>

        {/* User Table */}
        <table className='table-class'>
          <thead>
            <tr>
              <th>Sr no</th>
              <th>Registered Number</th>
              <th>UJB Code</th> 
              <th>User Name</th> 
              <th>Category</th>
              <th>Suggestions</th>
              <th>Response</th>
              <th>Reason for Decline</th>
            </tr>
          </thead>
          <thead>
            <tr>
              <th></th>
              <th>
            
   <div class="search">
      <input type="text" class="searchTerm" placeholder="Search by Registered Number"
            value={registeredNumberFilter}
            onChange={(e) => handleSearchChange(e, setRegisteredNumberFilter)}/>
      <button type="submit" class="searchButton">
        <FaSearch/>
     </button>
   </div>
 
          </th>
          <th>
          <div class="search">
      <input type="text" class="searchTerm" placeholder="Search by UJB Code"
            value={ujbCodeFilter}
            onChange={(e) => handleSearchChange(e, setUjbCodeFilter)}/>
      <button type="submit" class="searchButton">
        <FaSearch/>
     </button>
   </div>
         
          </th>
          <th>

          <div class="search">
      <input type="text" class="searchTerm" p placeholder="Search by User Name"
            value={userNameFilter}
            onChange={(e) => handleSearchChange(e, setUserNameFilter)}/>
      <button type="submit" class="searchButton">
        <FaSearch/>
     </button>
   </div>    
       
          </th>
          <th>
          <div class="search">
      <input type="text" class="searchTerm"   placeholder="Search by Category"
            value={categoryFilter}
            onChange={(e) => handleSearchChange(e, setCategoryFilter)}/>
      <button type="submit" class="searchButton">
        <FaSearch/>
     </button>
   </div>    
       
          </th>
          <th></th>
          </tr>
          </thead>
          <tbody>
          {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td> 
                  <td>{user.id}</td> 
                  <td>{user.ujbcode}</td>  
                  <td>{user.name || 'Unknown'}</td> 
                  <td>{user.category}</td> 
                  {/* <td>
                    <select
                      className="feedback-select"
                      onChange={(e) => handlePredefinedFeedbackChange(user.id, e.target.value)}
                    >
                      <option value="">Select Feedback</option>
                      {predefinedFeedbacks.map((feedback, idx) => (
                        <option key={idx} value={feedback}>{feedback}</option>
                      ))}
                    </select>

                    <input
                      className="feedback-input"
                      type="text"
                      value={feedbacks[user.id]?.custom || ''}
                      onChange={(e) => handleCustomFeedbackChange(user.id, e.target.value)}
                      placeholder="Enter feedback"
                    />
                    <button className='m-button-6' onClick={() => submitFeedback(user.id)}>
                      Add
                    </button>
                  </td> */}
                  <td>
                    <div className="twobtn">
                    <button className='m-button-7' onClick={() => openModal(user.feedback, user.name)} style={{ marginLeft: '10px', backgroundColor: '#e2e2e2', color: 'black' }}>
                      View
                    </button>
                    <button className='m-button-7' onClick={() => openAddFeedbackModal(user.id, user.name)} style={{ marginLeft: '10px', backgroundColor: '#f16f06', color: 'white' }}>
                      Add 
                    </button>
                    </div>
                  </td>
                  <td>
        {user.response ? user.response : "No Response"}
      </td>
      <td>
        {user.response === "Declined" ? user.reason || "No reason provided" : "-"}
      </td>
                </tr>
              ))
            ) : (
              <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>No registered users found</td>
            </tr>
            )}
          </tbody>
        </table>

        {/* Feedback Modal */}
        <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="modal"
  overlayClassName="overlay">
  
  <button className="closes-modal" onClick={closeModal}><IoMdClose /></button>
  
  <h2 className="modal-title">Feedback for {selectedUserName}</h2>
  
  {selectedFeedbacks.length > 0 ? (
    <table className="feedback-table">
      <thead>
        <tr>
          <th>Sr no</th>
          <th>Feedback</th>
          <th>Remark</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {selectedFeedbacks.map((feedback, index) => (
          <tr key={index}>
            <td>{index+1}</td>
            <td>{feedback.predefined}</td>
            <td>{feedback.custom}</td>
            <td>{feedback.timestamp}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p className="no-feedback-message">No feedback available.</p>
  )}
</Modal>

        {/* Add Feedback Modal */}
        <Modal isOpen={addFeedbackModalIsOpen} onRequestClose={closeAddFeedbackModal} className="modal"
      overlayClassName="overlay">
          <button className="close-modal" onClick={closeAddFeedbackModal}><IoMdClose /></button>
          <h2 className="modal-title">Add Feedback for {selectedUserName}</h2>
          <div className="leave-container">
          <div className="form-group">
          <select
            onChange={(e) => setPredefinedFeedback(e.target.value)}
            value={predefinedFeedback}
          >
            <option value="">Select Feedback</option>
            {predefinedFeedbacks.map((feedback, idx) => (
              <option key={idx} value={feedback}>{feedback}</option>
            ))}
          </select>
          </div>
          </div>
          <div className="form-group">
          <textarea
            value={customFeedback}
            onChange={(e) => setCustomFeedback(e.target.value)}
            placeholder="Enter feedback"
          />
          </div>
          <div className="twobtn">
          <button className='m-button-7' onClick={submitAddFeedback} style={{ marginLeft: '10px', backgroundColor: '#f16f06', color: 'white' }} >
            Submit
          </button>
          <button className='m-button-7' onClick={closeAddFeedbackModal} style={{ marginLeft: '10px', backgroundColor: '#e2e2e2', color: 'black' }}>
            Cancel
          </button>
          </div>
          
        </Modal>
      </section>
     
    </Layout>
  );
};

export default RegisteredUsers;
