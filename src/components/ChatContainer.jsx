import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { IoMdCall } from "react-icons/io";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import {
  sendMessageRoute,
  recieveMessageRoute,
  sendFileRoute,
  deleteForMeRoute,
  deleteForEveryoneRoute,
} from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, socket, setCallRemoteUser }) {
  const [messages, setMessages] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);

  const scrollRef = useRef();
  const [menuMessageId, setMenuMessageId] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchMessages = async () => {
      const data = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
      const response = await axios.post(recieveMessageRoute, {
        from: data._id,
        to: currentChat._id,
      });
      setMessages(response.data);
    };
    fetchMessages();
  }, [currentChat]);

  /** 📞 CALL BUTTON — includes caller flag */
  const startCall = () => {
    const data = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));

    data.isCaller = true; // 🔥 IMPORTANT — identifies offer creator
    setCallRemoteUser(currentChat); // pass remote user to Chat.jsx

    socket.current.emit("call-user", { from: data, to: currentChat._id });
    alert("Calling...");
  };

  /** ✉ SEND TEXT */
  const handleSendMsg = async (msg) => {
    const data = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
    const res = await axios.post(sendMessageRoute, {
      from: data._id,
      to: currentChat._id,
      message: msg,
      type: "text",
    });

    socket.current.emit("send-msg", { to: currentChat._id, from: data._id, msg });

    setMessages((prev) => [
      ...prev,
      {
        _id: res.data.id,
        fromSelf: true,
        message: msg,
        type: "text",
        isDeleted: false,
      },
    ]);
  };

  /** 📎 SEND FILE */
  const handleSendFile = async (file) => {
    const data = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
    const formData = new FormData();
    formData.append("from", data._id);
    formData.append("to", currentChat._id);
    formData.append("file", file);
    const response = await axios.post(sendFileRoute, formData);

    socket.current.emit("send-file", {
      to: currentChat._id,
      from: data._id,
      fileUrl: response.data.fileUrl,
      fileType: response.data.fileType,
    });

    setMessages((prev) => [
      ...prev,
      {
        _id: response.data.id,
        fromSelf: true,
        fileUrl: response.data.fileUrl,
        fileType: response.data.fileType,
        type: "file",
        isDeleted: false,
      },
    ]);
  };

  /** 🔔 RECEIVE MESSAGES */
  useEffect(() => {
    if (!socket.current) return;

    socket.current.on("msg-recieve", (msg) =>
      setArrivalMessage({
        fromSelf: false,
        message: msg,
        type: "text",
        isDeleted: false,
      })
    );

    socket.current.on("file-recieve", (data) =>
      setArrivalMessage({
        fromSelf: false,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        type: "file",
        isDeleted: false,
      })
    );
  }, [socket]);

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** ⚙ RIGHT CLICK MENU */
  const openMenu = (e, id) => {
    e.preventDefault();
    setMenuMessageId(id);
    setMenuPos({ x: e.clientX, y: e.clientY });
  };
  const closeMenu = () => setMenuMessageId(null);

  const deleteForMe = async (id) => {
    const data = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
    await axios.post(deleteForMeRoute, { messageId: id, userId: data._id });
    setMessages((prev) => prev.filter((msg) => msg._id !== id));
    closeMenu();
  };

  const deleteForEveryone = async (id) => {
    await axios.post(deleteForEveryoneRoute, { messageId: id });

    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === id
          ? { ...msg, message: "This message was deleted", fileUrl: null, fileType: null, type: "text", isDeleted: true }
          : msg
      )
    );
    closeMenu();
  };

  const downloadImage = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img src={`data:image/svg+xml;base64,${currentChat.avatarImage}`} alt="" />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>

        <div className="actions">
          <IoMdCall className="call-btn" onClick={startCall} />
          <Logout />
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div ref={scrollRef} key={uuidv4()}>
            <div
              className={`message ${message.fromSelf ? "sended" : "recieved"}`}
              onContextMenu={(e) => openMenu(e, message._id)}
            >
              <div className="content">
                {message.isDeleted ? (
                  <p className="deleted">This message was deleted</p>
                ) : (
                  message.type === "text" && <p>{message.message}</p>
                )}

                {!message.isDeleted && message.type === "file" && (
                  <>
                    {message.fileType?.startsWith("image") && (
                      <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                        <img src={message.fileUrl} alt="file" className="zoomable-image" />
                      </a>
                    )}
                    {message.fileType?.startsWith("video") && <video src={message.fileUrl} controls />}
                    {!message.fileType?.startsWith("image") &&
                      !message.fileType?.startsWith("video") && (
                        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="download-btn">
                          📎 Download File
                        </a>
                      )}
                  </>
                )}
              </div>

              {menuMessageId === message._id && (
                <MenuContainer x={menuPos.x} y={menuPos.y}>
                  {!message.isDeleted &&
                    message.type === "file" &&
                    message.fileType?.startsWith("image") && (
                      <>
                        <p onClick={() => window.open(message.fileUrl, "_blank")}>Open Image</p>
                        <p onClick={() => downloadImage(message.fileUrl)}>Save Image</p>
                      </>
                    )}

                  <p onClick={() => deleteForMe(message._id)}>Delete for Me</p>
                  {message.fromSelf && !message.isDeleted && (
                    <p onClick={() => deleteForEveryone(message._id)}>Delete for Everyone</p>
                  )}
                  <p onClick={closeMenu}>Cancel</p>
                </MenuContainer>
              )}
            </div>
          </div>
        ))}
      </div>

      <ChatInput handleSendMsg={handleSendMsg} handleSendFile={handleSendFile} />
    </Container>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const MenuContainer = styled.div`
  position: fixed;
  top: ${(props) => props.y}px;
  left: ${(props) => props.x}px;
  background: #24243b;
  color: white;
  padding: 0.55rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.9rem;
  cursor: pointer;
  z-index: 9999;
  min-width: 180px;
`;

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  overflow: hidden;

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;

    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .username h3 {
      font-size: 1.25rem;
      color: #ffffff;
      font-weight: 600;
    }

    .avatar img {
      height: 3rem;
      border-radius: 50%;
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 1.2rem;

    .call-btn {
      font-size: 1.9rem;
      color: #4caf50;
      cursor: pointer;
    }
  }

  .chat-messages {
    padding: 1rem 2.4rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
  }

  .message {
    display: flex;
  }

  .recieved {
    justify-content: flex-start;
  }
  .recieved .content {
    background: #2d2d45;
    color: #fff;
    padding: 12px 16px;
    border-radius: 18px 18px 18px 6px;
    max-width: 55%;
  }

  .sended {
    justify-content: flex-end;
  }
  .sended .content {
    background: #7c3aed;
    color: white;
    padding: 12px 16px;
    border-radius: 18px 18px 6px 18px;
    max-width: 55%;
  }

  .deleted {
    opacity: 0.55;
    font-style: italic;
  }

  img,
  video {
    max-width: 240px;
    border-radius: 12px;
    margin-top: 6px;
  }

  .zoomable-image {
    cursor: zoom-in;
  }

  .download-btn {
    background: linear-gradient(135deg, #0095ff, #05d7ff);
    padding: 6px 13px;
    border-radius: 12px;
    font-weight: 600;
    color: white;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    transition: 0.2s;
  }
  .download-btn:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #0079d7, #02bad7);
  }
`;
