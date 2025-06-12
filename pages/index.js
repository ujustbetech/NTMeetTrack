import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import * as React from 'react';
import { db } from '../firebaseConfig';
import Link from 'next/link'
import '../src/app/styles/user.scss';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import axios from 'axios';
import HeaderNav from '../component/HeaderNav';
import UserHeader from '../component/userHeader';
import Swal from 'sweetalert2';

const HomePage = () => {
  const router = useRouter();
  const { id } = router.query; // Get event name from URL
  const [phoneNumber, setPhoneNumber] = useState('');
  const [value, setValue] = React.useState(0);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [eventDetails, setEventDetails] = useState(null);
  const [registerUsersList, setregisterUsersList] = useState(null);
  const [cpPoints, setCPPoints] = useState(0);
  const [eventList, setEventList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false); // State to show/hide modal
  const [member, setMember] = useState([]); // Store fetched members
  const [monthlyMetCount, setMonthlyMetCount] = useState(0);
  const [ntMeetCount, setNtMeetCount] = useState(0);
  const [suggestionCount, setSuggestionCount] = useState(0);
  const [pendingSuggestionCount, setPendingSuggestionCount] = useState(0);
  const [upcomingMonthlyMeet, setUpcomingMonthlyMeet] = useState(null);
  const [upcomingNTMeet, setUpcomingNTMeet] = useState(null);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const now = new Date();

        // Fetch Monthly Meeting
        const monthlySnapshot = await getDocs(collection(db, "MonthlyMeeting"));
        const monthlyEvents = monthlySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().time?.toDate?.() || new Date(0)  // convert Firestore Timestamp to JS Date
        }));

        // Filter future events and get the earliest one
        const futureMonthlyEvents = monthlyEvents.filter(e => e.time > now);
        futureMonthlyEvents.sort((a, b) => a.time - b.time);
        setUpcomingMonthlyMeet(futureMonthlyEvents[0] || null);

        // Fetch NTmeet
        const ntMeetSnapshot = await getDocs(collection(db, "NTmeet"));
        const ntMeetEvents = ntMeetSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().time?.toDate?.() || new Date(0)
        }));

        const futureNTEvents = ntMeetEvents.filter(e => e.time > now);
        futureNTEvents.sort((a, b) => a.time - b.time);
        setUpcomingNTMeet(futureNTEvents[0] || null);

      } catch (error) {
        console.error("Error fetching upcoming events:", error);
      }
    };

    fetchUpcomingEvents();
  }, []);
  function formatTimeLeft(ms) {
    if (ms <= 0) return "Meeting Ended";

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  }
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

  useEffect(() => {
    const fetchDashboardCounts = async () => {
      if (!phoneNumber) return;

      try {
        // 1. NTMeet Count
        const ntMeetSnapshot = await getDocs(collection(db, "NTmeet"));
        setNtMeetCount(ntMeetSnapshot.size);

        // 2. Monthly Met Count
        const monthlyMetSnapshot = await getDocs(collection(db, "MonthlyMeeting"));
        setMonthlyMetCount(monthlyMetSnapshot.size);

        // 3. Suggestions
        const suggestionSnapshot = await getDocs(collection(db, "suggestions"));
        setSuggestionCount(suggestionSnapshot.size);

        // 4. Pending Suggestions
        let pending = 0;
        suggestionSnapshot.forEach(doc => {
          if (doc.data().status === "Pending") pending++;
        });
        setPendingSuggestionCount(pending);
      } catch (error) {
        console.error("Error fetching dashboard counts:", error);
      }
    };

    fetchDashboardCounts();
  }, [phoneNumber]);
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

  useEffect(() => {
    const storedPhoneNumber = localStorage.getItem("ntnumber");
    setPhoneNumber(storedPhoneNumber);

    if (storedPhoneNumber) {
      const getNTEventList = async () => {
        try {
          const eventCollection = collection(db, "NTmeet");
          const eventSnapshot = await getDocs(eventCollection);
          const eventList = eventSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort events by latest date (descending order)
          eventList.sort((a, b) => b.time.seconds - a.time.seconds);

          setEventList(eventList);
          console.log("Sorted events", eventList);
        } catch (err) {
          console.error("Error fetching team members:", err);
        }
      };
      setIsLoggedIn(true);
      setLoading(false);
      fetchUserName(storedPhoneNumber);
      getNTEventList()

    }
  }, []); // Empty dependency array to run only on mount


const handleLogin = async (e) => {
  e.preventDefault();

  const getNTEventList = async () => {
    try {
      const eventCollection = collection(db, "NTmeet");
      const eventSnapshot = await getDocs(eventCollection);
      const eventList = eventSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by latest date
      eventList.sort((a, b) => b.time.seconds - a.time.seconds);
      setEventList(eventList);
      console.log("Sorted events", eventList);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  try {
    const docRef = doc(db, "NTMembers", phoneNumber);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log('✅ Phone number found in NTMembers');

      localStorage.setItem('ntnumber', phoneNumber);
      setIsLoggedIn(true);
      fetchUserName(phoneNumber);
      getNTEventList();
      setLoading(false);
    } else {
      setError('You are not a NT Member.');
    }
  } catch (err) {
    console.error('❌ Error checking phone number:', err);
    setError('Login failed. Please try again.');
  }
};

  useEffect(() => {
    const fetchCP = async () => {
      try {
        const activitiesRef = collection(db, "NTMembers", phoneNumber, "activities");
        const activitiesSnapshot = await getDocs(activitiesRef);

        let totalCP = 0;

        activitiesSnapshot.forEach((doc) => {
          const data = doc.data();

          // Directly add the points field
          if (data.points) {
            totalCP += Number(data.points) || 0;
          }
        });

        setCPPoints(totalCP);
      } catch (error) {
        console.error("Error fetching CP points:", error);
      }
    };

    fetchCP();
  }, [phoneNumber]);


  const fetchUserName = async (phoneNumber) => {
    console.log("Fetch User from NTMember", phoneNumber);
    const userRef = doc(db, 'NTMembers', phoneNumber);
    const userDoc = await getDoc(userRef);

    console.log("Check Details", userDoc.data());

    if (userDoc.exists()) {
      const orbitername = userDoc.data().name;
      const mobileNumber = userDoc.data().phoneNumber;
      setUserName(orbitername);
      setPhoneNumber(mobileNumber);

    }

    else {
      console.log("user not found");

      // setError('User not found.');
    }
  };

  // useEffect(() => {
  //   if (isLoggedIn || error) {
  //     setLoading(false);
  //   }
  // }, [isLoggedIn, error]);





  if (!isLoggedIn) {
    return (
      <div className='mainContainer signInBox'>
        {/* <div className='logosContainer'>
          <img src="/ujustlogo.png" alt="Logo" className="logo" />
        </div> */}
        <div className="signin">
          <div className="loginInput">
            <div className='logoContainer'>
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



  // if (loading) {
  //   return (
  //     <div className="loader-container">
  //       <svg className="load" viewBox="25 25 50 50">
  //         <circle r="20" cy="50" cx="50"></circle>
  //       </svg>
  //     </div>
  //   );
  // }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }


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
            <div className='innerLogo'>
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
          <div className='container pageHeading'>
            <h1>Hi {userName || 'User'}</h1>
            <p>Let's Create Brand Ambassador through Contribution</p>
          </div>


          <section className="project-summary">
            <Link href="/NTmeetdetails">
              <div className="summary-card in-progress" style={{ cursor: 'pointer' }}>
                <p className="count">{ntMeetCount}</p>
                <p className="label">NT Meetings</p>
              </div>
            </Link>
            <Link href="/Monthlymeetdetails">
              <div className="summary-card in-review" style={{ cursor: 'pointer' }}>
                <p className="count">{monthlyMetCount}</p>
                <p className="label">Monthly Meetings</p>
              </div>
            </Link>
            <Link href="/SuggestionList">
              <div className="summary-card on-hold" style={{ cursor: 'pointer' }}>
                <p className="count">{suggestionCount}</p>
                <p className="label">Suggestions</p>
              </div>
            </Link>
            <Link href="/SuggestionList">
              <div className="summary-card completed" style={{ cursor: 'pointer' }}>
                <p className="count">{pendingSuggestionCount}</p>
                <p className="label">Pending Suggestions</p>
              </div>
            </Link>
          </section>


          <section className="upcoming-events">
  <h1>Upcoming Events</h1>

  {upcomingMonthlyMeet && (
    <div className="meetingBox">
      <div className="suggestionDetails">
        {(() => {
          const now = new Date();
          const eventDate = upcomingMonthlyMeet.time?.toDate ? upcomingMonthlyMeet.time.toDate() : upcomingMonthlyMeet.time;
          const timeLeftMs = eventDate - now;
          const timeLeft = timeLeftMs <= 0 ? 'Meeting Ended' : formatTimeLeft(timeLeftMs);
          return timeLeft === 'Meeting Ended' ? (
            <span className="meetingLable2">Meeting Done</span>
          ) : (
            <span className="meetingLable3">{timeLeft}</span>
          );
        })()}
        <span className="suggestionTime">
          {upcomingMonthlyMeet.time?.toDate
            ? upcomingMonthlyMeet.time.toDate().toLocaleString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}).replace(',', ' at')
            : upcomingMonthlyMeet.time.toLocaleString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}).replace(',', ' at')}
        </span>
      </div>

      <div className="meetingDetailsBox">
        <h3 className="eventName">{upcomingMonthlyMeet.Eventname || 'N/A'}</h3>
      </div>

      <div className="meetingBoxFooter">
        <div className="viewDetails">
          <Link href={`/MonthlyMeeting/${upcomingMonthlyMeet.id}`}>View Details</Link>
        </div>

        {(() => {
          const now = new Date();
          const eventDate = upcomingMonthlyMeet.time?.toDate ? upcomingMonthlyMeet.time.toDate() : upcomingMonthlyMeet.time;
          const isWithinOneHour = eventDate > now && (eventDate - now <= 60 * 60 * 1000);
          return isWithinOneHour && upcomingMonthlyMeet.zoomLink ? (
            <div className="meetingLink">
              <a href={upcomingMonthlyMeet.zoomLink} target="_blank" rel="noopener noreferrer">
                <span>Join Meeting</span>
              </a>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  )}

  {upcomingNTMeet && (
    <div className="meetingBox">
      <div className="suggestionDetails">
        {(() => {
          const now = new Date();
          const eventDate = upcomingNTMeet.time?.toDate ? upcomingNTMeet.time.toDate() : upcomingNTMeet.time;
          const timeLeftMs = eventDate - now;
          const timeLeft = timeLeftMs <= 0 ? 'Meeting Ended' : formatTimeLeft(timeLeftMs);
          return timeLeft === 'Meeting Ended' ? (
            <span className="meetingLable2">Meeting Done</span>
          ) : (
            <span className="meetingLable3">{timeLeft}</span>
          );
        })()}
        <span className="suggestionTime">
          {upcomingNTMeet.time?.toDate
            ? upcomingNTMeet.time.toDate().toLocaleString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}).replace(',', ' at')
            : upcomingNTMeet.time.toLocaleString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}).replace(',', ' at')}
        </span>
      </div>

      <div className="meetingDetailsBox">
        <h3 className="eventName">{upcomingNTMeet.name || 'N/A'}</h3>
      </div>

      <div className="meetingBoxFooter">
        <div className="viewDetails">
          <Link href={`/events/${upcomingNTMeet.id}`}>View Details</Link>
        </div>

        {(() => {
          const now = new Date();
          const eventDate = upcomingNTMeet.time?.toDate ? upcomingNTMeet.time.toDate() : upcomingNTMeet.time;
          const isWithinOneHour = eventDate > now && (eventDate - now <= 60 * 60 * 1000);
          return isWithinOneHour && upcomingNTMeet.zoomLink ? (
            <div className="meetingLink">
              <a href={upcomingNTMeet.zoomLink} target="_blank" rel="noopener noreferrer">
                <span>Join Meeting</span>
              </a>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  )}
</section>




          <div>
            {loading ? (
              <div className="loader">
                <span className="loader2"></span>
              </div>
            ) : <HeaderNav />}
          </div>





        </section>
      </main>

    </>
  );

};

export default HomePage;
