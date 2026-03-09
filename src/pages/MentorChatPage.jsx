import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db, auth } from "../firebase";
import "../styles/MentorChatPage.css";

export default function MentorChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await fetch("http://localhost:5000/api/chat/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chatId,
        senderId: auth.currentUser.uid,
        text
      })
    });

    setText("");
  };

  return (
    <div className="mentorChatMainContainer">

      <h2 className="mentorChatHeader">Chat</h2>

      <div className="mentorChatMessagesArea">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.senderId === auth.currentUser.uid
                ? "mentorChatRow mentorChatRowRight"
                : "mentorChatRow mentorChatRowLeft"
            }
          >
            <span
              className={
                msg.senderId === auth.currentUser.uid
                  ? "mentorChatBubble mentorChatBubbleSent"
                  : "mentorChatBubble mentorChatBubbleReceived"
              }
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <div className="mentorChatInputSection">

       <textarea
  value={text}
  onChange={(e) => setText(e.target.value)}
  placeholder="Type message..."
  className="mentorChatTextInput"
  rows="1"
/>

        <button
          onClick={sendMessage}
          className="mentorChatSendButton"
        >
          Send
        </button>

      </div>

    </div>
  );
}