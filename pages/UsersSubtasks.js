import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  updateDoc,
  doc,
  getDoc,
  orderBy,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import '/pages/events/event.scss';

const UserSubtasks = () => {
  const [userName, setUserName] = useState('');
  const [subtasks, setSubtasks] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState(""); // Default empty filter
  const [statusFilter, setStatusFilter] = useState('All');
  const [commentInputs, setCommentInputs] = useState({});
 const [activeIndex, setActiveIndex] = useState(null);
  const filterTab = ["All",   "Acknowledged",
    "Accepted",
    "Declined",
    "UJustBe Queue",
    "NT Queue",
    "Completed","Pending"];
  // ✅ Fetch user name from NTMembers
  const fetchUserName = async (phoneNumber) => {
    const userRef = doc(db, 'NTMembers', phoneNumber);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setUserName(userSnap.data().name);
    }
  };
  const handleClick = (index, filter) => {
    setActiveIndex(index);
    setSelectedFilter(filter);
  };
  useEffect(() => {
    const phone = localStorage.getItem('ntnumber');
    if (phone) {
      fetchUserName(phone);
    }
  }, []);

  useEffect(() => {
    if (userName) {
      fetchSubtasks();
    }
  }, [userName, statusFilter]);

  const fetchSubtasks = async () => {
    const suggestionsSnapshot = await getDocs(collection(db, 'suggestions'));

    let allSubtasks = [];

    for (const suggestionDoc of suggestionsSnapshot.docs) {
      const subtasksRef = collection(db, 'suggestions', suggestionDoc.id, 'subtasks');
      const subtasksSnapshot = await getDocs(query(subtasksRef, orderBy('date', 'desc')));

      const filtered = subtasksSnapshot.docs
        .map((subDoc) => ({
          ...subDoc.data(),
          id: subDoc.id,
          parentId: suggestionDoc.id,
        }))
        .filter(
          (sub) =>
            sub.assignedTo === userName &&
            (statusFilter === 'All' || sub.status === statusFilter)
        );

      allSubtasks = [...allSubtasks, ...filtered];
    }

    setSubtasks(allSubtasks);
  };

  const handleCommentChange = (subtaskId, comment) => {
    setCommentInputs((prev) => ({
      ...prev,
      [subtaskId]: comment,
    }));
  };

  const addComment = async (parentId, subtaskId) => {
    const commentText = commentInputs[subtaskId];
    if (!commentText.trim()) return;

    const subtaskRef = doc(db, 'suggestions', parentId, 'subtasks', subtaskId);
    await updateDoc(subtaskRef, {
      comments: arrayUnion({
        text: commentText,
        by: userName,
        at: new Date(),
      }),
    });

    setCommentInputs((prev) => ({
      ...prev,
      [subtaskId]: '',
    }));

    fetchSubtasks();
  };

  const markCompleted = async (parentId, subtaskId) => {
    const subtaskRef = doc(db, 'suggestions', parentId, 'subtasks', subtaskId);

    await updateDoc(subtaskRef, {
      status: 'Completed',
      completedAt: new Date(),
    });

    fetchSubtasks();
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
       <main className="pageContainer">
      <header className='Main m-Header'>
        <section className='container'>
          <div className='innerLogo' onClick={() => router.push('/')}>
            <img src="/ujustlogo.png" alt="Logo" className="logo" />
          </div>
          <div>
            <div className='userName'> {userName || 'User'} <span>{getInitials(userName)}</span> </div>
          </div>
        </section>
      </header>
      <section className='dashBoardMain'>
    <div className="subtask-page-container">
      <h2>Your Subtasks</h2>

       <div className='container filterTab'>
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

      {subtasks.length === 0 ? (
        <p>No subtasks found.</p>
      ) : (
        <table className="subtask-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Comments</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subtasks.map((sub) => (
              <tr key={sub.id}>
                <td>{sub.taskDescription}</td>
                <td>{sub.assignedTo}</td>
                <td>{sub.status}</td>
                <td>
                  {sub.comments?.length > 0 ? (
                    <ul>
                      {sub.comments.map((c, i) => (
                        <li key={i}>
                          <b>{c.by}:</b> {c.text} <i>({new Date(c.at.seconds * 1000).toLocaleString()})</i>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <i>No comments yet</i>
                  )}
                  <textarea
                    rows={2}
                    placeholder="Add a comment"
                    value={commentInputs[sub.id] || ''}
                    onChange={(e) => handleCommentChange(sub.id, e.target.value)}
                  />
                  <button onClick={() => addComment(sub.parentId, sub.id)}>Add Comment</button>
                </td>
                <td>
                  {sub.status === 'Pending' && (
                    <button onClick={() => markCompleted(sub.parentId, sub.id)}>
                      ✅ Mark Completed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </section>
    </main>
  );
};

export default UserSubtasks;
