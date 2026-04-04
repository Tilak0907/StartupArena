import { useEffect, useState,useRef } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/ChatPage.css";

export default function ChatPage() {

  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
const [visibleCount, setVisibleCount] = useState(5);
const [dropdownOpen, setDropdownOpen] = useState(false);
const dropdownRef = useRef(null);

const handleScroll = (e) => {
  const bottom =
    e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 5;

  if (bottom) {
    setVisibleCount((prev) => prev + 5);
  }
};

useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target)
    ) {
      setDropdownOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  /* ===============================
     CLOSE CHAT (NEW FEATURE)
  =============================== */

  const closeChat = () => {
    setChatId(null);
    setMessages([]);
  };

  /* ===============================
     1️⃣ Wait for Auth
  =============================== */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsubscribe();
  }, []);

  /* ===============================
     2️⃣ Load Mentors
  =============================== */
  useEffect(() => {

    const fetchMentors = async () => {

      const snapshot = await getDocs(collection(db, "users"));

      const mentorList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => user.role === "mentor");

      setMentors(mentorList);

    };

    fetchMentors();

  }, []);

  /* ===============================
     3️⃣ Load Existing Chats
  =============================== */
  useEffect(() => {

    if (!user) return;

    const fetchChats = async () => {

      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid)
      );

      const snapshot = await getDocs(q);

      const chatList = await Promise.all(

        snapshot.docs.map(async (docSnap) => {

          const chatData = docSnap.data();

          const mentorId = chatData.participants.find(
            id => id !== user.uid
          );

          let mentorName = "Mentor";

          if (mentorId) {
            const mentorDoc = await getDoc(doc(db, "users", mentorId));

            if (mentorDoc.exists()) {
              mentorName = mentorDoc.data().name;
            }
          }

          return {
            id: docSnap.id,
            mentorId,
            mentorName,
            ...chatData
          };

        })

      );

      setChats(chatList);

    };

    fetchChats();

  }, [user]);

  /* ===============================
     4️⃣ Listen Messages
  =============================== */
  useEffect(() => {

    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMessages(msgs);

    });

    return () => unsubscribe();

  }, [chatId]);

  /* ===============================
     5️⃣ Create Chat
  =============================== */
  const startChat = async () => {

    if (!selectedMentor) {
      alert("Please select a mentor");
      return;
    }

    if (!user) return;

    const response = await fetch("https://startuparena.onrender.com/api/chat/create", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        founderId: user.uid,
        mentorId: selectedMentor
      })

    });

    const data = await response.json();

    if (data.chatId) setChatId(data.chatId);

  };

  /* ===============================
     6️⃣ Send Message
  =============================== */
  const sendMessage = async () => {

    if (!text.trim() || !chatId) return;

    await fetch("https://startuparena.onrender.com/api/chat/send", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        chatId,
        senderId: user.uid,
        text
      })

    });

    setText("");

  };

  /* ===============================
     7️⃣ Delete Chat
  =============================== */
  const deleteChat = async (chatIdToDelete) => {

    const confirmDelete = window.confirm("Delete this chat?");
    if (!confirmDelete) return;

    try {

      await fetch(`https://startuparena.onrender.com/api/chat/delete/${chatIdToDelete}`, {
        method: "DELETE"
      });

      setChats(prev => prev.filter(chat => chat.id !== chatIdToDelete));

      if (chatId === chatIdToDelete) {
        setChatId(null);
        setMessages([]);
      }

    } catch (error) {
      console.error("Error deleting chat:", error);
    }

  };

  const handleKeyDown = (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

      e.preventDefault();
      sendMessage();

    }

  };

  return (

    <div className="chat-page">

      <h2 className="chat-title">Founder Chat</h2>

      <div className="chat-layout">

        {/* LEFT SIDEBAR */}
        <div className="chat-panel chat-sidebar">

          <p className="chat-sidebar-label">Your Chats</p>

          <div className="chat-list">

            {chats.length === 0 ? (

              <p className="chat-list-empty">No chats yet.</p>

            ) : (

              chats.map(chat => (

                <div
                  key={chat.id}
                  className={`chat-list-item ${chatId === chat.id ? "active" : ""}`}
                  onClick={() => setChatId(chat.id)}
                >

                  <span className="chat-name">
                    Chat with {chat.mentorName}
                  </span>

                  <button
                    className="chat-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                  >
                    🗑
                  </button>

                </div>

              ))

            )}

          </div>

          <hr className="chat-divider" />

          {!chatId && (

            <div className="chat-new-section">

              <label className="chat-select-label">
                Start New Chat
              </label>

              <div className="mentor-dropdown-wrapper" ref={dropdownRef}>

  {/* Header (Select Mentor) */}
  <div
    className="mentor-dropdown-header"
    onClick={() => setDropdownOpen(!dropdownOpen)}
  >
    <span>
      {selectedMentor
        ? mentors.find(m => m.id === selectedMentor)?.name
        : "Select Mentor"}
    </span>
    <span className={`arrow ${dropdownOpen ? "open" : ""}`}>⌃</span>
  </div>

  {/* Dropdown */}
  {dropdownOpen && (
    <div className="mentor-dropdown-box">

      {/* Search */}
      <div className="mentor-search-box">
        <input
          type="text"
          placeholder="Search by name or expertise..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
    <div className="mentor-list" onScroll={handleScroll}>
  {(() => {
    const filteredMentors = mentors
      .filter(m => m.name && m.name.trim() !== "")
      .filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.expertise || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name)); // 🔥 alphabetical

    if (filteredMentors.length === 0) {
      return (
        <div className="no-mentor">
          No mentors found
        </div>
      );
    }

    return filteredMentors
      .slice(0, visibleCount)
      .map((mentor) => (
        <div
          key={mentor.id}
          className={`mentor-item ${
            selectedMentor === mentor.id ? "active" : ""
          }`}
          onClick={() => {
            setSelectedMentor(mentor.id);
            setDropdownOpen(false);
          }}
        >
          <span className="mentor-name">{mentor.name}</span>
          <span className="mentor-sep">—</span>
          <span className="mentor-expertise">
            {mentor.expertise || "Not Specified"}
          </span>
        </div>
      ));
  })()}
</div>

     

    </div>
  )}

</div>

              <button
                className="chat-start-btn"
                onClick={startChat}
              >
                Start Chat
              </button>

            </div>

          )}

        </div>

        {/* RIGHT SIDE */}
        <div className="chat-panel chat-main">

          {chatId ? (

            <>

              {/* NEW CHAT HEADER WITH CLOSE BUTTON */}
              <div className="chat-header">

                <span className="chat-header-title">
                  Chat
                </span>

                <button
                  className="chat-close-btn"
                  onClick={closeChat}
                >
                  ✖
                </button>

              </div>

              <div className="chat-messages">

                {messages.length === 0 ? (

                  <div className="chat-messages-empty">
                    No messages yet. Say hello 👋
                  </div>

                ) : (

                  messages.map(msg => (

                    <div
                      key={msg.id}
                      className={`chat-message-row ${
                        msg.senderId === user?.uid
                          ? "sent"
                          : "received"
                      }`}
                    >

                      <span className="chat-bubble">
                        {msg.text}
                      </span>

                    </div>

                  ))

                )}

              </div>

              <div className="chat-input-bar">

                <input
                  className="chat-input"
                  type="text"
                  value={text}
                  placeholder="Type a message..."
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <button
                  className="chat-send-btn"
                  onClick={sendMessage}
                >
                  Send →
                </button>

              </div>

            </>

          ) : (

            <div className="chat-placeholder">

              <div className="chat-placeholder-icon">
                💬
              </div>

              <p>
                Select a chat or start a new one with a mentor.
              </p>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}