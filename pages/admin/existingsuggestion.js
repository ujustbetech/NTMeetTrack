import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import {
  collection,
  getDocs,
  updateDoc,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import "../../src/app/styles/main.scss";
import Layout from '../../component/Layout';


const CreateSuggestionTask = () => {
  const [selectedSuggestionId, setSelectedSuggestionId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [eventName, setEventName] = useState('');
  const [status, setStatus] = useState('Pending');
  const [ntMembers, setNtMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [userName, setUserName] = useState('');


  const selectedEvent = events.find(e => e.id === eventName);
  const selectedEventName = selectedEvent?.name || '';

  const fetchUserName = async (phoneNumber) => {
    if (!phoneNumber) return;
    const userRef = doc(db, 'NTMembers', phoneNumber);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserName(data.name);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const phone = localStorage.getItem('ntnumber');
      if (phone) {
        fetchUserName(phone);
      }

      const memberSnapshot = await getDocs(collection(db, 'NTMembers'));
      const members = memberSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNtMembers(members);

      const eventSnapshot = await getDocs(collection(db, 'NTmeet'));
      const eventList = eventSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().eventName || 'Unnamed Event',
      }));
      setEvents(eventList);

      const suggestionSnapshot = await getDocs(collection(db, 'suggestions'));
      const suggestionList = suggestionSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSuggestions(suggestionList);
    };

    fetchData();
  }, []);
const handleSuggestionChange = (e) => {
  const suggestionId = e.target.value;
  setSelectedSuggestionId(suggestionId);

  const selected = suggestions.find(s => s.id === suggestionId);
  if (selected?.eventId) {
    setEventName(selected.eventId); // Autofill event
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSuggestionId) {
      alert('Please select a suggestion to assign.');
      return;
    }

    try {
      const suggestionRef = doc(db, 'suggestions', selectedSuggestionId);

      await updateDoc(suggestionRef, {
        assignedTo,
        eventId: eventName,
        eventName: selectedEventName,
        status,
        date: serverTimestamp(),
      });

      alert('Suggestion updated and assigned successfully!');
      setSelectedSuggestionId('');
      setAssignedTo('');
      setEventName('');
      setStatus('Pending');
    } catch (err) {
      console.error('Error updating suggestion:', err);
    }
  };



  return (
    <Layout>
   
     <section className='c-form  box'>
          <h2>Assign Existing Suggestion</h2>
          <form  onSubmit={handleSubmit}>
              <ul>
          <li className='form-row'>
            <h4>Suggestions<sup>*</sup></h4>
            <div className='multipleitem'>
              
          <select
  value={selectedSuggestionId}
  onChange={handleSuggestionChange}
  required
>

             
              <option value="">Select Suggestion</option>
              {suggestions.map((sug) => (
                <option key={sug.id} value={sug.id}>
                  {sug.taskDescription}
                </option>
              ))}
            </select>
</div></li>
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
</div></li>
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
      
            <div className='multipleitem'>
              
            <button className='submitbtn' type="submit">Assign</button>
            </div>
            </li>
            </ul>
          </form>
        </section>
   
    </Layout>
  );
};

export default CreateSuggestionTask;
