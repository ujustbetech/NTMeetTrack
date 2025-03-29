import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import Layout from "../../component/Layout";
import "../../src/app/styles/main.scss";

export default function CPPointsSummary() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembersWithPoints = async () => {
      const querySnapshot = await getDocs(collection(db, "NTMembers"));
      const membersData = [];

      for (const docSnap of querySnapshot.docs) {
        const member = { id: docSnap.id, ...docSnap.data(), totalPoints: 0 };

        // Fetch activities subcollection
        const activitiesSnapshot = await getDocs(collection(db, "NTMembers", docSnap.id, "activities"));

        let totalPoints = 0;
        activitiesSnapshot.forEach(activityDoc => {
          const activity = activityDoc.data();
          totalPoints += parseInt(activity.points) || 0; // Convert points to integer and sum
        });

        member.totalPoints = totalPoints;
        membersData.push(member);
      }

      setMembers(membersData);
      setLoading(false);
    };

    fetchMembersWithPoints();
  }, []);

  if (loading) return    <div className='loader'><span className="loader2"></span></div>;

  return (
    <Layout>
      <section className="c-userslist box">
        <h2>CP Board</h2>
  
       
        <table className="table-class">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Total CP Points</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.phoneNumber}</td>
                <td>{member.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Layout>
  );
  
}
