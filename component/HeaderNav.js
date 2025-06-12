import React from 'react';
import { FiHome } from "react-icons/fi";
import { TbBulb } from "react-icons/tb";
import { MdOutlineBusinessCenter } from "react-icons/md";
import { BiSolidCoinStack } from "react-icons/bi";
import { GrBraille } from "react-icons/gr";
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useRouter } from 'next/router';
import Link from 'next/link'

function HeaderNav() {
    const router = useRouter();
      const [phoneNumber, setPhoneNumber] = useState('');
        const [isLoggedIn, setIsLoggedIn] = useState(false);
        const [value, setValue] = React.useState(0);
          const [error, setError] = useState(null);
          const [userName, setUserName] = useState('');
       
          const [cpPoints, setCPPoints] = useState(0);
          const [eventList, setEventList] = useState(null);
          const [loading, setLoading] = useState(true);
       
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
      
      
      
      
    return (
      <div className="sticky-buttons-container">
  <div className="icon-wrapper" onClick={() => router.push("/")}>
    <FiHome size={26} />
    <span className="icon-label">Home</span>
  </div>
  
  <div className="icon-wrapper" onClick={() => router.push("/NTmeetdetails")}>
    <GrBraille size={26} />
    <span className="icon-label">NT</span>
  </div>
  
  <div className="icon-wrapper" onClick={() => router.push("/Monthlymeetdetails")}>
    <MdOutlineBusinessCenter size={26} />
    <span className="icon-label">MM</span>
  </div>
  
  <div className="icon-wrapper" onClick={() => router.push("/SuggestionList")}>
    <TbBulb size={26} />
    <span className="icon-label">Suggestions</span>
  </div>
  
  <div className="icon-wrapper" onClick={() => router.push(`/cp-details/${phoneNumber}`)}>
    <BiSolidCoinStack size={26} />
    <span className="icon-label">CP</span>
  </div>
</div>

    );
}

export default HeaderNav;