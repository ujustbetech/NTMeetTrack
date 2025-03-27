import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../firebaseConfig';
import Link from 'next/link'
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import axios from 'axios';
// import "../src/app/styles/main.scss";
import '/pages/events/event.css'; // Ensure your CSS file is correctly linked
import { IoMdClose } from "react-icons/io";

const HomePage = () => {
  const router = useRouter();
  const { id } = router.query; // Get event name from URL
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState(''); // State to store user name
  const [error, setError] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [registerUsersList, setregisterUsersList] = useState(null);

  const [eventList, setEventList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false); // State to show/hide modal



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

    try {
      const response = await axios.post('https://api.ujustbe.com/mobile-check', {
        MobileNo: phoneNumber,
      });

      if (response.data.message[0].type === 'SUCCESS') {
        console.log('✅ Phone number verified:', response.data);

        // ✅ Store the phone number as 'ntnumber' in localStorage
        localStorage.setItem('ntnumber', phoneNumber);

        setIsLoggedIn(true);
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
    console.log("Fetch User from NTMember", phoneNumber);
    const userRef = doc(db, 'NTMember', phoneNumber);
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
            <div></div>
          </section>
        </header>

        <section className='dashBoardMain'>
          <div className='container pageHeading'>
            <h1>Hi {userName || 'User'}</h1>
            <p>Lets Create Brand Ambasaddor through Contribution</p>
          </div>
          
          <div className='container eventList'>
            {eventList ? eventList?.map(doc => (
              <div key={doc.id} className='meetingBox'>
                {doc.momUrl ? <span className='meetingLable2'>Done</span> : <span className='meetingLable'>Current Meeting</span>
                }

                <div className='meetingDetails'>
                  <h3 className="eventName">{doc ? doc.name : 'Users not found'}</h3>
          
                </div>
                <div className='meetingBoxFooter'>
                {registerUsersList ?
                  <ul>
                    {registerUsersList ? registerUsersList?.map(doc => (
                      <li key={doc.id}>
                        <strong>{getInitials(doc.name)}</strong>
                        {/* <strong>ID:</strong> {doc.name} <br /> */}
                      </li>
                    )) : <div className='loader'><span className="loader2"></span></div>

                    }

                  </ul>: null
}

                  <div className='viewDetails'>
                    <Link href={`events/${doc.uniqueId}`}>View Details</Link>
                    {/* <a href=''>View Details</a> */}
                  </div>
                  {
                    doc.momUrl ? <div className="momLink">
                      <a href={doc.momUrl} target="_blank" rel="noopener noreferrer">
                        {/* <img src="/zoom-icon.png" alt="Zoom Link" width={30} /> */}
                        <span>MOM</span>
                      </a>
                    </div> : <div className="meetingLink">
                      <a href={doc?.zoomLink} target="_blank" rel="noopener noreferrer">
                        {/* <img src="/zoom-icon.png" alt="Zoom Link" width={30} /> */}
                        <span>Join Meeting</span>
                      </a>
                    </div>
                  }

                </div>

              </div>

            )) : <div className='loader'><span className="loader2"></span></div>

            }

           

            <div>
      {loading ? (
       
       <div className='loader'><span className="loader2"></span></div>
        
       
      ) : (
    
         <button
              className="suggestion-btn"
              onClick={() => router.push('/suggestion')}
            >
              View Suggestion
            </button>

      
      )}
    </div>

          </div>

        </section>
      </main>

    </>
  );

};

export default HomePage;
