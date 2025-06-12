import React, { useEffect, useState,useRef } from 'react';
import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  addDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import Link from 'next/link'
//import '/pages/events/event.scss';
import '../src/app/styles/user.scss';
import HeaderNav from '../component/HeaderNav';
import { FaFilter } from "react-icons/fa";
import Swal from 'sweetalert2';
// import './SuggestionList.scss';
import { BiComment } from "react-icons/bi";

const SuggestionList = () => {

  const [userName, setUserName] = useState('');

  const [commentTexts, setCommentTexts] = useState({}); // store comment text per suggestion
const [isModalOpen, setIsModalOpen] = useState(false);
const [activeSuggestionId, setActiveSuggestionId] = useState(null);
const [showFilter, setShowFilter] = useState(false);
const [suggestions, setSuggestions] = useState([]);
const [filteredFeedback, setFilteredFeedback] = useState([]);
const [selectedFilter, setSelectedFilter] = useState("All");
const [activeIndex, setActiveIndex] = useState(0);
const [loading, setLoading] = useState(true);
 const filterRef = useRef(null);
const fetchSuggestions = async () => {
  setLoading(true);
  try {
    const querySnapshot = await getDocs(collection(db, 'suggestions'));
    const suggestionList = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const suggestionData = {
          id: docSnap.id,
          ...docSnap.data(),
          date: docSnap.data().date?.toDate()?.toLocaleDateString() || "",
        };

        const commentsSnapshot = await getDocs(
          query(
            collection(db, 'suggestions', docSnap.id, 'comments'),
            orderBy('createdAt', 'asc')
          )
        );
        suggestionData.comments = commentsSnapshot.docs.map((commentDoc) => ({
          id: commentDoc.id,
          ...commentDoc.data(),
        }));

        return suggestionData;
      })
    );

    // Sort latest suggestions on top
    suggestionList.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

    setSuggestions(suggestionList);

    // Filtering logic if any
    if (selectedFilter === "All") {
      setFilteredFeedback(suggestionList);
    } else {
      const filtered = suggestionList.filter(
        (item) => item.status === selectedFilter
      );
      setFilteredFeedback(filtered);
    }
  } catch (error) {
    console.error("Error fetching suggestions:", error);
  } finally {
    setLoading(false);
  }
};


const handleClick = (index, filter) => {
  setActiveIndex(index);
  setSelectedFilter(filter);

  if (filter === "All") {
    setFilteredFeedback(suggestions);
  } else {
    const filtered = suggestions.filter(item => item.status === filter);
    setFilteredFeedback(filtered);
  }
};


  // Close when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    };

    if (showFilter) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showFilter]);


  const openModal = (suggestionId) => {
  setActiveSuggestionId(suggestionId);
  setIsModalOpen(true);
};

const closeModal = () => {
  setIsModalOpen(false);
  setActiveSuggestionId(null);
};

const handleCommentChange = (e) => {
  const value = e.target.value;
  setCommentTexts((prev) => ({
    ...prev,
    [activeSuggestionId]: value,
  }));
};
 

const handleModalSubmit = () => {
  if (activeSuggestionId) {
    addComment(activeSuggestionId);
    closeModal();
  }
};


  // Fetch current user name from NTMembers using phone number from localStorage
const fetchUserName = async (phoneNumber) => {
  const userRef = doc(db, 'NTMembers', phoneNumber);
  const userDoc = await getDoc(userRef);  // <-- getDoc here, not getDocs
  if (userDoc.exists()) {
    setUserName(userDoc.data().name);
  } else {
    console.error('User not found in NTMembers');
  }
};
 
  const filterTab = ["All",   "Acknowledged", "In Progress",
    "Accepted",
    "Declined",
    "UJustBe Queue",
    "NT Queue",
    "Approved","Pending"];

 

 useEffect(() => {
  const phone = localStorage.getItem('ntnumber');
  if (phone) fetchUserName(phone);
  fetchSuggestions();
}, []);

const handleLogout = () => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'You will be logged out.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Logout',
    cancelButtonText: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('ntnumber');
      window.location.reload(); // or navigate to login
    }
  });
};
  const handleStatusChange = async (id, newStatus) => {
    const suggestionRef = doc(db, 'suggestions', id);
    await updateDoc(suggestionRef, { status: newStatus });
    fetchSuggestions();
  };

 

  const addComment = async (suggestionId) => {
    const text = commentTexts[suggestionId];
    if (!text || text.trim() === '') return alert('Comment cannot be empty');

    const commentsRef = collection(db, 'suggestions', suggestionId, 'comments');

    await addDoc(commentsRef, {
      text,
      commenterName: userName,
      createdAt: new Date(),
    });

    // Clear input
    setCommentTexts((prev) => ({
      ...prev,
      [suggestionId]: '',
    }));

    fetchSuggestions(); // refresh list with new comment
  };

 const getInitials = (name) => {
    return name
      .split(" ") // Split the name into words
      .map(word => word[0]) // Get the first letter of each word
      .join(""); // Join them together
  };
  
  

  return (
      <main className="pageContainer">
      <header className='Main m-Header'>
        <section className='container'>
          <div className='innerLogo' onClick={() => router.push('/')}>
            <img src="/ujustlogo.png" alt="Logo" className="logo" />
          </div>
          <div>
            <div className="userName" onClick={handleLogout} style={{ cursor: 'pointer' }}>
  <span>{getInitials(userName)}</span>
</div>

          </div>
        </section>
      </header>
 <section className='dashBoardMain'>
  <div className="suggestion-list-container">
    <div className='sectionHeadings'>
      <h2>Suggestion Tasks</h2> 
      <div className='filterIcon' onClick={() => setShowFilter((prev) => !prev)}>
        <FaFilter />
      </div>
    </div>

    {/* Filter dropdown */}
    {showFilter && (
      <div className='container filterTab stickyFilter slide-up' ref={filterRef}>
        <h4>Filter</h4>
        <ul>
          {filterTab.map((item, index) => (
            <li
              key={index}
              className={`navItem ${activeIndex === index ? "active" : ''}`}
              onClick={() => handleClick(index, item)}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className='container suggestionList'>
      {loading ? (
        <div className='loader'><span className="loader2"></span></div>
      ) : (
        filteredFeedback.length === 0 ? (
          <p>No suggestions found for "{selectedFilter}"</p>
        ) : (
          filteredFeedback.map((task) => (
            <div key={task.id} className="suggestionBox">
              <div className="suggestionDetails">
                {task.status === "Declined" ? (
                  <span className="meetingLable3">{task.status}</span>
                ) : (
                  <span className="meetingLable">{task.status}</span>
                )}
                <span className="suggestionTime">{task.date}</span>
              </div>

              <div className="boxHeading">
                <div className="suggestions">
                  <h4>{task.eventName}</h4>
                  <p className='desc'>{task.taskDescription}</p>
                </div>
              </div>
    
              <div className="extraDetails">
                <p><strong>Suggested By:</strong> {task.createdBy}</p>
                {/* {task.assignedTo && <p><strong>Assigned To:</strong> {task.assignedTo}</p>} */}
              </div>

         <div className="comments-section">
  <Link href={`/suggestions/${task.id}?tab=Comments`}>
    <div className="comment-count">
      {task.comments && task.comments.length > 0 ? (
        <small><BiComment /> {task.comments.length}</small>
      ) : (
        <small><BiComment/> 0</small>
      )}
    </div>
  </Link>
</div>

            

              <div className='meetingBoxFooter'>
                <div className='viewDetails'>
                  <Link href={`/suggestions/${task.id}`}>View Details</Link>
                </div>
                <div>
                  <button className="addcomment" onClick={() => openModal(task.id)}>
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          ))
        )
      )}
  

      {/* Modal */}
      {isModalOpen && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Add Comment</h3>
      <textarea
        rows={4}
        value={commentTexts[activeSuggestionId] || ''}
        placeholder="Write your comment..."
        onChange={handleCommentChange}
      />
       <ul className='actionBtns'>
                    <li>
                      <button onClick={handleModalSubmit} className='m-button'>Submit</button>
                    </li>
                    <li>
                      <button onClick={closeModal} className='m-button-2'>Cancel</button>
                    </li>
                  </ul>
    
    </div>
  </div>
)}

    </div>

    </div>
    <HeaderNav/>
    </section>
    </main>
  );
};

export default SuggestionList;
