import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, arrayUnion ,addDoc,serverTimestamp} from 'firebase/firestore';
import axios from 'axios';
// import "../../src/app/styles/main.scss";
import './event.scss'; // Ensure your CSS file is correctly linked
import '../../src/app/styles/user.scss';
import { IoMdClose } from "react-icons/io";
import Modal from 'react-modal';
import { createMarkup } from '../../component/util';
import HeaderNav from '../../component/HeaderNav';

import Swal from 'sweetalert2';



const EventLoginPage = () => {
  const router = useRouter();
  const { id } = router.query; // Get event name from URL
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState(''); // State to store user name
  const [error, setError] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [registerUsersList, setregisterUsersList] = useState(null);
  const [registeredUserCount, setRegisteredUserCount] = useState(0);
  const [suggestions, setFeedbackList] = useState([]);
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
  const [currentMeetingstatus, setcurrentMeetingstatus] = useState(null);
const [suggestionText, setSuggestionText] = useState("");
    const [cpPoints, setCPPoints] = useState(0);


  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const suggestionCollection = collection(db, "suggestions");
      const suggestionSnapshot = await getDocs(suggestionCollection);
      const filteredFeedback = suggestionSnapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            eventId: data.eventId || "Unknown",
            eventName: data.eventName || "Unknown Event",
            assignedTo: data.assignedTo || "Unassigned",
            taskDescription: data.taskDescription || "No Description",
            status: data.status || "Yet to be Discussed",
            createdBy: data.createdBy || "Unknown",
            date: data.date?.seconds
              ? new Date(data.date.seconds * 1000).toLocaleDateString()
              : "Yet To Be Assigned",
          };
        })
        .filter((item) => item.eventId === id); // use id from params here

      setFeedbackList(filteredFeedback);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFeedback();
    }
  }, [id]);

 

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
          fetchUserName(storedPhoneNumber);

          if (userDoc.data().response === "Accepted" || userDoc.data().response === "Declined") {
            setShowResponseModal(false);
          }

          else {
            setShowResponseModal(true);
          }

          if (userDoc.data().response === "Declined") {
            setcurrentMeetingstatus(true);
          }
        } else {
          // console.log('❌ User not registered. Registering now...');
          // await registerUserForEvent(storedPhoneNumber);
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


const submitAddFeedback = async () => {
  if (!suggestionText.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'Empty Suggestion',
      text: 'Please enter a suggestion before submitting.',
    });
    return;
  }

  try {
    await addDoc(collection(db, "suggestions"), {
      taskDescription: suggestionText,
      eventId: id,
      eventName: eventDetails?.name || "Unknown Event",
      createdAt: serverTimestamp(),
      createdBy: userName,
      status: "Pending"
    });

    setSuggestionText(""); 
    setshowpopup(false);   

    Swal.fire({
      icon: 'success',
      title: 'Submitted!',
      text: 'Your suggestion has been added.',
    });
  } catch (error) {
    console.error("❌ Error saving feedback:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Something went wrong. Please try again.',
    });
  }
};
const handleLogout = () => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'You will be logged out.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Logout',
    cancelButtonText: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('ntnumber');
      window.location.reload(); // or navigate to login
    }
  });
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
            <p>NT Arena</p>
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
        <div className='headerRight'>
              <button onClick={() => router.push(`/cp-details/${phoneNumber}`)} class="reward-btn">
                <div class="IconContainer">
                  <svg
                    class="box-top box"
                    viewBox="0 0 60 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 18L58 18"
                      stroke="#6A8EF6"
                      stroke-width="4"
                      stroke-linecap="round"
                    ></path>
                    <circle
                      cx="20.5"
                      cy="9.5"
                      r="7"
                      fill="#101218"
                      stroke="#6A8EF6"
                      stroke-width="5"
                    ></circle>
                    <circle
                      cx="38.5"
                      cy="9.5"
                      r="7"
                      fill="#101218"
                      stroke="#6A8EF6"
                      stroke-width="5"
                    ></circle>
                  </svg>

                  <svg
                    class="box-body box"
                    viewBox="0 0 58 44"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <mask id="path-1-inside-1_81_19" fill="white">
                      <rect width="58" height="44" rx="3"></rect>
                    </mask>
                    <rect
                      width="58"
                      height="44"
                      rx="3"
                      fill="#101218"
                      stroke="#6A8EF6"
                      stroke-width="8"
                      mask="url(#path-1-inside-1_81_19)"
                    ></rect>
                    <line
                      x1="-3.61529e-09"
                      y1="29"
                      x2="58"
                      y2="29"
                      stroke="#6A8EF6"
                      stroke-width="6"
                    ></line>
                    <path
                      d="M45.0005 20L36 3"
                      stroke="#6A8EF6"
                      stroke-width="5"
                      stroke-linecap="round"
                    ></path>
                    <path
                      d="M21 3L13.0002 19.9992"
                      stroke="#6A8EF6"
                      stroke-width="5"
                      stroke-linecap="round"
                    ></path>
                  </svg>

                  <div class="coin"></div>
                </div>
                <div class="text">CP: {cpPoints}</div>  
              </button>
              <div className='userName'> <span>{getInitials(userName)}</span> </div>
            </div>
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
            <div className='meetingDetailsBox eventdetails'>

              <div className='meetingDetailsheading'>
                <div className='statusbtn'>
                { eventDetails?.momUrl ? <span className='meetingLable2'>Completed</span> : <span className='meetingLable'>Upcoming</span>}
                  
                  {currentMeetingstatus ? <span className='meetingLable3'>Declined</span> : null}
                </div>


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
                  {eventDetails && <p dangerouslySetInnerHTML={createMarkup(eventDetails.agenda)}></p>}
                  {/* <p> </p> */}
                </div>
                <div>
                  <h4>Attendees</h4>
                  <ul>
                    {registerUsersList ? (
                      registerUsersList
                        .filter(doc => doc.response !== "Declined") // Exclude users who declined
                        .map(doc => (
                          <li key={doc.id}>
                            <span>{getInitials(doc.name)}</span>
                            <p>{doc.name}</p>
                          </li>
                        ))
                    ) : (
                      "loading"
                    )}
                  </ul>



                </div>
{eventDetails?.momUrl && (
  <div className='suggestionList'>
    <h4>Feedback and Suggestion</h4>
    
 {suggestions && suggestions.length > 0 ? (
  <div className="container suggestionList">
    {suggestions.map((suggestion) => (
      <div key={suggestion.id} >
        <div className="suggestionDetails">
        
          <span className="suggestionTime">{suggestion.date}</span>
        </div>

        <div className="boxHeading">
          <div className="suggestions">
            <p style={{ fontStyle:'normal' }}>{suggestion.taskDescription}</p>
          </div>
        </div>

        <div className="extraDetails">
         
          <p style={{ color: '#2c3e50' }}><strong >Suggested By:</strong> {suggestion.createdBy}</p>
        </div>
      </div>
    ))}
  </div>
) : (
  <p>No suggestions available</p>
)}


  </div>
)}
</div>
              
              <div className='meetingBoxFooter'>

                {
                  eventDetails?.momUrl ? <div className="momLink">
                    <a href={eventDetails.momUrl} target="_blank" rel="noopener noreferrer">
                      {/* <img src="/zoom-icon.png" alt="Zoom Link" width={30} /> */}
                      <span>MOM</span>
                    </a>
                  </div> : <>{!currentMeetingstatus ?
                    <div className="meetingLink">
                      <a href={eventDetails?.zoomLink} target="_blank" rel="noopener noreferrer">
                        {/* <img src="/zoom-icon.png" alt="Zoom Link" width={30} /> */}
                        <span>Join meeting</span>
                      </a>
                    </div> : null}
                  </>
                }
                {/* Button to Open Modal */}
                {
                  eventDetails?.momUrl ? <button className="addsuggestion" onClick={() => setshowpopup(true)}>
                   Add Suggestion
                  </button> : null
                }


              </div>
            </div>
<HeaderNav/>

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
              <div className={(showAcceptPopUp ? 'modal-content' : 'modadl-content hide')} >
                <h2>Are you Available for the Meeting?</h2>
                {/* <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy</p> */}
                <ul className='actionBtns'>
                  <li>
                    <button className="m-button" onClick={handleAccept}>
                      Yes
                    </button>
                  </li>
                  <li>
                    <button className="m-button-2" onClick={handleDecline}>
                      No
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
          <div className="modal-overlay">
    <div className="modal-content">
      <h3>Add Suggestion</h3>
      <textarea
        rows={4}
        value={suggestionText}
        placeholder="Write your comment..."
      onChange={(e) => setSuggestionText(e.target.value)}
      />
       <ul className='actionBtns'>
                    <li>
                      <button onClick={submitAddFeedback} className='m-button'>Submit</button>
                    </li>
                    <li>
                      <button onClick={() => setshowpopup(false)} className='m-button-2'>Cancel</button>
                    </li>
                  </ul>
    
    </div>
  </div>
            
            )
          }
        </section>
      </main>

    </>
  );

};

export default EventLoginPage;
