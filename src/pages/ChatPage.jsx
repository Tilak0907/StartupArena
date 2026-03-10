import { useEffect, useState } from "react";
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
                >

                  <span
                    className="chat-name"
                    onClick={() => setChatId(chat.id)}
                  >
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

          {/* START NEW CHAT */}
          {!chatId && (

            <div className="chat-new-section">

              <label className="chat-select-label">
                Start New Chat
              </label>

              <select
                className="chat-select"
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
              >

                <option value="" disabled>
                  Select Mentor
                </option>

                {mentors
                  .filter(m => m.name && m.name.trim() !== "")
                  .map((mentor) => (

                    <option key={mentor.id} value={mentor.id}>
                      {mentor.name}
                    </option>

                  ))}

              </select>

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