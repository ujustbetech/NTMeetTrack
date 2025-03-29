import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Adjust if needed
import '/pages/events/event.css';

const CPDetails = () => {
  const router = useRouter();
  const { phoneNumber } = router.query; // Get phone number from URL

  const [userName, setUserName] = useState("");
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    if (!phoneNumber) return;

    const fetchUserDetails = async () => {
      try {
        const userRef = doc(db, "NTMembers", phoneNumber);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserName(userSnap.data().name || "User"); // Default to "User" if name is missing
        } else {
          console.log("User not found");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    const fetchCPDetails = async () => {
        try {
          const activitiesRef = collection(db, "NTMembers", phoneNumber, "activities");
          const activitiesSnapshot = await getDocs(activitiesRef);
      
          const activitiesList = activitiesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
      
          console.log("Fetched activities:", activitiesList); // ✅ Log activities to console
      
          setActivities(activitiesList);
          setFilteredActivities(activitiesList);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching activities:", error);
        }
      };
      

    fetchUserDetails();
    fetchCPDetails();
  }, [phoneNumber]);

  const activityTypes = ["All", ...new Set(activities.map(activity => activity.activityType))];

  const handleFilterClick = (type) => {
    setActiveFilter(type);
    if (type === "All") {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter(activity => activity.activityType === type));
    }
  };

  if (loading) {
    return  <div className='loader'><span className="loader2"></span></div>;
  }

  return (
    <>
      <main className="pageContainer">
        <header className="Main m-Header">
          <section className="container">
            <div className="innerLogo" onClick={() => router.push("/")}>
              <img src="/ujustlogo.png" alt="Logo" className="logo" />
            </div>
          </section>
        </header>

        <section className="dashBoardMain">
          <div className="container pageHeading">
            <h1>{userName}'s CP List</h1>
          </div>

          <div className="container filterTab">
            <h4>Filter by Activity Type</h4>
            <ul>
              {activityTypes.map((type, index) => (
                <li
                  key={index}
                  className={`navItem ${activeFilter === type ? "active" : ""}`}
                  onClick={() => handleFilterClick(type)}
                >
                  {type}
                </li>
              ))}
            </ul>
          </div>

          {filteredActivities.length === 0 ? (
            <p>No activities found.</p>
          ) : (
            <div className="container suggestionList">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="suggestionBox">
                  <div className="suggestionDetails">
                    <span className="meetingLable2">CP Points: {activity.points}</span>
                    <span className="suggestionTime">{activity.month}</span>
                  </div>
                  <div className="suggestions">
                    <h4>{activity.activityType}</h4>
                    <p>{activity.activityDescription}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="suggestion-btn" onClick={() => router.push('/')}>
            Go to Home
          </button>
        </section>
      </main>
    </>
  );
};

export default CPDetails;
