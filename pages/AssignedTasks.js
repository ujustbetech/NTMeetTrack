import React, { useEffect, useState } from 'react';
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
import '/pages/events/event.scss';
import HeaderNav from '../component/HeaderNav';

const AssignedTask = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [userName, setUserName] = useState('');
  const [commentTexts, setCommentTexts] = useState({});
  const [ntMembers, setNtMembers] = useState([]);
  const [subTaskTexts, setSubTaskTexts] = useState({});

  // ✅ Fetch user name using phone number stored in localStorage
  const fetchUserName = async (phoneNumber) => {
    const userRef = doc(db, 'NTMembers', phoneNumber);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      setUserName(userDoc.data().name);
    } else {
      console.error('User not found in NTMembers');
    }
  };

  const fetchNTMembers = async () => {
    const snapshot = await getDocs(collection(db, 'NTMembers'));
    const members = snapshot.docs.map((doc) => doc.data());
    setNtMembers(members);
  };

  useEffect(() => {
    const phone = localStorage.getItem('ntnumber');
    if (phone) fetchUserName(phone);
    fetchNTMembers();
  }, []);

  useEffect(() => {
    if (userName) {
      fetchSuggestions();
    }
  }, [userName]);

  // ✅ Fetch only suggestions assigned to this user by name
  const fetchSuggestions = async () => {
    const querySnapshot = await getDocs(collection(db, 'suggestions'));
    const suggestionList = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const suggestionData = { id: docSnap.id, ...docSnap.data() };

        // Filter only tasks assigned to the current user by name
        if (suggestionData.assignedTo !== userName) return null;

        // Fetch comments
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

        // Fetch subtasks
        const subtaskSnapshot = await getDocs(
          query(
            collection(db, 'suggestions', docSnap.id, 'subtasks'),
            orderBy('date', 'asc')
          )
        );
        suggestionData.subtasks = subtaskSnapshot.docs.map((subtaskDoc) => ({
          id: subtaskDoc.id,
          ...subtaskDoc.data(),
        }));

        return suggestionData;
      })
    );

    setSuggestions(suggestionList.filter(Boolean));
  };
const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('');
  };
  const handleCommentChange = (suggestionId, value) => {
    setCommentTexts((prev) => ({
      ...prev,
      [suggestionId]: value,
    }));
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

    setCommentTexts((prev) => ({
      ...prev,
      [suggestionId]: '',
    }));

    fetchSuggestions();
  };

  const handleSubtaskInput = (taskId, field, value) => {
    setSubTaskTexts((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
      },
    }));
  };

  const addSubtask = async (parentTaskId) => {
    const { desc, assignedTo } = subTaskTexts[parentTaskId] || {};
    if (!desc || !assignedTo) return alert('Subtask fields required');

    const subtaskRef = collection(db, 'suggestions', parentTaskId, 'subtasks');
    await addDoc(subtaskRef, {
      taskDescription: desc,
      assignedTo,
      eventName: 'Subtask',
      createdBy: userName,
      date: new Date(),
      status: 'Pending',
    });

    setSubTaskTexts((prev) => ({
      ...prev,
      [parentTaskId]: { desc: '', assignedTo: '' },
    }));

    fetchSuggestions();
  };

  return (
      <main className="pageContainer">
      <header className="Main m-Header">
        <section className="container">
          <div className="innerLogo" onClick={() => router.push('/')}>
            <img src="/ujustlogo.png" alt="Logo" className="logo" />
          </div>
          <div>
            <div className="userName">
              {userName || 'User'} <span>{getInitials(userName)}</span>
            </div>
          </div>
        </section>
      </header>

      <section className="dashBoardMain">
    <div className="suggestion-list-container">
      <h2>Your Assigned Suggestions</h2>
      <table className="suggestion-table">
        <thead>
          <tr>
            <th>Description</th>
            {/* <th>Date</th> */}
            <th>Status</th>
            <th>Assigned To</th>
            <th>Event</th>
            <th>Created By</th>
            <th>Assign Subtasks</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.map((task) => (
            <tr key={task.id}>
              <td>{task.taskDescription}</td>
              {/* <td>{new Date(task.date.seconds * 1000).toLocaleDateString()}</td> */}
              <td>{task.status}</td>
              <td>{task.assignedTo}</td>
              <td>{task.eventName}</td>
              <td>{task.createdBy}</td>
             <td>
                

                {/* Subtask Section */}
                <div className="subtask-section" style={{ borderTop: '1px solid #ccc', paddingTop: 10 }}>
                  <input
                    placeholder="Subtask Description"
                    value={subTaskTexts[task.id]?.desc || ''}
                    onChange={(e) =>
                      handleSubtaskInput(task.id, 'desc', e.target.value)
                    }
                  />
                  <select
                    value={subTaskTexts[task.id]?.assignedTo || ''}
                    onChange={(e) =>
                      handleSubtaskInput(task.id, 'assignedTo', e.target.value)
                    }
                  >
                    <option value="">Assign To</option>
                    {ntMembers.map((member) => (
                      <option key={member.name} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => addSubtask(task.id)}>Create Subtask</button>

                  {/* Subtask Display */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <b>Subtasks:</b>
                      <ul>
                        {task.subtasks.map((sub) => (
                          <li key={sub.id}>
                            {sub.taskDescription} - <i>{sub.assignedTo}</i> ({sub.status})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </td> 
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <HeaderNav/>
    </section>
    </main>
  );
};

export default AssignedTask;
