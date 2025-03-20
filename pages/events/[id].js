import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import axios from 'axios';
import "../../src/app/styles/main.scss";
import './event.css'; // Ensure your CSS file is correctly linked
import { IoMdClose } from "react-icons/io";

const EventLoginPage = () => {  
  const router = useRouter();
  const { id } = router.query; // Get event name from URL
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState(''); // State to store user name
  const [error, setError] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [registeredUserCount, setRegisteredUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false); // State to show/hide modal
  const [responseStatus, setResponseStatus] = useState(null);
const [declineReason, setDeclineReason] = useState('');
const [showDeclineModal, setShowDeclineModal] = useState(false);


 useEffect(() => {
  const checkRegistrationStatus = async () => {
    const storedEventId = localStorage.getItem('lastEventId');
    console.log('Current event ID:', id);
    console.log('Stored event ID in localStorage:', storedEventId);
    
    // Detect a new event and clear the previous user's phone number if the event has changed
    if (storedEventId !== id) {
      console.log('New event detected, clearing localStorage for userPhoneNumber');
      localStorage.removeItem('userPhoneNumber');
      localStorage.setItem('lastEventId', id); // Store new event ID
      setIsLoggedIn(false);
      setPhoneNumber(''); // Clear the phone number input field
    }

    // Retrieve user phone number if already set in localStorage
    const userPhoneNumber = localStorage.getItem('userPhoneNumber');
    console.log('Retrieved userPhoneNumber from localStorage:', userPhoneNumber);
    
    if (userPhoneNumber && id) {
      const registeredUserRef = doc(db, 'NTmeet', id, 'registeredUsers', userPhoneNumber);
      const userDoc = await getDoc(registeredUserRef);
      if (userDoc.exists()) {
        console.log('User is registered for this event:', userDoc.data());
        setIsLoggedIn(true);
        fetchEventDetails();
        fetchRegisteredUserCount();
        fetchUserName(userPhoneNumber);
      } else {
        console.log('User is not registered for this event. Clearing state.');
        setIsLoggedIn(false);
        setPhoneNumber('');
        localStorage.removeItem('userPhoneNumber'); // Clear if not registered
      }
    } else {
      console.log('No userPhoneNumber found or event ID is missing.');
    }
    setLoading(false);
  };

  checkRegistrationStatus();
}, [id]);

const handleAccept = async () => {
  if (id) {
    const userRef = doc(db, 'NTmeet', id, 'registeredUsers', phoneNumber);
    await setDoc(userRef, {
      phoneNumber,
      response: 'Accepted',
      responseTime: new Date(),
    }, { merge: true });

    setResponseStatus('Accepted');
  }
};
const handleDecline = () => {
  setShowDeclineModal(true);
};

const submitDeclineReason = async () => {
  if (id && declineReason.trim() !== '') {
    const userRef = doc(db, 'NTmeet', id, 'registeredUsers', phoneNumber);
    await setDoc(userRef, {
      phoneNumber,
      response: 'Declined',
      reason: declineReason,
      responseTime: new Date(),
    }, { merge: true });

    setResponseStatus('Declined');
    setShowDeclineModal(false);
  }
};


  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('https://api.ujustbe.com/mobile-check', {
        MobileNo: phoneNumber,
      });

      if (response.data.message[0].type === 'SUCCESS') {
        localStorage.setItem('userPhoneNumber', phoneNumber);
        setIsLoggedIn(true);

        await registerUserForEvent(phoneNumber);
        fetchEventDetails();
        fetchRegisteredUserCount();
        fetchUserName(phoneNumber); // Fetch user name after login
      } else {
        setError('Phone number not registered.');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('Login failed. Please try again.');
    }
  };

  const fetchUserName = async (phoneNumber) => {
    const userRef = doc(db, 'userdetails', phoneNumber);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const name = userDoc.data()[" Name"]; // Access the Name field with the space
      setUserName(name);
    } else {
      setError('User not found.');
    }
  };

  const registerUserForEvent = async (phoneNumber) => {
    if (id) {
      const registeredUsersRef = collection(db, 'NTmeet', id, 'registeredUsers');
      const newUserRef = doc(registeredUsersRef, phoneNumber);

      try {
        await setDoc(newUserRef, {
          phoneNumber: phoneNumber,
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
      
      // Update state with the number of registered users
      setRegisteredUserCount(userSnapshot.size);
    } catch (error) {
      console.error("Error fetching registered users:", error);
    }
  };

  // Modal handlers
  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (!isLoggedIn) {
    return (
      <div className='mainContainer'>
        <div className='logosContainer'>
          <img src="/ujustlogo.png" alt="Logo" className="logo" />
        </div>
        <div className="signin">
          <div className="loginInput">
            <div className='logoContainer'>
              <img src="/logo.png" alt="Logo" className="logos" />
            </div>
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

  return (
    <div className="mainContainer">
      <div className='UserDetails'>
        <h1 className="welcomeText">Welcome {userName || 'User'}</h1>
        <h2 className="eventName">to {eventDetails ? eventDetails.name : 'Event not found'}</h2>
      </div>
      <div className="eventDetails">
        <p>{eventTime}</p>
        <h2>{registeredUserCount}</h2>
        <p>Registered Orbiters</p>
      </div>
      <div className="response-btn">
  <button 
    className="accept-btn" 
    onClick={() => {
      handleAccept();
      setResponseStatus('Accepted');
    }} 
    disabled={responseStatus === 'Accepted'}
  >
    ✅ Accept
  </button>
  
  <button 
    className="decline-btn" 
    onClick={() => setShowDeclineModal(true)} 
    disabled={responseStatus === 'Declined'}
  >
    ❌ Decline
  </button>
</div>

{/* Display status */}
{responseStatus && <p>Status: {responseStatus}</p>}

{/* Decline Reason Modal */}
{showDeclineModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <button className="close-modal" onClick={() => setShowDeclineModal(false)}>×</button>
      <h2>Reason for Decline?</h2>
      <div className="leave-container">
        <div className="form-group">
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Enter reason..."
          />
          <div className="twobtn">
            <button 
              className='m-button-7' 
              onClick={() => {
                submitDeclineReason();
                setResponseStatus('Declined');
                setShowDeclineModal(false);
              }} 
              style={{ marginLeft: '10px', backgroundColor: '#f16f06', color: 'white' }}
            >
              Submit
            </button>
            <button 
              className='m-button-7' 
              onClick={() => setShowDeclineModal(false)} 
              style={{ marginLeft: '10px', backgroundColor: '#e2e2e2', color: 'black' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
{/* <button 
        className="suggestion-btn" 
        onClick={() => router.push('/suggestion')}
        style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        ➡️ Go to Suggestion Page
      </button> */}

      <div className="zoomLinkContainer">
        <a href={eventDetails?.zoomLink} target="_blank" rel="noopener noreferrer" className="zoomLink">
          <img src="/zoom-icon.png" alt="Zoom Link" width={30} />
          <span>Join Zoom Meet</span>
        </a>
      </div>
      <div className="agenda">
        <button className="agendabutton" onClick={handleOpenModal}>View Agenda</button>
      </div>

      {/* Modal */}
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
  );
};

export default EventLoginPage;
