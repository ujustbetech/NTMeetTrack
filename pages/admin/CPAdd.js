import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig"; // Ensure Firestore is configured
import { collection, getDocs, doc,addDoc } from "firebase/firestore";
import Layout from "../../component/Layout";
import "../../src/app/styles/main.scss";

const activityTypes = {
  "Event Host (Offline)": { activityNo: "D005", points: 50 },
  "Event Segment Delivery (Offline)": { activityNo: "D006", points: 50 },
  "Event Segment Delivery (Online)": { activityNo: "D003", points: 25 },
  "Content (Video format) online": { activityNo: "C004", points: 10 },
  "Content (Video format) offline": { activityNo: "C005", points: 25 },
  "Event Support (Online)": { activityNo: "D004", points: 10 },
  "Content (Draft format) for Event": { activityNo: "C001", points: 25 }
};

export default function AddActivity() {
  const [ntMembers, setNtMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [activityType, setActivityType] = useState("");
  const [activityNo, setActivityNo] = useState("");
  const [points, setPoints] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      const querySnapshot = await getDocs(collection(db, "NTMembers"));
      const members = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNtMembers(members);
    };
    fetchMembers();
  }, []);

  const handleMemberChange = (e) => {
    const member = ntMembers.find(m => m.id === e.target.value);
    setSelectedMember(member?.id || "");
    setPhoneNumber(member?.phoneNumber || "");
  };

  const handleActivityTypeChange = (e) => {
    const selectedType = e.target.value;
    setActivityType(selectedType);
    
    // Auto-fill Activity No & Points
    const { activityNo, points } = activityTypes[selectedType] || {};
    setActivityNo(activityNo || "");
    setPoints(points || "");
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!selectedMember || !activityType || !activityDescription) {
    return alert("Please fill all fields");
  }

  const { activityNo, points } = activityTypes[activityType] || {};

  const activitiesRef = collection(db, "NTMembers", phoneNumber, "activities");

  await addDoc(activitiesRef, {
    month: new Date().toLocaleString("default", { month: "short", year: "numeric" }),
    activityNo,
    activityType,
    points,
    activityDescription,
    name: ntMembers.find(m => m.id === selectedMember)?.name || "",
    phoneNumber
  });

  alert("Activity added successfully!");
  setActivityType("");
  setActivityNo("");
  setPoints("");
  setActivityDescription("");
};

  return (
    <Layout>
      <section className="c-form box">
        <h2>Create New Event</h2>
        <h2>Add Activity</h2>
        <form onSubmit={handleSubmit}>
          <ul>
            <li className="form-row">
              <h4>Select Member<sup>*</sup></h4>
              <div className="multipleitem">
                <select onChange={handleMemberChange} value={selectedMember}>
                  <option value="">Select Member</option>
                  {ntMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </li>
  
            <li className="form-row">
              <h4>Phone Number<sup>*</sup></h4>
              <div className="multipleitem">
                <input type="text" value={phoneNumber} readOnly />
              </div>
            </li>
  
            <li className="form-row">
              <h4>Select Activity<sup>*</sup></h4>
              <div className="multipleitem">
                <select onChange={handleActivityTypeChange} value={activityType}>
                  <option value="">Select Activity</option>
                  {Object.keys(activityTypes).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </li>
  
            <li className="form-row">
              <h4>Activity No<sup>*</sup></h4>
              <div className="multipleitem">
                <input type="text" value={activityNo} readOnly />
              </div>
            </li>
  
            <li className="form-row">
              <h4>Points<sup>*</sup></h4>
              <div className="multipleitem">
                <input type="text" value={points} readOnly />
              </div>
            </li>
  
            <li className="form-row">
              <h4>Activity Description<sup>*</sup></h4>
              <div className="multipleitem">
                <input
                  type="text"
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                />
              </div>
            </li>
            <li className='form-row'>
            <div>
              <button className='submitbtn' type='submit' >
              Add Activity
              </button>
            </div>    
          </li>
         
          </ul>
        </form>
      </section>
    </Layout>
  );
}  
