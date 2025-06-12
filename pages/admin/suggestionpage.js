import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import "../../src/app/styles/main.scss";
import Layout from '../../component/Layout';
// import './CreateSuggestionTask.scss'; // SCSS file

const CreateSuggestionTask = () => {
  const [taskDescription, setTaskDescription] = useState('');
  const [date, setDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [eventName, setEventName] = useState('');
  const [ntMembers, setNtMembers] = useState([]);
   const [userName, setUserName] = useState('');
  const [events, setEvents] = useState([]);
  const [createdBy, setCreatedBy] = useState('');
const selectedEvent = events.find(e => e.id === eventName);
const selectedEventName = selectedEvent?.name || '';
const [status, setStatus] = useState('Pending');

const fetchUserName = async (phoneNumber) => {
    console.log("Fetch User from NTMember", phoneNumber);
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
    const fetchNTMembers = async () => {
      const querySnapshot = await getDocs(collection(db, 'NTMembers'));
      const members = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNtMembers(members);
    };

const fetchEvents = async () => {
  const querySnapshot = await getDocs(collection(db, 'NTmeet'));
  const eventList = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,               // Firestore document ID
      name: data.name || data.eventName || 'Unnamed Event',  // Preferably 'name'
    };
  });
  setEvents(eventList);
};


    const phone = localStorage.getItem('ntnumber');
    if (phone) {
      fetchUserName(phone);
    }

    fetchNTMembers();
    fetchEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
     await addDoc(collection(db, 'suggestions'), {
  taskDescription,
  date: new Date(date),
  status,
  assignedTo,
  eventId: eventName,
  eventName: selectedEventName,
  createdBy,
  createdAt: serverTimestamp(),
});


      alert('Suggestion task created successfully!');
      setTaskDescription('');
      setDate('');
      setAssignedTo('');
      setEventName('');
    } catch (err) {
      console.error('Error creating suggestion task:', err);
    }
  };
const getInitials = (name) => {
    return name
      .split(" ") // Split the name into words
      .map(word => word[0]) // Get the first letter of each word
      .join(""); // Join them together
  };
  useEffect(() => {
    const storedPhoneNumber = localStorage.getItem('ntnumber');
    fetchUserName(storedPhoneNumber);
    // setPhoneNumber(storedPhoneNumber)
   
  }, []);
  return (
    <Layout>
    <section className='c-form  box'>
      <h2>Create Suggestion Task</h2>
      <form  onSubmit={handleSubmit}>
              <ul>
          <li className='form-row'>
            <h4>Suggestion<sup>*</sup></h4>
            <div className='multipleitem'>
              
        <textarea
          placeholder="Task Description"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          required
        />
</div></li>
     
          <li className='form-row'>
            <h4>Date<sup>*</sup></h4>
            <div className='multipleitem'>
              
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        </div>
        </li>
        
          <li className='form-row'>
            <h4>Status<sup>*</sup></h4>
            <div className='multipleitem'>
              
<select
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  required
>
  <option value="Pending">Pending</option>
  <option value="In Progress">In Progress</option>
  <option value="Completed">Completed</option>
</select>
</div>
</li>
     <li className='form-row'>
            <h4>Suggested by<sup>*</sup></h4>
            <div className='multipleitem'>
              
        <select
          value={createdBy}
          onChange={(e) => setCreatedBy(e.target.value)}
          required
        >
          <option value="">Suggested By</option>
          {ntMembers.map((member) => (
           <option key={member.id} value={member.name}>
  {member.name}
</option>

          ))}
        </select>
</div>
</li>

          <li className='form-row'>
            <h4>Assign<sup>*</sup></h4>
            <div className='multipleitem'>
              
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          required
        >
          <option value="">Assign to NT Member</option>
          {ntMembers.map((member) => (
           <option key={member.id} value={member.name}>
  {member.name}
</option>

          ))}
        </select>
</div>
</li>

          <li className='form-row'>
            <h4>Event Name<sup>*</sup></h4>
            <div className='multipleitem'>
              
  <select
  value={eventName}
  onChange={(e) => setEventName(e.target.value)}
  required
>
  <option value="">Select Event</option>
  {events.map((event) => (
    <option key={event.id} value={event.id}>
      {event.name}
    </option>
  ))}
</select>

</div>
</li>

          <li className='form-row'>
            
            <div className='multipleitem'>
              

        <button className='submitbtn' type="submit">Create</button>
        </div>
        </li></ul>
      </form>
   </section>
  </Layout>
  );
};

export default CreateSuggestionTask;
