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

  /** 🔥 CALL SOCKET EVENTS */
  useEffect(() => {
    if (!socket.current) return;

    socket.current.off("incoming-call");
    socket.current.off("call-rejected");
    socket.current.off("call-accepted");
    socket.current.off("end-call");

    /** 📥 Receiver gets a call */
    socket.current.on("incoming-call", ({ from }) => {
      setIncomingCall(from);
      setCallRemoteUser(from);
    });

    /** ❌ Caller notified call rejected */
    socket.current.on("call-rejected", () => {
      alert("❌ Call rejected");
      setIncomingCall(null);
      setOnCall(false);
      setCallRemoteUser(null);
    });

    /** ✔ Caller notified call accepted */
    socket.current.on("call-accepted", ({ from }) => {
      setIncomingCall(null);
      setOnCall(true);
      setCallRemoteUser(from);
    });

    /** 🔴 Call ended by remote */
    socket.current.on("end-call", () => {
      alert("🔴 Call ended");
      setOnCall(false);
      setCallRemoteUser(null);
    });
  }, [currentUser]);

  /** 📞 Accept call */
  const acceptCall = () => {
    incomingCall.isCaller = false;   // 🔥 receiver role
    setOnCall(true);
    setCallRemoteUser(incomingCall);
    socket.current.emit("call-accepted", { to: incomingCall._id, from: currentUser });
    setIncomingCall(null);
  };

  /** ❌ Reject call */
  const rejectCall = () => {
    socket.current.emit("call-rejected", { to: incomingCall._id });
    setIncomingCall(null);
  };

  /** 🔴 End call manually */
  const endAudioCall = () => {
    if (callRemoteUser) {
      socket.current.emit("end-call", { to: callRemoteUser._id });
    }
    setOnCall(false);
    setCallRemoteUser(null);
  };

  /** User selects chat */
  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };

  return (
    <>
      {/* 🔔 incoming call popup */}
      {incomingCall && (
        <IncomingCall
          caller={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* 🔊 audio call live screen */}
      {onCall && currentUser && callRemoteUser && (
        <AudioCall
          socket={socket}
          currentUser={currentUser}
          remoteUser={callRemoteUser}
          onEnd={endAudioCall}
        />
      )}

      <Container>
        <div className="inner">
          <Contacts contacts={contacts} changeChat={handleChatChange} />
          {currentChat ? (
            <ChatContainer
              currentChat={currentChat}
              socket={socket}
              setCallRemoteUser={(user) => {
                user.isCaller = true;       // 🔥 caller role
                setCallRemoteUser(user);
                setOnCall(true);
              }}
            />
          ) : (
            <Welcome />
          )}
        </div>
      </Container>
    </>
  );
}

/* 🎨 UI */
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
