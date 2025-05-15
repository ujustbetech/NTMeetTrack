import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import '../../src/app/styles/main.scss';
import '/pages/events/frontend.scss';
import '/pages/events/event.scss';
import { app } from '../../firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';

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
            const userDoc = await getDoc(doc(db, 'userdetails', phone));
            const name = userDoc.exists() ? userDoc.data()[" Name"] : 'Unknown';

            return {
              phone,
              name,
              attendance: regUserData.attendanceStatus === true ? 'Yes' : 'No',
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
    const userRef = doc(db, 'NTMember', phoneNumber);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      setUserName(userDoc.data().name);
    }
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
            <p>Yet to be uploaded</p>
          )}
        </>
      );

    case 'knowledge':
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
            <p>Yet to be uploaded</p>
          )}
        </>
      );

    case 'prospects':
      return (
        <>
          <h3>Prospects Identified</h3>
          {eventInfo.prospectSections?.length > 0 ? (
            eventInfo.prospectSections.map((p, idx) => (
              <div key={idx}>
                <strong>{p.prospect}</strong> ({p.prospectName}):
                <p>{p.prospectDescription}</p>
              </div>
            ))
          ) : (
            <p>Yet to be uploaded</p>
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
              </div>
            ))
          ) : (
            <p>Yet to be uploaded</p>
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
            <p>Yet to be uploaded</p>
          )}
        </>
      );

    case 'e2a':
      return (
        <>
          <h3>E2A</h3>
          {eventInfo.e2aSections?.length > 0 ? (
            eventInfo.e2aSections.map((e2a, idx) => {
              const formattedDate = new Date(e2a.e2aDate).toLocaleDateString('en-GB');
              return (
                <div key={idx}>
                  <p><strong>Name:</strong> {e2a.e2a}</p>
                  <p><strong>Date:</strong> {formattedDate}</p>
                  <p><strong>Description:</strong> {e2a.e2aDesc}</p>
                </div>
              );
            })
          ) : (
            <p>Yet to be uploaded</p>
          )}
        </>
      );

    case '121':
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
            <p>Yet to be uploaded</p>
          )}
        </>
      );

    case 'users':
      return (
        <>
          <h3>Registered Users</h3>
          {users?.length > 0 ? (
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
                    <td>{user.attendance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Yet to be uploaded</p>
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
        <header className='Mains m-Headers'>
          <section className='container'>
            <div className='innerLogo' onClick={() => router.push('/')}>
              <img src="/ujustlogo.png" alt="Logo" className="logo" />
            </div>
            <div>
              <div className='userName'> {userName || 'User'} <span>{getInitials(userName)}</span> </div>
            </div>
          </section>
        </header>
        <section className='dashBoardMains'>
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
                        <div className="labels">HOURS MINUTES SECONDS</div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="countdown">
                    <div className="meeting-done">Meeting Done</div>
                  </div>
                )}


              </div>

              {/* Event info */}
              <div className="event-content">
                <div className='sectionHeading'>
                  <h2 className="event-title">{eventInfo?.Eventname || 'Event Details'}</h2>


                  {/* <p className="organizer">Organized by Malia Steav</p> */}
                  <p className="event-date">
                    {eventInfo?.time ? new Date(eventInfo.time.seconds * 1000).toLocaleString() : 'Event'}
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
                      <span>{users.length}</span> people are joining
                    </div>


                    <div className="see-all" onClick={() => setActiveTab("users")}>
                      See all
                    </div>
                  </div>
                </div>
                <div className='eventinnerContent'>
                  <div className="tabs">
                    {[
                      'agenda', 'MoM', 'facilitators', 'knowledge',
                      'prospects', 'referrals', 'requirements', 'e2a', '121', 'users'
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

<div className="sticky-buttons-container">
    <button className="sticky-btn" onClick={() => router.push('/suggestion')}>
     More Suggestions
    </button>
    <button className="suggestion-btn" onClick={() => router.push('/Monthlymeetdetails')}>
Go to Home Page
    </button>
  </div>
              {/* Tab content */}

            </div>
          </div>
        </section>
      </main>
    </>
  );
}
