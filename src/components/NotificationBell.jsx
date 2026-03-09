import { useState, useEffect } from "react";
import NotificationBox from "./NotificationBox";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import "../styles/NotificationBell.css";

export default function NotificationBell() {

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {

    if (!auth.currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      setCount(snapshot.size);

    });

    return () => unsubscribe();

  }, []);

  return (

    <div className="notificationBell">

      <span
        className="bellIcon"
        onClick={() => setOpen(!open)}
      >
        🔔

        {count > 0 && (
          <span className="notificationBadge">
            {count}
          </span>
        )}

      </span>

      {open && <NotificationBox />}

    </div>

  );

}