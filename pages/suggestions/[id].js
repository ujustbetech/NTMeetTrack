import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy, addDoc, Timestamp, serverTimestamp, onSnapshot,updateDoc,arrayUnion
} from 'firebase/firestore';
import '../../src/app/styles/user.scss';
import { app } from '../../firebaseConfig';
import HeaderNav from '../../component/HeaderNav';
import { v4 as uuidv4 } from 'uuid';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Swal from 'sweetalert2';

const db = getFirestore(app);

export default function EventDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [documents, setDocuments] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const { tab } = router.query;
  
  const [userName, setUserName] = useState('');
  const [eventInfo, setEventInfo] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeLeft, setTimeLeft] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [commentTexts, setCommentTexts] = useState({});
  const [ntMembers, setNtMembers] = useState([]);
  const [subTaskTexts, setSubTaskTexts] = useState({});

  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const filteredSubtasks = subtasks.filter(
    (sub) => sub.parentId === id
  );

  const [selectedFilter, setSelectedFilter] = useState(""); // Default empty filter
  const [statusFilter, setStatusFilter] = useState('All');
  const [commentInputs, setCommentInputs] = useState({});
  const [activeIndex, setActiveIndex] = useState(null);
  const filterTab = ["All", "Acknowledged",
    "Accepted",
    "Declined",
    "UJustBe Queue",
    "NT Queue",
    "Completed", "Pending"];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSubtaskId, setActiveSubtaskId] = useState(null);
  const [activeParentId, setActiveParentId] = useState(null);
  const [openStates, setOpenStates] = useState({});


  useEffect(() => {
    if (tab && ['Overview', 'Documents', 'Tasks', 'Comments', 'My Tasks'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [tab]);

  const openModal = (subtaskId, parentId) => {
    setActiveSubtaskId(subtaskId);
    setActiveParentId(parentId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveSubtaskId(null);
    setActiveParentId(null);
  };
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [newComment, setNewComment] = useState('');
 const handleCommentSubmit = async () => {
  if (!newComment.trim()) return;

  if (!activeParentId || !activeSubtaskId) {
    console.error('Missing parentId or subtaskId');
    return;
  }

  try {
    const subtaskRef = doc(db, 'suggestions', activeParentId, 'subtasks', activeSubtaskId);

    await updateDoc(subtaskRef, {
      comments: arrayUnion({
        text: newComment,
        by: userName,
        at: serverTimestamp(),
      }),
    });

    setNewComment('');
  } catch (error) {
    console.error('Error adding comment:', error);
  }
};


  useEffect(() => {
    if (!id) return; // 'id' is the suggestion/task ID

    const q = query(
      collection(db, 'suggestions', id, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(updatedComments);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [id]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!id) return;

      const docRef = collection(db, 'suggestions', id, 'documents');
      const snapshot = await getDocs(docRef);

      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDocuments(docs);
    };

    fetchDocuments();
  }, [id]);
  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    const storage = getStorage();
    const fileRef = ref(storage, `suggestions/${id}/documents/${uuidv4()}_${file.name}`);

    try {
      setUploading(true);
      setDescription('');

      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, 'suggestions', id, 'documents'), {
        fileName: file.name,
        fileURL: url,
        whouploaded: userName,
        description, // Include description here
        uploadedAt: Timestamp.now()
      });


      setSuccessMsg("File uploaded successfully!");
      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };


useEffect(() => {
  if (!id) return;

  const docRef = collection(db, 'suggestions', id, 'documents');

  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setDocuments(docs);
  });

  // Cleanup on unmount
  return () => unsubscribe();
}, [id]);

  useEffect(() => {
    if (userName) {
      fetchSubtasks();
    }
  }, [userName, statusFilter]);

  const fetchSubtasks = async (suggestionId) => {
    if (!suggestionId) return;

    const subtasksRef = collection(db, 'suggestions', suggestionId, 'subtasks');
    const subtasksSnapshot = await getDocs(query(subtasksRef, orderBy('date', 'desc')));

    const filteredSubtasks = subtasksSnapshot.docs
      .map((doc) => ({
        ...doc.data(),
        id: doc.id,
        parentId: suggestionId,
      }))
      .filter((sub) => statusFilter === 'All' || sub.status === statusFilter);

    setSubtasks(filteredSubtasks);
  };


  const handleCommentChange = (subtaskId, comment) => {
    setCommentInputs((prev) => ({
      ...prev,
      [subtaskId]: comment,
    }));
  };
const addComment = async (parentId, subtaskId) => {
  const commentText = commentInputs[subtaskId];
  if (!commentText?.trim()) return;

  if (!parentId || !subtaskId) {
    console.error('Missing parentId or subtaskId', { parentId, subtaskId });
    return;
  }

  const subtaskRef = doc(db, 'suggestions', parentId, 'subtasks', subtaskId);
  const docSnap = await getDoc(subtaskRef);

  if (!docSnap.exists()) {
    console.error('Subtask document does not exist at:', subtaskRef.path);
    return;
  }

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

  fetchSubtasks(parentId);
  setIsModalOpen(false); // 👈 Close the modal
};

const markCompleted = async (parentId, subtaskId) => {
  if (!parentId || !subtaskId) {
    console.error('Missing parentId or subtaskId', { parentId, subtaskId });
    return;
  }

  const subtaskRef = doc(db, 'suggestions', parentId, 'subtasks', subtaskId);

  const docSnap = await getDoc(subtaskRef);
  if (!docSnap.exists()) {
    console.error('Subtask document does not exist at:', subtaskRef.path);
    return;
  }

  await updateDoc(subtaskRef, {
    status: 'Completed',
    completedAt: new Date(),
  });

  fetchSubtasks(parentId);
};

useEffect(() => {
  if (id) {
    fetchSubtasks(id);
  }
}, [id, statusFilter]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!id) return;

      const docsRef = collection(db, 'suggestions', id, 'documents');
      const snapshot = await getDocs(docsRef);

      const fetchedDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDocuments(fetchedDocs);
    };

    fetchDocuments();
  }, [id]);

  useEffect(() => {
    const phone = localStorage.getItem('ntnumber');
    if (phone) fetchUserName(phone);
    fetchNTMembers();
  }, []);
  const fetchNTMembers = async () => {
    const snapshot = await getDocs(collection(db, 'NTMembers'));
    const members = snapshot.docs.map((doc) => doc.data());
    setNtMembers(members);
  };
  const fetchUserName = async (phoneNumber) => {
    const userRef = doc(db, 'NTMembers', phoneNumber);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      setUserName(userDoc.data().name);
    }
  };


  useEffect(() => {
    const fetchSuggestionById = async () => {
      const docRef = doc(db, 'suggestions', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSelectedSuggestion({ id: docSnap.id, ...docSnap.data() });
      }
    };

    if (id) fetchSuggestionById();
  }, [id]);


  useEffect(() => {
    if (userName) {
      fetchSuggestions();
    }
  }, [userName]);
  const fetchSuggestions = async () => {
    const querySnapshot = await getDocs(collection(db, 'suggestions'));
    const suggestionList = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const suggestionData = { id: docSnap.id, ...docSnap.data() };

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


  const handleSubtaskInput = (taskId, field, value) => {
    setSubTaskTexts((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
      },
    }));
  };
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

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // Fetch main suggestion
        const docRef = doc(db, 'suggestions', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSuggestion(docSnap.data());
        } else {
          setError('No such suggestion exists');
        }

        // Fetch subtasks
        const subtasksSnapshot = await getDocs(collection(db, 'suggestions', id, 'subtasks'));
        const subtasksList = subtasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubtasks(subtasksList);

        // Fetch comments
        const commentsSnapshot = await getDocs(collection(db, 'suggestions', id, 'comments'));
        const commentsList = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(commentsList);

      } catch (err) {
        console.error("Error fetching suggestion data:", err);
        setError(err.message);
      }
    };

    fetchData();
  }, [id]);

  if (error) return <div>Error: {error}</div>;
  if (!suggestion) return <div className='loader'><span className="loader2"></span></div>;

  //   useEffect(() => {
  //   const storedPhoneNumber = localStorage.getItem('ntnumber');
  //   fetchUserName(storedPhoneNumber);
  // }, []);


  const getInitials = (name) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("");
  };





  const renderTabContent = () => {
    if (!suggestion) return <div className='loader'><span className="loader2"></span></div>


    switch (activeTab) {
      case 'Overview':
        return (
          <>
            <div className="task-list">
              <h3>Overview</h3>

              {suggestion ? (
                <div className="task-card">
                  <p>{suggestion.taskDescription}</p>
                </div>
              ) : (
                <div className="task-card">
                  <p>Yet to be uploaded.</p>
                </div>
              )}
            </div>
          </>
        );

      case 'Documents':
        return (
          <div className="task-list">
        
 <div className='sectionHeader'>
      <h3>Documents</h3>
            <button className="actionBtn" onClick={() => setIsAssignModalOpen(true)}>
              Upload Doc +
            </button>
</div>
            {isAssignModalOpen && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="assigned-task-container">
                    <div className="assigned-task-header">
                      <h2>Upload a Document</h2>
                      <button className="close-modal" onClick={() => setIsAssignModalOpen(false)}>x</button>
                    </div>

                    <div className="assigned-task-body">
                      <div className="file-upload-wrapper">
                        <label htmlFor="file-upload" className="file-label">
                          {file ? file.name : '📁 Select a file'}
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          onChange={(e) => setFile(e.target.files[0])}
                          className="file-input"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Enter description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="description-input"
                      />
                      <button className="btn-complete" onClick={handleUpload} disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>

                      {successMsg && <p className="success-msg">{successMsg}</p>}
                    </div>




                  </div>
                </div>
              </div>
            )}


            {documents.length > 0 ? (
              documents.map((doc) => (
                <div key={doc.id} className="task-card">
                  <div className="task-content">
                    <div className="task-info">

                      <p className="task-date">{doc.uploadedAt ? new Date(doc.uploadedAt.seconds * 1000).toLocaleDateString() : 'Unknown'}</p>

                    </div>

                    <div className="meetingLable">
                      <strong>{doc.whouploaded || 'No Name'}</strong>
                    </div>
                  </div>
                  <div className="task-details">
                    <h4> {doc.fileName || 'No Name'}</h4>
                    <p><strong>Description: </strong>{doc.description || 'No description provided'}</p>





                  </div>
           
                  {doc.fileURL ? (
                    <button
                      className="actionBtn blueclr"
                      onClick={() => window.open(doc.fileURL, '_blank')}
                    >
                      View
                    </button>
                  ) : (
                    <p style={{ color: 'red' }}>No file URL available.</p>
                  )}
                </div>
           
              ))
            ) : (
              <p style={{ color: 'white' }}>No documents uploaded yet.</p>
            )}
          </div>
        );


      case 'Tasks':
        return (
          <div className="task-list">
         
     <div className='sectionHeader'>
         <h3>Tasks</h3>

            {selectedSuggestion?.assignedTo === userName && (
              <button className="actionBtn" onClick={() => setIsAssignModalOpen(true)}>
                Create Tasks +
              </button>
            )}

</div>
            {isAssignModalOpen && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="assigned-task-container">
                    <div className="assigned-task-header">
                      <h2>Assign Task</h2>
                      {selectedSuggestion && (
                        <>
                          <p className="event-name">{selectedSuggestion.eventName}</p>
                          <p className="owned-by">
                            <strong>Owned by:</strong> {selectedSuggestion.assignedTo}
                          </p>
                        </>
                      )}
                      <button className='close-modal' onClick={() => setIsAssignModalOpen(false)}>x</button>
                    </div>

                    <div className="assigned-task-body">
                      {selectedSuggestion?.assignedTo === userName ? (
                        <>
                          <input
                            type="text"
                            placeholder="Subtask Description"
                            value={subTaskTexts[selectedSuggestion.id]?.desc || ''}
                            onChange={(e) =>
                              handleSubtaskInput(selectedSuggestion.id, 'desc', e.target.value)
                            }
                          />

                       <select
  value={subTaskTexts[selectedSuggestion.id]?.assignedTo || ''}
  onChange={(e) =>
    handleSubtaskInput(selectedSuggestion.id, 'assignedTo', e.target.value)
  }
>
  <option value="">Assign To</option>
  {ntMembers
    .slice() // create a shallow copy to avoid mutating original
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((member) => (
      <option key={member.name} value={member.name}>
        {member.name}
      </option>
    ))}
</select>


                          <button onClick={() => addSubtask(selectedSuggestion.id)}>Create Subtask</button>
                        </>
                      ) : (
                        <p style={{ color: 'gray', fontStyle: 'italic' }}>
                          Only the owner of this task can assign subtasks.
                        </p>
                      )}

                      {selectedSuggestion.subtasks?.length > 0 && (
                        <div className="subtask-list">
                          <h3>Subtasks</h3>
                          <ul>
                            {selectedSuggestion.subtasks.map((sub) => (
                              <li key={sub.id}>
                                <span>{sub.taskDescription}</span>
                                <i>
                                  {sub.assignedTo} ({sub.status})
                                </i>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {subtasks.length > 0 ? (
              subtasks.map((sub) => (
                <div key={sub.id} className="task-card">
                  <div className="task-content">
                    <div className="task-info">
                      {/* <h4 className="task-heading">{sub.taskTitle || 'Subtask'}</h4> */}
                      <p className="task-date">
                        {sub.date
                          ? new Date(sub.date.seconds * 1000).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <span
                      className={
                        sub.status === 'Completed' ? 'meetingLable' : 'meetingLable3'
                      }
                    >
                      {sub.status}
                    </span>
                  </div>

                  <div className="task-details">
                    <h4>{sub.taskDescription}</h4>
                    <p><strong>Assigned To:</strong> {sub.assignedTo || 'Unassigned'}</p>





                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'white' }}>No subtasks available.</p>
            )}

            {/* Modal for adding comment */}
            {isModalOpen && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Add Comment</h3>
                  <textarea
                    rows={4}
                    value={commentInputs[activeSubtaskId] || ''}
                    placeholder="Write your comment..."
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [activeSubtaskId]: e.target.value,
                      }))
                    }
                  />
                  <ul className="actionBtns">
                    <li>
                      <button
                        onClick={() => addComment(activeParentId, activeSubtaskId)}
                        className="m-button"
                      >
                        Submit
                      </button>
                    </li>
                    <li>
                      <button onClick={closeModal} className="m-button-2">
                        Cancel
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

        );
      case 'Comments':
        return (
          <>
            <div className="task-list">
              <div className='sectionHeader'>
                <h3>Comments</h3>

                <button className="actionBtn" onClick={() => setIsAssignModalOpen(true)}>
                  Add Comments
                </button>
              </div>


              {/* Modal for Adding Comment */}
              {isAssignModalOpen && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2>Add a Comment</h2>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                    />
                    <div className="modal-actions">
                      <button className="actionBtn" onClick={handleCommentSubmit}>Post Comment</button>
                      <button className="close-modal" onClick={() => setIsAssignModalOpen(false)}>x</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="comment-section">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment">
                      <div className="avatar">
                        {comment.commenterName.charAt(0).toUpperCase()}
                      </div>
                      <div className="comment-content">
                        <div className="comment-header">
                          <span className="name">{comment.commenterName}</span>
                          <span className="time">
                            {comment.createdAt?.seconds
                              ? new Date(comment.createdAt.seconds * 1000).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="message-box">{comment.text}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-comments">No comments yet.</p>
                )}
              </div>
            </div>
          </>
        );



      case 'My Tasks':
        return (
          <div className="task-list">
            <h3>My Tasks</h3>
            {subtasks.length === 0 ? (
              <p style={{ color: 'white' }}>No subtasks found.</p>
            ) : (
              subtasks
                .filter((sub) => sub.assignedTo === userName)
                .map((sub) => {
                  const isOpen = openStates[sub.id] || false;

                  return (
                    <div
                      key={sub.id}
                      className={`task-card ${isOpen ? 'expanded' : ''}`}
                      onClick={() =>
                        setOpenStates((prev) => ({
                          ...prev,
                          [sub.id]: !prev[sub.id],
                        }))
                      }
                    >
                      <div className="task-content">
                        <div className="task-info">
                      
                          <p className="task-date">
                            {sub.date
                              ? new Date(sub.date.seconds * 1000).toLocaleDateString()
                              : "N/A"}
                          </p>
                             <h4 className="task-heading">{sub.taskDescription || 'Subtask'}</h4>
                        </div>
                        
                        <span className={sub.status === "Completed" ? "meetingLable" : "meetingLable3"}>
                          {sub.status}
                        </span>
                      </div>

                      {isOpen && (
                        <>
                          <div className="task-details">
 
                            <p className="assigned-to">
                              {/* <strong>Assigned To:</strong> {sub.assignedTo || 'Unassigned'} */}
                            </p>

                            <div className="comment-count">
                              {sub.comments?.length > 0 ? (
                                <small>{sub.comments.length} comment{sub.comments.length > 1 ? 's' : ''}</small>
                              ) : (
                                <small>No comments yet</small>
                              )}
                            </div>

                            <ul className="comment-list">
                              {sub.comments?.map((c, i) => (
                                <li key={i}>
                                  <b>{c.by}:</b> {c.text} <i>({new Date(c.at.seconds * 1000).toLocaleString()})</i>
                                </li>
                              ))}
                            </ul>

                            <div className="meeting-box-footer">
                              {sub.status === 'Pending' && (
 <button
  onClick={(e) => {
    e.stopPropagation();
    markCompleted(id, sub.id); // both values should now be correct
  }}
  className="actionBtn"
>
  Mark as Completed
</button>


                              )}

<button
className='actionBtn blueclr'
  onClick={(e) => {
    e.stopPropagation();
    setActiveParentId(id); // Use the route param `id` directly here!
    setActiveSubtaskId(sub.id);
    setIsModalOpen(true);
  }}
>
  Add Comment
</button>




                            </div>

                          </div>
                        </>
                      )}
                    </div>
                  );
                })
            )}

            {isModalOpen && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Add Comment</h3>
                  <textarea
                    rows={4}
                    value={commentInputs[activeSubtaskId] || ''}
                    placeholder="Write your comment..."
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [activeSubtaskId]: e.target.value,
                      }))
                    }
                  />
                  <ul className="actionBtns">
                    <li>
                    <button onClick={() => addComment(activeParentId, activeSubtaskId)} className="m-button">
  Submit
</button>

                    </li>
                    <li>
                      <button onClick={closeModal} className="m-button-2">Cancel</button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        );

    }
  };


  return (
    <>
      <main className="pageContainer">
        <header className='Mains m-Headers'>
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
        <section className='suggestionMains'>
          <div className='container pageHeadings'>

            <div className='DetailsCard'>
              <span className={suggestion?.status === "Approved" ? "lable" : "lable3"}>
                {suggestion?.status}
              </span>
              <h2 className="event-title">{suggestion?.eventName || 'Event Details'}</h2>
              <div className='names'>
             {suggestion?.assignedTo && (
  <p className="event-category with-dot dot-blue">
    Owned by {suggestion.assignedTo}
  </p>
)}

                <p className="event-owner with-dot dot-green">
                  Suggested by {suggestion?.createdBy}
                </p>


              </div>
           <div className="event-meta">
  {suggestion?.date?.seconds && (
    <div className="due-date">
      Date:{" "}
      <strong>
        {new Date(suggestion.date.seconds * 1000).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </strong>
    </div>
  )}
</div>

              {/* <div className="priority-tag">
                Priority <span className="priority-value">Medium</span>
              </div> */}
            </div>
<div className="tabs suggestion-tab">
      {['Overview', 'Documents', 'Tasks', 'Comments', 'My Tasks'].map((tabName) => (
        <button
          key={tabName}
          onClick={() => setActiveTab(tabName)}
          className={`tab ${activeTab === tabName ? 'active' : ''}`}
        >
          {tabName}
        </button>
      ))}
      {/* Your tab content based on `activeTab` here */}
    </div>
           


            {/* Event image and countdown */}
            <div className="suggestionContainer">

              {renderTabContent()}



              {/* Tabs */}
              <HeaderNav />
              {/* Tab content */}

            </div>
          </div>
        </section>
      </main>
    </>
  );
}
