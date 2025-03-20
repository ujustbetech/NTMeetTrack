import { useState } from 'react';
import { db } from '../firebaseConfig'; 
import { collection, doc, setDoc, Timestamp,getDocs } from 'firebase/firestore';
import { useRouter } from 'next/router';


const CreateEvent = () => {
  const [eventName, setEventName] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [agendaPoints, setAgendaPoints] = useState(['']); // Array to handle multiple agenda points
  const [zoomLink, setZoomLink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const router = useRouter();

  const handleAddAgendaPoint = () => {
    setAgendaPoints([...agendaPoints, '']); // Add a new empty agenda point
  };

  const handleRemoveAgendaPoint = (index) => {
    const updatedPoints = agendaPoints.filter((_, i) => i !== index);
    setAgendaPoints(updatedPoints); // Remove the selected agenda point
  };

  const handleAgendaChange = (index, value) => {
    const updatedPoints = [...agendaPoints];
    updatedPoints[index] = value; // Update the specific agenda point
    setAgendaPoints(updatedPoints);
  };
  const sendWhatsAppMessage = async (userName, eventName, eventDate, eventLink, phoneNumber) => {
    const ACCESS_TOKEN = 'EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD'; // Replace with your Meta API token
    const PHONE_NUMBER_ID = '527476310441806'; // Replace with your Meta Phone Number ID
    const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
  
    const messageData = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: 'registration_link', // Your approved template name
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: userName },
              { type: 'text', text: eventName },
              { type: 'text', text: eventDate },
              { type: 'text', text: eventLink }
            ]
          }
        ]
      }
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
  
      const data = await response.json();
      console.log('WhatsApp Message Sent:', data);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  };
  

  const handleCreateEvent = async (e) => {
    e.preventDefault();
  
    setLoading(true);
    setError('');
    setSuccess('');
  
    if (!eventName || !eventTime || !zoomLink || agendaPoints.some(point => point === '')) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
  
    try {
      const monthlyMeetRef = collection(db, 'NTmeet');
      const uniqueId = doc(monthlyMeetRef).id;
      const eventDocRef = doc(monthlyMeetRef, uniqueId);
  
      const eventData = {
        name: eventName,
        time: Timestamp.fromDate(new Date(eventTime)),
        agenda: agendaPoints,
        zoomLink: zoomLink,
        uniqueId: uniqueId,
      };
  
      // Save event in NTmeet
      await setDoc(eventDocRef, eventData);
  // Fetch all NTmember users
const membersCollectionRef = collection(db, 'NTMembers');
const membersSnapshot = await getDocs(membersCollectionRef);

const promises = [];

membersSnapshot.forEach((doc) => {
  const userData = doc.data();
  const phoneNumber = userData.phoneNumber; // ✅ Fix: Use phoneNumber

  if (phoneNumber) {
    const eventLink = `https://uspacex-nyjb3xhto-soniujustbes-projects.vercel.app/events/${uniqueId}`;
    promises.push(sendWhatsAppMessage(userData.name, eventName, eventTime, eventLink, phoneNumber));
    
  }
});

// Run all WhatsApp API calls
await Promise.all(promises);

  
   
      setSuccess('Event created successfully and WhatsApp messages sent!');
      setEventName('');
      setEventTime('');
      setAgendaPoints(['']);
      setZoomLink('');
      setError('');
      setLoading(false);
  
      return router.push(`/events/${uniqueId}`);
    } catch (error) {
      console.error(error);
      setError('Error creating event. Please try again.');
      setLoading(false);
    }
  };
  
  return (
   <>
    <section className='c-form  box'>
      <h2>Create New Event</h2>
    
         
      <form onSubmit={handleCreateEvent}>
        <ul>
          <li className='form-row'>
            <h4>Event Name<sup>*</sup></h4>
            <div className='multipleitem'>
              
              <input
                type="text"
                placeholder="Event Name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </div>
          </li>
          <li className='form-row'>
            <h4>Date<sup>*</sup></h4>
            <div className='multipleitem'>
              <input
                type="datetime-local"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                required
              />
            </div>
          </li>

          <li className='form-row'>
            <h4>Agenda<sup>*</sup></h4>
            <div className='multipleitem'>
              {/* Dynamic agenda input fields */}
              {agendaPoints.map((point, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <textarea
                    value={point}
                    onChange={(e) => handleAgendaChange(index, e.target.value)}
                    placeholder={`Agenda Point ${index + 1}`}
                    required
                    rows={3} 
                    style={{ width: '300px', marginRight: '10px' }}
                  />
                  {agendaPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAgendaPoint(index)}
                      style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </li>

          <li className='form-row'>
            <h4>Zoom link</h4>
            <div className='multipleitem'>
              <input
                type="text"
                placeholder="Zoom Link"
                value={zoomLink}
                onChange={(e) => setZoomLink(e.target.value)}
                required
              />
            </div>
          </li>

          <li className='form-row'>
            <div>
              <button className='submitbtn' type='submit' disabled={loading}>
                Submit
              </button>
            </div>    
          </li>
        </ul>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      
      {/* Loader while submitting */}
      {loading && (
        <div className='loader'> <span className="loader2"></span> </div>
      )}
    </section>
    </>
  );
};

export default CreateEvent;
