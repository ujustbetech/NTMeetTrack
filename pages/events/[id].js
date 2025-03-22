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
  const [responseStatus, setResponseStatus] = useState(true);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(true);
  const [showAcceptPopUp, setshowAcceptPopUp] = useState(false);
  const [showDeclinePopUp, setshowDeclinePopUp] = useState(false);



  useEffect(() => {
    const checkRegistrationStatus = async () => {
      const storedEventId = localStorage.getItem('lastEventId');
      console.log('Current event ID:', id);
      console.log('Stored event ID in localStorage:', storedEventId);

      // If new event is detected, update event ID
      if (storedEventId !== id) {
        console.log('🚀 New event detected. Updating localStorage.');
        localStorage.setItem('lastEventId', id);
      }

      // Retrieve stored phone number
      const storedPhoneNumber = localStorage.getItem('ntnumber');
      console.log('Retrieved phone number from localStorage:', storedPhoneNumber);
      if(storedPhoneNumber){
        setshowAcceptPopUp(true);
        setIsLoggedIn(true);

      }
      if (storedPhoneNumber && id) {
        const registeredUserRef = doc(db, 'NTmeet', id, 'registeredUsers', storedPhoneNumber);
        const userDoc = await getDoc(registeredUserRef);

        if (userDoc.exists()) {
          console.log('✅ User is already registered for this event:', userDoc.data().response);
          setIsLoggedIn(true);
          fetchEventDetails();
          fetchRegisteredUserCount();
          fetchUserName(storedPhoneNumber);
          if(userDoc.data().response === "Accepted"){
            setShowResponseModal(false);
          }
          else{
            setShowResponseModal(true);
          }

        } else {
          console.log('❌ User not registered. Registering now...');
          await registerUserForEvent(storedPhoneNumber);
          setIsLoggedIn(true);
          fetchEventDetails();
          fetchRegisteredUserCount();
          fetchUserName(storedPhoneNumber);
        }
      } else {
        console.log('❌ No phone number found or missing event ID.');
      }

      setLoading(false);
    };

    checkRegistrationStatus();
  }, [id]); // Runs when event ID changes

  // Store phone number when entered
  // const handlePhoneNumberSubmit = (number) => {
  //   localStorage.setItem('ntnumber', number); // Store as 'ntnumber'
  //   setPhoneNumber(number);
  // };

  const handleAccept = async () => {
    if (id) {
      
      console.log(id , phoneNumber);
      
      const userRef = doc(db, 'NTmeet', id, 'registeredUsers', phoneNumber);
      await setDoc(userRef, {
        phoneNumber,
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
        console.log('✅ Phone number verified:', phoneNumber);

        // ✅ Store the phone number as 'ntnumber' in localStorage
        localStorage.setItem('ntnumber', phoneNumber);

        setIsLoggedIn(true);

        // Register the user for the event using the stored number
        await registerUserForEvent(phoneNumber);
        fetchEventDetails();
        fetchRegisteredUserCount();
        fetchUserName(phoneNumber);
      } else {
        setError('Phone number not registered.');
      }
    } catch (err) {
      console.error('❌ Error during login:', err);
      setError('Login failed. Please try again.');
    }
  };

  const fetchUserName = async (phoneNumber) => {
    const userRef = doc(db, 'NTMembers', phoneNumber);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      console.log("Check Details",userDoc.data().phoneNumber);
      
      const name = userDoc.data()[" Name"]; // Access the Name field with the space
      const mobileNumber = userDoc.data().phoneNumber; // Access the Name field with the space
      setUserName(name);
      setPhoneNumber(mobileNumber);
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
    const handleCancelDecline = () => {
      setShowDeclineModal(false);  // Close Decline Modal
      setShowResponseModal(true);  // Show Accept/Decline Modal again
    };
    

  return (
    <div className="mainContainer">

      <div className={(showResponseModal ? 'modal-overlay' : 'modal-overlay hide')}>
        {/* Accept/Decline Modal */}

        {/* Accept */}
        {showResponseModal && (

          <div className= {(showAcceptPopUp ? 'modal-content' : 'modal-content hide')} >
            <h2>Do you accept this event?</h2>
            <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy</p>
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
                  <button onClick={handleCancelDecline}className='m-button-2'>Cancel</button>
                </li>
              </ul>
            </div>
          </div>
          

        )}
      </div>
      {/* Show event details only if a response is given */}
      {responseStatus && (

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




          <button
            className="suggestion-btn"
            onClick={() => router.push('/suggestion')}
            style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            ➡️ Go to Suggestion Page
          </button>

          {/* Zoom Link */}
          <div className="zoomLinkContainer">
            <a href={eventDetails?.zoomLink} target="_blank" rel="noopener noreferrer" className="zoomLink">
              <img src="/zoom-icon.png" alt="Zoom Link" width={30} />
              <span>Join Zoom Meet</span>
            </a>
          </div>

          {/* Agenda Button */}
          <div className="agenda">
            <button className="agendabutton" onClick={handleOpenModal}>View Agenda</button>
          </div>

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
      )}

    </div>
  );

};

export default EventLoginPage;
