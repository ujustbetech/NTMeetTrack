import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import Swal from 'sweetalert2';
//import '../../src/app/styles/main.scss';
//import '/pages/events/frontend.scss';
//import '/pages/events/event.scss';
import '../../src/app/styles/user.scss';
import { app } from '../../firebaseConfig';
import HeaderNav from '../../component/HeaderNav';

const db = getFirestore(app);

export default function EventDetailsPage() {
  const router = useRouter();
  const { eventId } = router.query;
  const [userName, setUserName] = useState('');
  const [eventInfo, setEventInfo] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('agenda');
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!eventInfo?.time?.seconds) return;

    const targetTime = new Date(eventInfo.time.seconds * 1000).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft(null); // Event is over
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown(); // Run immediately
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [eventInfo]);

  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      try {
        const eventDocRef = doc(db, 'MonthlyMeeting', eventId);
        const eventSnap = await getDoc(eventDocRef);
        if (eventSnap.exists()) {
          setEventInfo(eventSnap.data());
        }

        const registeredUsersRef = collection(db, `MonthlyMeeting/${eventId}/registeredUsers`);
        const regUsersSnap = await getDocs(registeredUsersRef);

        const userDetails = await Promise.all(
          regUsersSnap.docs.map(async (docSnap) => {
            const phone = docSnap.id;
            const regUserData = docSnap.data();
            const userData = docSnap.data();
            const userDoc = await getDoc(doc(db, 'userdetails', phone));
            const name = userDoc.exists() ? userDoc.data()[" Name"] : 'Unknown';

            return {
              phone,
              name,
              attendance: regUserData.attendanceStatus === true ? 'Yes' : 'No',
              feedback: userData.feedback || []
            };
          })
        );

        setUsers(userDetails);
      } catch (err) {
        console.error('Error fetching event/user data:', err);
      }
    };

    fetchEventData();
  }, [eventId]);

  const getInitials = (name) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("");
  };

  useEffect(() => {
    const storedPhoneNumber = localStorage.getItem('ntnumber');
    fetchUserName(storedPhoneNumber);
  }, []);

  const fetchUserName = async (phoneNumber) => {
    const userRef = doc(db, 'NTMembers', phoneNumber);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      setUserName(userDoc.data().name);
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
  const renderTabContent = () => {
    if (!eventInfo) return <div className='loader'><span className="loader2"></span></div>

   switch (activeTab) {
      case 'agenda':
        return (
          <>
            <h3>Agenda</h3>
            {eventInfo.agenda?.length > 0 ? (
              <ul>
                {eventInfo.agenda.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>Yet to be uploaded</p>
            )}
          </>
        );

      case 'MoM':
        return (
          <>
            <h3>MoM Uploads</h3>
            {eventInfo.documentUploads?.length > 0 ? (
              eventInfo.documentUploads.map((doc, idx) => (
                <div key={idx} className="document-item">
                  <strong>Description:</strong>
                  <p>{doc.description}</p>
                  {doc.files?.map((file, i) => (
                    <p key={i} className="file-link-wrapper">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-link"
                      >
                        <span role="img" aria-label="PDF" style={{ marginRight: '8px', color: 'red' }}>
                          📄
                        </span>
                        {file.name}
                      </a>
                    </p>
                  ))}
                </div>
              ))
            ) : (
              <p>Yet to be uploaded</p>
            )}
          </>
        );
  case 'Topic of the Day':
        return (
          <>
            <h3>Topic of the Day</h3>
         <div>
           <p><strong>Title: </strong>{eventInfo?.titleOfTheDay || 'No Topic'}</p>
                   <p><strong>Description: </strong>{eventInfo?.description || 'No Description'}</p>
            
                 </div>
             
          </>
        );
      case 'facilitators':
        return (
          <>
            <h3>Facilitators</h3>
            {eventInfo.facilitatorSections?.length > 0 ? (
              eventInfo.facilitatorSections.map((f, idx) => (
                <div key={idx}>
                  <strong>{f.facilitator}</strong>
                  <p>{f.facilitatorDesc}</p>
                </div>
              ))
            ) : (
              <p>No Facilitators Identified</p>
            )}
          </>
        );

      case 'Knowledge Sharing':
        return (
          <>
            <h3>Knowledge Sharing</h3>
            {eventInfo.knowledgeSections?.length > 0 ? (
              eventInfo.knowledgeSections.map((k, idx) => (
                <div key={idx}>
                  <p><strong>Topic:</strong> {k.topic}</p>
                  <p><strong>Name:</strong> {k.name}</p>
                  <p><strong>Description:</strong> {k.description}</p>
                </div>
              ))
            ) : (
              <p>No Knowledge Sharing Session</p>
            )}
          </>
        );

      case 'New energy':
        return (
          <>
            <h3>Prospects Identified</h3>
            {eventInfo.prospectSections?.length > 0 ? (
              eventInfo.prospectSections.map((p, idx) => (
                <div key={idx}>
                      <p><strong>Orbiter's Name: </strong> {p.prospect}</p>
                        <p><strong>Prospect's Name: </strong> {p.prospectName}</p>
                 
                  <p>{p.prospectDescription}</p>
                </div>
              ))
            ) : (
              <p>No New Energies</p>
            )}
          </>
        );

      case 'referrals':
        return (
          <>
            <h3>Referrals</h3>
            {eventInfo.referralSections?.length > 0 ? (
              eventInfo.referralSections.map((r, idx) => (
                <div key={idx}>
                  <p><strong>From: </strong> {r.referralFrom}</p>
                  <p><strong>To: </strong> {r.referralTo}</p>
                  <p><strong>Description:</strong> {r.referralDesc}</p>
                    <p><strong>Status:</strong> {r.status || 'Not specified'}</p>
                </div>
              ))
            ) : (
              <p>No Referrals Identified</p>
            )}
          </>
        );

      case 'requirements':
        return (
          <>
            <h3>Requirements</h3>
            {eventInfo.requirementSections?.length > 0 ? (
              eventInfo.requirementSections.map((req, idx) => (
                <div key={idx}>
                  <p><strong>From:</strong> {req.reqfrom} — {req.reqDescription}</p>
                    
                </div>
              ))
            ) : (
              <p>No Requirements Identified</p>
            )}
          </>
        );

      case 'E2A':
  return (
    <>
      <h3>E2A</h3>
      {eventInfo.e2aSections?.length > 0 ? (
        eventInfo.e2aSections.map((e2a, idx) => {
          const formattedDate = new Date(e2a.e2aDate).toLocaleDateString('en-GB');
          return (
            <div key={idx} style={{ border: '1px solid #ccc', marginBottom: '1rem', padding: '1rem' }}>
              <div>
                <p><strong>{e2a.e2a}</strong> {e2a.status ? '✅ Done' : ''}</p>
                <p>{formattedDate}</p>
              </div>
              <p>{e2a.e2aDesc}</p>
            </div>
          );
        })
      ) : (
        <p>No E2A </p>
      )}
    </>
  );


      case 'One to One Interaction':
        return (
          <>
            <h3>One to One Interactions</h3>
            {eventInfo.sections?.length > 0 ? (
              eventInfo.sections.map((s, idx) => {
                const formattedDate = new Date(s.interactionDate).toLocaleDateString('en-GB');
                return (
                  <div key={idx}>
                    <p><strong>Date:</strong> {formattedDate}</p>
                    <p><strong>Participants:</strong> {s.selectedParticipant1} & {s.selectedParticipant2}</p>
                  </div>
                );
              })
            ) : (
              <p>No One to One Interactions</p>
            )}
          </>
        );

      case 'Registrations':
        return (
          <>
            <h3>Registered Users</h3>
            {users?.length > 0 ? (
              <>
                <p>Orbiters Participated: {users.filter(user => user.attendance === 'Yes').length}</p>
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Attended</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.phone}>
                        <td>{user.name}</td>
                        <td
                          style={{
                            color: user.attendance === 'Yes' ? 'white' : 'black',
                            backgroundColor: user.attendance === 'Yes' ? '#a2cbda' : 'transparent',
                            fontWeight: user.attendance === 'Yes' ? '600' : 'normal',
                            textAlign: 'center',
                          }}
                        >
                          {user.attendance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p>Yet to be uploaded</p>
            )}

          </>
        );
      case 'feedback':
        return (
          <>
            <h3 style={{ marginBottom: '15px' }}>Feedbacks</h3>
            {users && users.length > 0 ? (
              <>
                {users
                  .filter(user => user.feedback && user.feedback.length > 0)
                  .map((user) => (
                    <div
                      key={user.phone}
                    >
                      <strong style={{ fontSize: '16px', color: '#fe6f06' }}>{user.name}</strong>
                      <ul style={{ marginTop: '10px', paddingLeft: '20px', color: '#333' }}>
                        {user.feedback.map((fb, idx) => (
                          <li key={idx} style={{ marginBottom: '5px' }}>{fb.custom}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                }
              </>
            ) : (
              <p>No Feedback</p>
            )}
          </>
        );



      default:
        return <p>Yet to be uploaded</p>;
    }
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
            <div className="userName" onClick={handleLogout} style={{ cursor: 'pointer' }}>
  <span>{getInitials(userName)}</span>
</div>
            </div>





          </section>
        </header>
        <section className='p-meetingDetails'>
          <div className='container pageHeading'>

            <div className="event-container">
              {/* Event image and countdown */}
              <div className="event-header">
                <img src="/creative.jpg" alt="Event" className="event-image" />
                {timeLeft ? (
                  <div className="timer">
                    {timeLeft.days > 0 ? (
                      <>
                        <div className="time">
                          {timeLeft.days}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m
                        </div>

                      </>
                    ) : (
                      <>
                        <div className="time">
                          {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.minutes).padStart(2, '0')} : {String(timeLeft.seconds).padStart(2, '0')}
                        </div>

                      </>
                    )}
                  </div>
                ) : (
                  <div className="countdown">
                    <div className="meeting-done">Completed</div>
                  </div>
                )}


              </div>

              {/* Event info */}
              <div className="event-content">
                <div className='sectionHeading'>
                  <h2 className="event-title">{eventInfo?.Eventname || 'Event Details'}</h2>


                  {/* <p className="organizer">Organized by Malia Steav</p> */}
                  <p className="event-date">
                    {eventInfo?.time ? new Date(eventInfo.time.seconds * 1000).toLocaleString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}).replace(',', ' at') : 'Event'}
                  </p>
                </div>


                {/* <p className="location-name">minuit.agency</p> */}
                <div className="avatar-container">
                  <div className="avatars">
                    {users.slice(0, 8).map((user, index) => (
                      <div key={user.phone} className="avatar">
                        {getInitials(user.name)}
                      </div>
                    ))}
                    {users.length > 8 && (
                      <div className="more">+{users.length - 8}</div>
                    )}
                  </div>
                  <div className='registeredusers'>
                    <div className="info">
                      <span>{users.length} Orbiters</span> have registered
                    </div>


                    <div className="see-all" onClick={() => setActiveTab("Registrations")}>
                      See all
                    </div>
                  </div>
                </div>
                <div className='eventinnerContent'>
                  <div className="tabs">
                    {[
                      'agenda', 'Registrations','facilitators', 'Knowledge Sharing',
                      'New energy', 'Topic of the Day','referrals','One to One Interaction', 'requirements','E2A' ,'MoM','feedback'
                    ].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`tab ${activeTab === tab ? "active" : ""}`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="tab-contents">
                    {renderTabContent()}
                  </div>
                </div>
              </div>
              {/* Tabs */}
              <HeaderNav />
              {/* Tab content */}

            </div>
          </div>
        </section>
      </main>
    </>
  );
}
