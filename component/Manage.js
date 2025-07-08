import { useState, useEffect } from "react";
import { db } from '../firebaseConfig';
import { collection, getDocs, deleteDoc, doc ,getDoc} from 'firebase/firestore';
import { format } from 'date-fns';
import { FaRegCopy } from "react-icons/fa6";
import { useRouter } from 'next/router';
import { CiEdit } from "react-icons/ci";
import { GrFormView } from "react-icons/gr";
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { updateDoc } from 'firebase/firestore';
import ExportFeedback from "../pages/admin/ExportFeedback";



const ManageEvents = () => {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState({});
const parseDate = (dateObj) => dateObj.toDate(); // Converts to JS Date


    const handleFileUpload = async (eventId, eventName, eventTime) => {
        if (!selectedFile) {
            alert("Please select a file!");
            return;
        }
    
        try {
            const storageRef = ref(storage, `eventFiles/${eventId}/${selectedFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, selectedFile);
    
            uploadTask.on(
                "state_changed",
                null,
                (error) => {
                    console.error("Upload failed:", error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    
                    // ✅ Fetch event details from Firestore
                    const eventRef = doc(db, "NTmeet", eventId);
                    const eventSnap = await getDoc(eventRef);
                    
                    if (!eventSnap.exists()) {
                        console.error("Event not found in Firestore!");
                        return;
                    }
                    
                    const eventData = eventSnap.data();
                    const headerMessage = eventData.headerMessage || "Meeting Summary";
                    const footerMessage = eventData.footerMessage || "Regards, Team UJustBe";
                    const recordingLink = eventData.recordingLink || "No recording link provided";
    
                    // ✅ Update Firestore with MoM URL
                    await updateDoc(eventRef, { momUrl: downloadURL });
    
                    // ✅ Update local state
                    setEvents(prevEvents =>
                        prevEvents.map(event =>
                            event.id === eventId ? { ...event, momUrl: downloadURL } : event
                        )
                    );
    
                    alert("File uploaded successfully!");
    
                    // ✅ Send MoM link to attendees
                    await sendMomMessage(eventId, eventName, eventTime, downloadURL, recordingLink, headerMessage, footerMessage);
                }
            );
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    };
    
    const sendMomMessage = async (eventId, eventName, eventTime, momUrl, recordingLink, headerMessage, footerMessage) => {
        try {
            console.log("Fetching all NTMembers...");
    
            const membersRef = collection(db, "NTMembers");
            const membersSnapshot = await getDocs(membersRef);
            const members = membersSnapshot.docs.map(doc => doc.data());
    
            if (members.length === 0) {
                console.log("No members found.");
                return;
            }
    
            console.log("Members found:", members);
    
            for (const member of members) {
                const phone = member.phoneNumber;
                const name = member.name || "NT Member"; // Fallback if name is missing
    
                if (!phone) continue; // Skip if no phone number
    
                console.log(`Sending message to ${name} (${phone})...`);
    
                const response = await fetch("https://graph.facebook.com/v21.0/527476310441806/messages", {
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: phone,
                        type: "template",
                        template: {
                            name: "dynamic_mom",  // Updated template name
                            language: { code: "en" },
                            components: [
                                {
                                    type: "body",
                                    parameters: [
                                        { type: "text", text: name },  // Member's name
                                        { type: "text", text: headerMessage },
                                        { type: "text", text: momUrl }, // MOM Link
                                        { type: "text", text: recordingLink }, // Recording Link
                                        { type: "text", text: footerMessage } // Footer Message
                                    ]
                                }
                            ]
                        }
                    })
                });
    
                const result = await response.json();
                console.log(`Response for ${phone}:`, result);
    
                if (result.error) {
                    console.error(`Error sending message to ${phone}:`, result.error);
                }
            }
        } catch (error) {
            console.error("Error sending MoM message:", error);
        }
    };
    

    // Fetch all events from the 'NTmeet' collection
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventCollection = collection(db, 'NTmeet');
                const eventSnapshot = await getDocs(eventCollection);
                const eventList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEvents(eventList);
            } catch (error) {
                console.error('Error fetching events:', error);
                setError('Error fetching events. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const handleViewUsers = (eventId) => {
        router.push(`/admin/event/RegisteredUser/${eventId}`);
    };

    const handleEditEvent = (eventId) => {
        router.push(`/admin/event/edit/${eventId}`); // Navigate to edit page
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            await deleteDoc(doc(db, 'NTmeet', eventId));
            setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
            alert('Event deleted successfully!');
        } catch (error) {
            console.error('Error deleting event:', error);
            setError('Error deleting event. Please try again.');
        }
    };

    const handleCopyEventLink = (eventId) => {
        const eventLink = `https://nt-meet-track.vercel.app/events/${eventId}`;
        navigator.clipboard.writeText(eventLink).then(() => {
            alert('Event link copied to clipboard!');
        }).catch(err => {
            console.error('Error copying event link:', err);
        });
    };

    const formatTime = (timestamp) => {
        if (timestamp && timestamp.seconds) {
            return format(new Date(timestamp.seconds * 1000), 'dd/MM/yyyy HH:mm');
        }
        return 'Invalid time';
    };

    return (
        <>
          {loading && <div className='loader'> <span className="loader2"></span> </div>}
            <section className='c-userslist box'>

              <ExportFeedback/>
                {/* <button className="m-button-5" onClick={() => window.history.back()}>
                    Back
                </button> */}
                <table className='table-class'>
                  
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    
                    {/* Event Table */}
                    <thead>
                        <tr>
                            <th>Sr no</th>
                            <th>Event Name</th>
                            <th>Time</th>
                            <th>Zoom Link</th>
                            <th>Copy Event Link</th> 
                           
                            <th>MoM Document</th>
                            <th>Actions</th> 
                        </tr>
                    </thead>
       <tbody>
  {events
    .sort((a, b) => {
      const parseDate = (dateObj) => dateObj.toDate(); // Firestore Timestamp to JS Date
      return parseDate(b.time) - parseDate(a.time); // latest first
    })
    .map((event, index) => (
      <tr key={event.id}>
        <td>{index + 1}</td>
        <td>{event.name}</td>
        <td>{formatTime(event.time)}</td>
        <td>
          <a href={event.zoomLink} target="_blank" rel="noreferrer">Join Meeting</a>
        </td>
        <td>
          <button 
            className="m-button-7" 
            onClick={() => handleCopyEventLink(event.id)} 
            style={{ marginLeft: '10px', backgroundColor: '#e2e2e2', color: 'black' }}>
            <FaRegCopy /> Copy
          </button>
        </td>
        <td>
  {event.momUrl ? (
    <>
      <a href={event.momUrl} target="_blank" rel="noopener noreferrer">View MOM</a>
      <br />
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          setSelectedFile(e.target.files[0]);
          setEditingEventId(event.id); // optional: track which event is being edited
        }}
      />
      {selectedFile  === event.id && (
        <div style={{ marginTop: '5px' }}>
          <p>Selected: {selectedFile.name}</p>
          <button
            className="m-button-7"
            onClick={() => handleFileUpload(event.id, event.name, event.time)}
            disabled={!selectedFile}
            style={{ marginTop: '5px', backgroundColor: '#f16f06', color: 'white' }}
          >
            Upload New MOM
          </button>
        </div>
      )}
    </>
  ) : (
    <>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setSelectedFile(e.target.files[0])}
      />
      {selectedFile && (
        <div style={{ marginTop: '5px' }}>
          <p>Selected: {selectedFile.name}</p>
        </div>
      )}
      <button
        className="m-button-7"
        onClick={() => handleFileUpload(event.id, event.name, event.time)}
        disabled={!selectedFile}
        style={{ marginLeft: '10px', backgroundColor: '#f16f06', color: 'white' }}
      >
        Upload MOM
      </button>
    </>
  )}
</td>

   
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
    <div className="twobtn">
        <button className="m-button-7" 
            onClick={() => handleViewUsers(event.id)} 
            style={{ marginLeft: '10px', backgroundColor: '#e2e2e2', color: 'black' }}>
            <GrFormView/> View
        </button>
        
        <button className="m-button-7" 
            onClick={() => handleDeleteEvent(event.id)} 
            style={{ marginLeft: '10px', backgroundColor: '#fe6f06', color: 'white' }}>
            🗑 Delete
        </button>
    </div>
</td>

                
        </tr>
    ))}
</tbody>

                </table>
            </section>
        </>
    );
};

export default ManageEvents;
