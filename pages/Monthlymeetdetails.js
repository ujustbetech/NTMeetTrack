import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs,doc,getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig'; 
import '../src/app/styles/user.scss';
import '/pages/events/event.scss'; // Ensure your CSS file is correctly linked
import { useRouter } from 'next/router';
import Link from 'next/link'
import HeaderNav from '../component/HeaderNav';
const db = getFirestore(app);

const AllEvents = () => {
  const [events, setEvents] = useState([]);
   const [userName, setUserName] = useState('');
     const [phoneNumber, setPhoneNumber] = useState('');
   const router = useRouter();
    const [cpPoints, setCPPoints] = useState(0);


  useEffect(() => {
  
const fetchAllEvents = async () => {
  try {
    const storedPhoneNumber = localStorage.getItem('ntnumber');

    if (!storedPhoneNumber) {
      console.warn('Phone number not found in localStorage');
      return; // Stop the function if there's no phone number
    }

    const querySnapshot = await getDocs(collection(db, 'MonthlyMeeting'));

    const eventList = await Promise.all(
      querySnapshot.docs.map(async (eventDoc) => {
        const eventData = { id: eventDoc.id, ...eventDoc.data() };

        const regUserRef = doc(db, 'MonthlyMeeting', eventDoc.id, 'registeredUsers', storedPhoneNumber);
        const regUserSnap = await getDoc(regUserRef);

        eventData.isUserRegistered = regUserSnap.exists();

        return eventData;
      })
    );

    setEvents(eventList);
  } catch (error) {
    console.error('Error fetching events:', error);
  }
};

    fetchAllEvents();
  }, []);
 const getInitials = (name) => {
    return name
      .split(" ") // Split the name into words
      .map(word => word[0]) // Get the first letter of each word
      .join(""); // Join them together
  };
useEffect(() => {
  const storedPhoneNumber = localStorage.getItem('ntnumber');
  if (storedPhoneNumber) {
    fetchUserName(storedPhoneNumber);
    setPhoneNumber(storedPhoneNumber);
  } else {
    console.error("Phone number not found in localStorage.");
  }
}, []);

  
useEffect(() => {
  if (!phoneNumber) return; // 👈 important check

  const fetchCP = async () => {
    try {
      const activitiesRef = collection(db, "Orbiters", phoneNumber, "activities");
      const activitiesSnapshot = await getDocs(activitiesRef);

      let totalCP = 0;

      activitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        totalCP += Number(data?.points) || 0;
      });

      setCPPoints(totalCP);
    } catch (error) {
      console.error("Error fetching CP points:", error);
    }
  };

  fetchCP();
}, [phoneNumber]);


const fetchUserName = async (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
    console.error("Invalid phone number:", phoneNumber);
    return;
  }

  console.log("Fetch User from Userdetails", phoneNumber);
  try {
    const userRef = doc(db, 'userdetails', phoneNumber);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const orbitername = userDoc.data()[" Name"] || 'User';
      setUserName(orbitername);
    } else {
      console.log("User not found in userdetails");
    }
  } catch (err) {
    console.error("Error fetching user name:", err);
  }
};

const sortedEvents = [...events].sort((a, b) => {
  const dateA = a.time?.toDate?.() || new Date(0);
  const dateB = b.time?.toDate?.() || new Date(0);
  return dateB - dateA; // latest first
});

  
  
  return (
    <>
    <main className="pageContainer">
      <header className='Main m-Header'>
        <section className='container'>
          <div className='innerLogo' onClick={() => router.push('/')}>
            <img src="/ujustlogo.png" alt="Logo" className="logo" />
          </div>
           <div className='headerRight'>
              {/* <button onClick={() => router.push(`/cp-details/${phoneNumber}`)} class="reward-btn">
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
              </button> */}
              <div className='userName'> <span>{getInitials(userName)}</span> </div>
            </div>

        
        </section>
      </header>
      <section className='dashBoardMain'>
     <div className='sectionHeadings'>
          <h2>Monthly Meetings</h2> 
         </div>
      <div className='container eventList'>
  {sortedEvents.map((event, index) => {
    const eventDate = event.time?.toDate?.();
    const now = new Date();

    // Calculate time left
let timeLeft = '';
let isWithinOneHour = false; // <-- new flag

if (eventDate) {
  const diffMs = eventDate - now;

  if (diffMs > 0) {
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
    timeLeft = `${diffDays}d ${diffHours}h ${diffMinutes}m left`;

    // Check if within 1 hour
    isWithinOneHour = diffMs <= 60 * 60 * 1000;
  } else {
    timeLeft = 'Meeting Ended';
  }
} else {
  timeLeft = 'N/A';
}

    const isUpcoming = eventDate && eventDate > now;

    return (
 <Link href={`/MonthlyMeeting/${event.id}`} key={index} className="meetingBoxLink">
  <div className='meetingBox'>
    <div className="suggestionDetails">
      {timeLeft === 'Meeting Ended' ? (
        <span className="meetingLable2">Meeting Done</span>
      ) : (
        <span className="meetingLable3">{timeLeft}</span>
      )}
    <span className="suggestionTime">
  {eventDate?.toLocaleString?.('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) || 'N/A'}
</span>

    </div>

    <div className='meetingDetails'>
      <h3 className="eventName">{event.Eventname || 'N/A'}</h3>
    </div>

    <div className='meetingBoxFooter'>
      <div className='viewDetails'>
        <Link href={`/MonthlyMeeting/${event.id}`}>View Details</Link>
      </div>

      {timeLeft === 'Meeting Ended' ? (
        event.isUserRegistered ? (
          <button className="registered-btn" onClick={(e) => e.stopPropagation()}>
            ✅ Registered
          </button>
        ) : null
      ) : (
        <>
          {isWithinOneHour ? (
            <div className="meetingLink" onClick={(e) => e.stopPropagation()}>
              <a href={event.zoomLink} target="_blank" rel="noopener noreferrer">
                <span>Join Meeting</span>
              </a>
            </div>
          ) : event.isUserRegistered ? (
            <button className="registered-btn" onClick={(e) => e.stopPropagation()}>
              ✅ Registered
            </button>
          ) : (
            <button className="register-now-btn" onClick={(e) => e.stopPropagation()}>
              Register Now
            </button>
          )}
        </>
      )}
    </div>
  </div>
</Link>


    );
  })}
</div>

    <HeaderNav/>
    </section>
    </main>
    </>
  );
};

export default AllEvents;
