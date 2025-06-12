import React from 'react';
import { useState, useEffect } from 'react';

function UserHeader() {
      const [cpPoints, setCPPoints] = useState(0);
      const [phoneNumber, setPhoneNumber] = useState('');
      const [userName, setUserName] = useState('');

      useEffect(() => {

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

  const getInitials = (name) => {
    return name
      .split(" ") // Split the name into words
      .map(word => word[0]) // Get the first letter of each word
      .join(""); // Join them together
  };
    return (
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
    );
}

export default UserHeader;