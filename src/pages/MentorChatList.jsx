import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/MentorChatList.css";

export default function MentorChatList() {

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        setLoading(false);
        return;
      }

      try {

        const q = query(
          collection(db, "chats"),
          where("participants", "array-contains", user.uid)
        );

        const snapshot = await getDocs(q);

        const chatList = await Promise.all(

          snapshot.docs.map(async (docSnap) => {

            const chatData = docSnap.data();

            const founderId = chatData.participants.find(
              id => id !== user.uid
            );

            let founderName = "Founder";
            let companyName = "Startup";

            const userQuery = query(
              collection(db, "users"),
              where("__name__", "==", founderId)
            );

            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
              founderName = userSnapshot.docs[0].data().name;
            }

            const profileQuery = query(
              collection(db, "profiles"),
              where("userId", "==", founderId)
            );

            const profileSnapshot = await getDocs(profileQuery);

            if (!profileSnapshot.empty) {
              companyName = profileSnapshot.docs[0].data().name;
            }

            return {
              id: docSnap.id,
              founderName,
              companyName,
              ...chatData
            };

          })

        );

        setChats(chatList);

      } catch (error) {
        console.error("Error fetching chats:", error);
      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, []);

  /* ===============================
     DELETE CHAT
  =============================== */

  const deleteChat = async (chatId) => {

    const confirmDelete = window.confirm("Delete this chat?");

    if (!confirmDelete) return;

    try {

      await fetch(`https://startuparena.onrender.com/api/chat/delete/${chatId}`, {
        method: "DELETE"
      });

      setChats(prev => prev.filter(chat => chat.id !== chatId));

    } catch (error) {

      console.error("Error deleting chat:", error);

    }

  };

  /* ===============================
     Loading UI
  =============================== */

  if (loading) {
    return (
      <div className="mentorChatListPage">
        <div className="mentorChatListContainer">
          <div className="mentorChatLoading">
            <div className="mentorChatSkeleton" />
            <div className="mentorChatSkeleton" />
            <div className="mentorChatSkeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className="mentorChatListPage">

      <div className="mentorChatListContainer">

        <h2 className="mentorChatListHeading">My Chats</h2>

        <p className="mentorChatListSubtitle">
          Your active mentor conversations
        </p>

        <div className="mentorChatListDivider" />

        {chats.length === 0 ? (

          <div className="mentorChatEmpty">
            <span className="mentorChatEmptyIcon">💬</span>
            <p className="mentorChatEmptyText">No chats yet</p>
            <p className="mentorChatEmptySubtext">
              Your mentor conversations will appear here
            </p>
          </div>

        ) : (

          <div className="mentorChatList">

            {chats.map(chat => (

              <div
                key={chat.id}
                className="mentorChatCard"
                onClick={() => navigate(`/mentor/chat/${chat.id}`)}
              >

                <div className="mentorChatAvatar">👤</div>

                <div className="mentorChatCardBody">

                  <div className="mentorChatCardTitle">
                    {chat.companyName}
                  </div>

                  <div className="mentorChatCardMeta">
                    Founder: {chat.founderName}
                  </div>

                </div>

                <button
                  className="mentorChatDeleteBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  🗑
                </button>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>

  );

}