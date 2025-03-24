import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { db } from "../firebaseConfig";

import '/pages/events/event.css'; // Ensure your CSS file is correctly linked
import Layout from '../component/Layout';
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { set } from "date-fns";

const FeedbackList = () => {
  const router = useRouter();
  const [feedbackList, setFeedbackList] = useState([]);
  const [singleFeedback, setsingleFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);
  const [userName, setUserName] = useState('');
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [showpopup, setshowpopup] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(""); // Default empty filter

 
  const filterTab = ["All", "Not Available", "Available"];

  const handleClick = (index, filter) => {
    setActiveIndex(index);
    setSelectedFilter(filter);
  };
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
                 predefined: feedbackEntry.predefined || "N/A", // Store predefined field
                 date: formattedDate,
                 status: feedbackEntry.status || "Yet to be Discussed",
               });
             });
           }
         }
       }
 
       setFeedbackList(allFeedback);
       setFilteredFeedback(allFeedback); // Initially show all feedback
     } catch (error) {
       console.error("Error fetching feedback:", error);
     } finally {
       setLoading(false);
     }
   };
 
   useEffect(() => {
     fetchFeedback();
   }, []);
 
   useEffect(() => {
     if (selectedFilter === "All" || !selectedFilter) {
       setFilteredFeedback(feedbackList);
     } else {
       setFilteredFeedback(feedbackList.filter((item) => item.predefined === selectedFilter));
     }
   }, [selectedFilter, feedbackList]);

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
 

  const getInitials = (name) => {
    return name
      .split(" ") // Split the name into words
      .map(word => word[0]) // Get the first letter of each word
      .join(""); // Join them together
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
      // setPhoneNumber(mobileNumber);
      // registerUserForEvent(phoneNumber, orbitername);
    }

    else {
      console.log("user not found");

      // setError('User not found.');
    }
  };


  useEffect(() => {
    const storedPhoneNumber = localStorage.getItem('ntnumber');
    fetchUserName(storedPhoneNumber);
    // setPhoneNumber(storedPhoneNumber)
    fetchFeedback();
  }, []);




  return (

    <>
      <main className="pageContainer">
        <header className='Main m-Header'>
          <section className='container'>
            <div className='innerLogo'>
              <img src="/ujustlogo.png" alt="Logo" className="logo" />
            </div>
            <div>
              <div className='userName'> {userName || 'User'} <span>{getInitials(userName)}</span> </div>
            </div>
          </section>
        </header>
        <section className='dashBoardMain'>
          <div className='container pageHeading'>
            <h1>Suggestion / Feedback</h1>
            {/* <p>Lets Create Brand Ambasaddor through Contribution</p> */}
          </div>

          <div className='container filterTab'>
            <h4>Filter</h4>
            <ul>
              {filterTab.map((item, index) => (
                <li
                  key={index}
                  className={`navItem ${activeIndex === index ? "active" : ''}`}
                  onClick={() => handleClick(index, item)}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {loading ? (
            <div className='loader'><span className="loader2"></span></div>
          ) : (
            <div className='container suggestionList'>
              {filteredFeedback.map((feedback, index) => (
                <div key={index} className='suggestionBox'>
                  <div className="suggestionDetails">
                    <span className='meetingLable'>{feedback.status}</span>
                    <span className='suggestionTime'>{feedback.date}</span>
                  </div>
                  <div className="boxHeading">
                    <span>{feedback.userName.charAt(0)}</span>
                    <div className="suggestions">
                      <h4>{feedback.eventName}</h4>
                      <p>{feedback.suggestion}</p>
                    </div>
                  </div>
                  <div className="viewPlus" onClick={() => setshowpopup(true)}> View Details + </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <button className="suggestion-btn" onClick={() => router.push('/')}>
        Go to Home
      </button>

      {showpopup && (
        <section className="PopupMain">
          <div className="popupBox">
            <div>
              <span className='meetingLable'>{filteredFeedback[activeIndex]?.status}</span>
            </div>
            <div>
              <h4>Event Name</h4>
              <p>{filteredFeedback[activeIndex]?.eventName}</p>
            </div>
            <div>
              <h4>Event Date</h4>
              <p>{filteredFeedback[activeIndex]?.date}</p>
            </div>
            <div>
              <h4>User Name</h4>
              <p>{filteredFeedback[activeIndex]?.userName}</p>
            </div>
            <div>
              <h4>Feedback</h4>
              <p>{filteredFeedback[activeIndex]?.suggestion}</p>
            </div>
            <button className="closeBtn" onClick={() => setshowpopup(false)}>X</button>
          </div>
        </section>
      )}
    </>

  );
};

export default FeedbackList;
