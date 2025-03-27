import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig"; // Ensure Firestore is configured
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
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
  
    // Reference to the 'activities' subcollection inside the selected NTMember document
    const userRef = doc(db, "NTMembers", phoneNumber, "activities", activityType);
  
    await setDoc(userRef, {
      month: new Date().toLocaleString("default", { month: "short", year: "numeric" }),
      activityNo,
      activityType,
      points,
      activityDescription,
      name: ntMembers.find(m => m.id === selectedMember)?.name || "",
      phoneNumber
    }, { merge: true });
  
    alert("Activity added successfully!");
    setActivityType("");
    setActivityNo("");
    setPoints("");
    setActivityDescription("");
  };
  
  return (
    <Layout>
    <div>
      <h2>Add Activity</h2>
      <form onSubmit={handleSubmit}>
        <label>NT Member:</label>
        <select onChange={handleMemberChange} value={selectedMember}>
          <option value="">Select Member</option>
          {ntMembers.map(member => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
        <br />

        <label>Phone Number:</label>
        <input type="text" value={phoneNumber} readOnly />
        <br />

        <label>Activity Type:</label>
        <select onChange={handleActivityTypeChange} value={activityType}>
          <option value="">Select Activity</option>
          {Object.keys(activityTypes).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <br />

        <label>Activity No:</label>
        <input type="text" value={activityNo} readOnly />
        <br />

        <label>CP Points:</label>
        <input type="text" value={points} readOnly />
        <br />

        <label>Activity Description:</label>
        <input type="text" value={activityDescription} onChange={(e) => setActivityDescription(e.target.value)} />
        <br />

        <button type="submit">Add Activity</button>
      </form>
    </div>
    </Layout>
  );
}
