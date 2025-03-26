import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import axios from 'axios';
// import "../../src/app/styles/main.scss";
import './event.css'; // Ensure your CSS file is correctly linked
import { IoMdClose } from "react-icons/io";
import Modal from 'react-modal';



const EventLoginPage = () => {
  const router = useRouter();
  const { id } = router.query; // Get event name from URL
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState(''); // State to store user name
  const [error, setError] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [registerUsersList, setregisterUsersList] = useState(null);

  const [registeredUserCount, setRegisteredUserCount] = useState(0);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false); // State to show/hide modal
  const [responseStatus, setResponseStatus] = useState(true);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(true);
  const [showAcceptPopUp, setshowAcceptPopUp] = useState(false);
  const [showDeclinePopUp, setshowDeclinePopUp] = useState(false);
  const [addFeedbackModalIsOpen, setAddFeedbackModalIsOpen] = useState(false);
  const [predefinedFeedback, setPredefinedFeedback] = useState("");
  const [customFeedback, setCustomFeedback] = useState("");
  const [currentUserId, setCurrentUserId] = useState('');
  const [showpopup, setshowpopup] = useState(false);



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

      console.log("all Feedback", allFeedback);


      setFeedbackList(allFeedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {

    const checkRegistrationStatus = async () => {
      const storedEventId = localStorage.getItem('lastEventId');
      // console.log('Current event ID:', id);
      // console.log('Stored event ID in localStorage:', storedEventId);

      // If new event is detected, update event ID
      if (storedEventId !== id) {
        // console.log('🚀 New event detected. Updating localStorage.');
        localStorage.setItem('lastEventId', id);
      }

      // Retrieve stored phone number
      const storedPhoneNumber = localStorage.getItem('ntnumber');
      
      // console.log('Retrieved phone number from localStorage:', storedPhoneNumber);
      if (storedPhoneNumber) {
        setshowAcceptPopUp(true);
        setIsLoggedIn(true);
        fetchUserName(storedPhoneNumber);
      }
      if (storedPhoneNumber && id) {
        const registeredUserRef = doc(db, 'NTmeet', id, 'registeredUsers', storedPhoneNumber);
        const userDoc = await getDoc(registeredUserRef);

        if (userDoc.exists()) {
          // console.log('✅ User is already registered for this event:', userDoc.data().response);
          setIsLoggedIn(true);
          fetchEventDetails();
          fetchRegisteredUserCount();
          // fetchUserName(storedPhoneNumber);
          
          if (userDoc.data().response === "Accepted") {
            setShowResponseModal(false);
          }
          else {
            setShowResponseModal(true);
          }

        } else {
          // console.log('❌ User not registered. Registering now...');
          await registerUserForEvent(storedPhoneNumber);
          setIsLoggedIn(true);
          fetchEventDetails();
          // fetchRegisteredUserCount();

        }
      } else {
        // console.log('❌ No phone number found or missing event ID.');
      }

      setLoading(false);
    };
    fetchFeedback()
    checkRegistrationStatus();
  }, [id]); // Runs when event ID changes

  // Store phone number when entered
  // const handlePhoneNumberSubmit = (number) => {
  //   localStorage.setItem('ntnumber', number); // Store as 'ntnumber'
  //   setPhoneNumber(number);
  // };



  const handleAccept = async () => {
    if (id) {

      // // console.log("Check mobile Number", id , phoneNumber);
      const storedPhoneNumber = localStorage.getItem('ntnumber');

      const userRef = doc(db, 'NTmeet', id, 'registeredUsers', storedPhoneNumber);
      await setDoc(userRef, {
        phoneNumber,
        name: userName,
        response: 'Accepted',
        responseTime: new Date(),
      }, { merge: true });

      setResponseStatus("Accepted");
      setShowResponseModal(false);
    }
  };

  const handleDecline = () => {
    setShowDeclineModal(true);
    setshowDeclinePopUp(true);
    setshowAcceptPopUp(false);
  };

  const submitDeclineReason = async () => {
    if (id && declineReason.trim() !== '') {
      const userRef = doc(db, 'NTmeet', id, 'registeredUsers', phoneNumber);
      await setDoc(userRef, {
        phoneNumber,
        name: userName,
        response: 'Declined',
        reason: declineReason,
        responseTime: new Date(),
      }, { merge: true });

      setResponseStatus("Declined");
      setShowDeclineModal(false);
      setShowResponseModal(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('https://api.ujustbe.com/mobile-check', {
        MobileNo: phoneNumber,
      });

      if (response.data.message[0].type === 'SUCCESS') {
        console.log('✅ Phone number verified:', response.data);

        // ✅ Store the phone number as 'ntnumber' in localStorage
        localStorage.setItem('ntnumber', phoneNumber);

        setIsLoggedIn(true);
        setshowAcceptPopUp(true);

        // Register the user for the event using the stored number

        fetchEventDetails();
        fetchRegisteredUserCount();
        fetchUserName(phoneNumber);
      } else {
        setError('Phone number not registered.');
      }
    } catch (err) {
      // console.error('❌ Error during login:', err);
      setError('Login failed. Please try again.');
    }
  };

  const fetchUserName = async (phoneNumber) => {
    console.log("Fetch User from NTMembers", phoneNumber);
    const userRef = doc(db, 'NTMembers', phoneNumber);
    const userDoc = await getDoc(userRef);

    console.log("Check Details", userDoc.data());

    if (userDoc.exists()) {
      const orbitername = userDoc.data().name; // Access the Name field with the space
      const mobileNumber = userDoc.data().phoneNumber; // Access the Name field with the space
      setUserName(orbitername);
      setPhoneNumber(mobileNumber);
      // registerUserForEvent(phoneNumber, orbitername);
    }

    else {
      console.log("user not found");

      // setError('User not found.');
    }
  };

  const registerUserForEvent = async (phoneNumber, orbitername) => {
    console.log("find user name", orbitername);

    if (id) {
      const registeredUsersRef = collection(db, 'NTmeet', id, 'registeredUsers');
      const newUserRef = doc(registeredUsersRef, phoneNumber);

      try {
        await setDoc(newUserRef, {
          phoneNumber: phoneNumber,
          name: orbitername,
          registeredAt: new Date(),
        });
      } catch (err) {
        console.error('Error registering user in Firebase:', err);
      }
    }
  };

  // Fetch event details from Firestore
  const fetchEventDetails = async () => {
    if (id) {
      const eventRef = doc(db, 'NTmeet', id);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        setEventDetails(eventDoc.data());
        console.log("get single user details", eventDoc.data());

      } else {
        setError('No event found.');
      }
      setLoading(false);
    }
  };

  const fetchRegisteredUserCount = async () => {
    if (!id) return; // Ensure 'id' is defined

    try {
      // Correct reference to the 'registeredUsers' subcollection
      const registeredUsersRef = collection(db, `NTmeet/${id}/registeredUsers`);

      // Fetch all documents inside 'registeredUsers'
      const userSnapshot = await getDocs(registeredUsersRef);

      // Fetch documents
      const querySnapshot = await getDocs(registeredUsersRef);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setregisterUsersList(docs)

      console.log("Register User", docs);



      // Update state with the number of registered users
      setRegisteredUserCount(userSnapshot.size);
    } catch (error) {
      console.error("Error fetching registered users:", error);
    }
  };

  // user feedback function
  const predefinedFeedbacks = [
    "Available",
    "Not Available",
    "Not Connected Yet",
    "Called but no response",
    "Tentative",
    "Other response",
  ];
  // Update feedback in Firestore
  const updateFeedback = async (userId, feedbackEntry) => {
    console.log("verify updated content", userId, feedbackEntry);


    try {
      const userRef = doc(db, `NTmeet/${id}/registeredUsers`, userId);

      await updateDoc(userRef, {
        feedback: arrayUnion(feedbackEntry)  // Append feedback without overwriting
      });

      // alert("Feedback submitted successfully!");
      // await fetchFeedbacks(userId); // Fetch updated feedback list after submission
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
      predefined: null || 'No predefined feedback',
      custom: customFeedback || 'No custom feedback',
      timestamp: `Submitted on: ${timestamp}`
    };

    const docId = localStorage.getItem('ntnumber');

    await updateFeedback(docId, feedbackEntry);

    // Clear form fields
    setPredefinedFeedback("");
    setCustomFeedback("");

    setshowpopup(false);
  };

  const closeAddFeedbackModal = () => {
    setAddFeedbackModalIsOpen(false);
    setPredefinedFeedback('');
    setCustomFeedback('');
  };

  if (!isLoggedIn) {
    return (
      <div className='mainContainer signInBox'>
        {/* <div className='logosContainer'>
          <img src="/ujustlogo.png" alt="Logo" className="logo" />
        </div> */}
        <div className="signin">
          <div className="loginInput">
            <div className='logoContainer' >
              <img src="/logo.png" alt="Logo" className="logos" />
              
            </div>
            <p>NT Areana</p>
            <form onSubmit={handleLogin}>
              <ul>
                <li>
                  <input
                    type="text"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </li>
                <li>
                  <button className="login" type="submit">Login</button>
                </li>
              </ul>
            </form>
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loader-container">
        <svg className="load" viewBox="25 25 50 50">
          <circle r="20" cy="50" cx="50"></circle>
        </svg>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  const eventTime = eventDetails?.time?.seconds
    ? new Date(eventDetails.time.seconds * 1000).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short', // Abbreviated month name like "Jan"
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // For 24-hour format
    })
    : "Invalid time";
  const handleCancelDecline = () => {
    setShowDeclineModal(false);  // Close Decline Modal
    setShowResponseModal(true);  // Show Accept/Decline Modal again
  };

  const getInitials = (name) => {
    return name
      .split(" ") // Split the name into words
      .map(word => word[0]) // Get the first letter of each word
      .join(""); // Join them together
  };



  return (
    <>
      <main className="pageContainer">


        <header className='Main m-Header'>
          <section className='container'>
            <div className='innerLogo' onClick={() => router.push('/')}>
              <img src="/ujustlogo.png" alt="Logo" className="logo" />
            </div>
            <div className='userName'> {userName || 'User'} <span>{getInitials(userName)}</span> </div>
          </section>
        </header>

        <section className='dashBoardMain'>
          <div className='container'>
            {/* <h1>{eventDetails ? eventDetails.name : 'Event not found'}</h1> */}
            {/* <p>Lets Create Brand Ambasaddor through Contribution</p> */}
          </div>
          <div className='container'>
          </div>
          <div className='container '>
            <div className='meetingDetailsBox'>

              <div className='meetingDetailsheading'>
                <span className='meetingLable'>Current Meeting</span>
                <h3>{eventDetails ? eventDetails.name : 'Event not found'}</h3>
                <p>
                  {/* {eventDetails.uniqueId} */}
                  {eventDetails ? eventDetails.uniqueId : null}
                </p>
                {/* <p>View Agenda</p> */}
              </div>

              <div className='meetingContent'>
                <div>
                  <h4>Agenda</h4>
                  <p>{eventDetails ? eventDetails.agenda : null}</p>
                </div>
                <div>
                  <h4>Atendees</h4>
                  <ul>
                    {registerUsersList ? registerUsersList?.map(doc => (
                      <li key={doc.id}>
                        <span>{getInitials(doc.name)}</span>
                        <p>{doc.name} </p>
                      </li>
                    )) : "loading"

                    }

                  </ul>
                </div>
                {eventDetails?.momUrl ? (
                  <div className='suggestionList'>
                    <h4>Feedback and Suggestion</h4>
                    {registerUsersList && registerUsersList.length > 0 ? (
                      <ul>
                        {registerUsersList.map((doc) =>
                          doc.feedback && doc.feedback.length > 0 ? (
                            <li key={doc.id}>
                              <span>{getInitials(doc.name)}</span>
                              {/* <strong>{doc.name}</strong>: */}
                              <div className='listfeedback'>
                                {doc.feedback.map((fb, index) => (
                                  <p key={index}>
                                    {fb.custom || fb.predefined} {/* Show custom if available, otherwise predefined */}
                                    {index !== doc.feedback.length - 1 ? "" : ""}
                                  </p>
                                ))}
                              </div>
                            </li>
                          ) : null
                        )}
                      </ul>
                    ) : (
                      <p>No feedback available</p>
                    )}
                  </div>) : null
                }
              </div>
              <div className='meetingBoxFooter'>

                {
                  eventDetails?.momUrl ? <div className="momLink">
                    <a href={eventDetails.momUrl} target="_blank" rel="noopener noreferrer">
                      {/* <img src="/zoom-icon.png" alt="Zoom Link" width={30} /> */}
                      <span>MOM</span>
                    </a>
                  </div> : <div className="meetingLink">
                    <a href={eventDetails?.zoomLink} target="_blank" rel="noopener noreferrer">
                      {/* <img src="/zoom-icon.png" alt="Zoom Link" width={30} /> */}
                      <span>Join meeting</span>
                    </a>
                  </div>
                }
                {/* Button to Open Modal */}
                {
                  eventDetails?.momUrl ? <button className="suggetionBtn" onClick={() => setshowpopup(true)}>
                  Suggestion
                </button> : null
                }
                

              </div>
            </div>

            <button
              className="suggestion-btn"
              onClick={() => router.push('/suggestion')}
            >
              View Suggestion
            </button>

            {/* Agenda Modal */}
            {showModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <button className="close-modal" onClick={handleCloseModal}>×</button>
                  <h2>Agenda</h2>
                  {eventDetails?.agenda && eventDetails.agenda.length > 0 ? (
                    <div dangerouslySetInnerHTML={{ __html: eventDetails.agenda }} />
                  ) : (
                    <p>No agenda available.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Pop Up */}

          <div className={(showResponseModal ? 'modal-overlay' : 'modal-overlay hide')}>
            {/* Accept/Decline Modal */}

            {/* Accept */}
            {showResponseModal && (
              <div className={(showAcceptPopUp ? 'modal-content' : 'modal-content hide')} >
                <h2>Do you accept this event?</h2>
                {/* <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy</p> */}
                <ul className='actionBtns'>
                  <li>
                    <button className="m-button" onClick={handleAccept}>
                      Accept
                    </button>
                  </li>
                  <li>
                    <button className="m-button-2" onClick={handleDecline}>
                      Decline
                    </button>
                  </li>
                </ul>
              </div>
            )}

            {/* Decline Reason Modal */}
            {showDeclineModal && (
              <div className={(showDeclinePopUp ? 'modal-content' : 'modal-content hide')}>
                <div className='contentBox'>
                  <h2>Reason for Declining</h2>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Enter reason..."
                  />
                  <ul className='actionBtns'>
                    <li>
                      <button onClick={submitDeclineReason} className='m-button'>Submit</button>
                    </li>
                    <li>
                      <button onClick={handleCancelDecline} className='m-button-2'>Cancel</button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Form UI */}
          {showpopup && (
            <section className="PopupMain">
              <div className="popupBox">

                {/* <button className="close-modal" onClick={closeAddFeedbackModal}><IoMdClose /></button> */}
                <h2>Suggestions / Feedback</h2>
                <div className="leave-container">
                  {/* <div className="form-group">
                  <select
                    onChange={(e) => setPredefinedFeedback(e.target.value)}
                    value={predefinedFeedback}
                  >
                    <option value="">Select Feedback</option>
                    {predefinedFeedbacks.map((feedback, idx) => (
                      <option key={idx} value={feedback}>{feedback}</option>
                    ))}
                  </select>
                </div> */}
                </div>
                <div className="form-group">
                  <textarea
                    value={customFeedback}
                    onChange={(e) => setCustomFeedback(e.target.value)}
                    placeholder="Enter feedback"
                  />
                </div>
                <div className="twobtn">
                  <button className='submitBtn' onClick={submitAddFeedback} >
                    Submit
                  </button>
                  {/* <button className='' onClick={closeAddFeedbackModal} >
                  Cancel
                </button> */}
                </div>

                <button className="closeBtn" onClick={() => setshowpopup(false)}><IoMdClose /></button>
              </div>
            </section>)
          }
        </section>
      </main>

    </>
  );

};

export default EventLoginPage;
