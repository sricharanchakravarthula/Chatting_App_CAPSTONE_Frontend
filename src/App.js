import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SetAvatar from "./components/SetAvatar";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import IncomingCall from "./components/IncomingCall";
import { io } from "socket.io-client";
import { host } from "./utils/APIRoutes";

export default function App() {
  const socket = useRef();
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    socket.current = io(host);

    const user = JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );

    if (user) {
      socket.current.emit("add-user", user._id);
    }

    // 🎧 Listen for incoming call
    socket.current.on("incoming-call", (data) => {
      setIncomingCall({
        from: data.from,
      });
    });
  }, []);

  const acceptCall = () => {
    socket.current.emit("call-accepted", { to: incomingCall.from._id });
    setIncomingCall(null);
    alert("📞 Call Accepted (Next → integrate WebRTC)");
  };

  const rejectCall = () => {
    socket.current.emit("call-rejected", { to: incomingCall.from._id });
    setIncomingCall(null);
  };

  return (
    <BrowserRouter>
      {incomingCall && (
        <IncomingCall
          caller={incomingCall.from.username}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setAvatar" element={<SetAvatar />} />
        <Route path="/" element={<Chat socket={socket} />} />
      </Routes>
    </BrowserRouter>
  );
}
