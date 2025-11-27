// Chat.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";
import IncomingCall from "../components/IncomingCall";
import AudioCall from "../components/AudioCall";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();

  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);

  const [incomingCall, setIncomingCall] = useState(null);
  const [onCall, setOnCall] = useState(false);
  const [callRemoteUser, setCallRemoteUser] = useState(null);

  /** 🔹 Check login */
  useEffect(() => {
    const user = localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY);
    if (!user) return navigate("/login");
    setCurrentUser(JSON.parse(user));
  }, [navigate]);

  /** 🔹 Setup socket */
  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);
      socket.current.emit("add-user", currentUser._id);
    }
  }, [currentUser]);

  /** 🔹 Fetch contacts */
  useEffect(() => {
    const fetchContacts = async () => {
      if (!currentUser) return;

      if (!currentUser.isAvatarImageSet) {
        navigate("/setAvatar");
        return;
      }

      const { data } = await axios.get(`${allUsersRoute}/${currentUser._id}`);
      setContacts(data);
    };
    fetchContacts();
  }, [currentUser, navigate]);

  /** 🔔 Call events */
  useEffect(() => {
    if (!socket.current) return;

    socket.current.off("incoming-call");
    socket.current.off("call-rejected");
    socket.current.off("call-accepted");
    socket.current.off("end-call");

    // 📥 When someone calls this user
    socket.current.on("incoming-call", (data) => {
      setIncomingCall(data.from);
      setCallRemoteUser(data.from);
    });

    // ❌ Caller notified call was rejected
    socket.current.on("call-rejected", () => {
      alert("❌ Call rejected");
      setIncomingCall(null);
      setOnCall(false);
    });

    // ✔ Caller notified call accepted
    socket.current.on("call-accepted", () => {
      setIncomingCall(null);
      setOnCall(true);
    });

    // 🔴 Either user ended the call
    socket.current.on("end-call", () => {
      alert("🔴 Call Ended");
      setOnCall(false);

      // reset caller flag
      let user = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
      user.isCaller = false;
      localStorage.setItem(process.env.REACT_APP_LOCALHOST_KEY, JSON.stringify(user));
      setCurrentUser(user);

      setCallRemoteUser(null);
    });
  }, [currentUser]);

  /** 📞 Accept call */
  const acceptCall = () => {
    let user = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
    user.isCaller = false; // receiver should NOT be caller
    localStorage.setItem(process.env.REACT_APP_LOCALHOST_KEY, JSON.stringify(user));
    setCurrentUser(user);

    socket.current.emit("call-accepted", {
      to: incomingCall._id ?? incomingCall,
    });
    setIncomingCall(null);
    setOnCall(true);
  };

  /** ❌ Reject call */
  const rejectCall = () => {
    socket.current.emit("call-rejected", {
      to: incomingCall._id ?? incomingCall,
    });
    setIncomingCall(null);
  };

  /** 🔴 End call from UI */
  const endAudioCall = () => {
    if (callRemoteUser) {
      socket.current.emit("end-call", {
        to: callRemoteUser._id ?? callRemoteUser,
      });
    }
    setOnCall(false);

    // reset caller flag
    let user = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
    user.isCaller = false;
    localStorage.setItem(process.env.REACT_APP_LOCALHOST_KEY, JSON.stringify(user));
    setCurrentUser(user);

    setCallRemoteUser(null);
  };

  /** selecting a chat */
  const handleChatChange = (chat) => setCurrentChat(chat);

  return (
    <>
      {/* Popup when receiving a call */}
      {incomingCall && (
        <IncomingCall
          caller={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Active call window */}
      {onCall && currentUser && callRemoteUser && (
        <AudioCall
          socket={socket}
          currentUser={currentUser}
          remoteUser={callRemoteUser}
          onEnd={endAudioCall}
        />
      )}

      {/* Main chat screen */}
      <Container>
        <div className="inner">
          <Contacts contacts={contacts} changeChat={handleChatChange} />
          {currentChat ? (
            <ChatContainer
              currentChat={currentChat}
              socket={socket}
              setCallRemoteUser={setCallRemoteUser}
            />
          ) : (
            <Welcome />
          )}
        </div>
      </Container>
    </>
  );
}

/* UI layout */
const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #131324;
  .inner {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
  }
`;
