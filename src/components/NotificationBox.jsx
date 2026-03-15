import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import "../styles/NotificationBox.css";

export default function NotificationBox() {

  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {

    if (!auth.currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(data);

    });

    return () => unsubscribe();

  }, []);

  /* ===============================
     CLOSE INDIVIDUAL NOTIFICATION
  =============================== */

  const closeNotification = async (id) => {

    try {

      await deleteDoc(doc(db, "notifications", id));

    } catch (error) {

      console.error("Error deleting notification:", error);

    }

  };

  /* ===============================
     CLOSE ENTIRE BOX
  =============================== */

  const closeBox = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (

    <div className="notificationBox">

      <div className="notificationHeader">

        <h3>Notifications</h3>

        <button
          className="notificationCloseAll"
          onClick={closeBox}
        >
          ✖
        </button>

      </div>

      {notifications.length === 0 ? (

        <p>No notifications</p>

      ) : (

        notifications.map(n => (

          <div key={n.id} className="notificationItem">

            <div className="notificationContent">

              <div className="notificationTitle">
                {n.title}
              </div>

              <div className="notificationMessage">
                {n.message}
              </div>

              {/* NEW: DATE & TIME DISPLAY */}

              {n.createdAt && (
                <div style={{fontSize:"12px", color:"#777", marginTop:"4px"}}>
                  {new Date(n.createdAt.seconds * 1000).toLocaleString()}
                </div>
              )}

            </div>

            <button
              className="notificationClose"
              onClick={() => closeNotification(n.id)}
            >
              ✖
            </button>

          </div>

        ))

      )}

    </div>

  );

}