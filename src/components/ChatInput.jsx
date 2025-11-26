import React, { useState } from "react";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import { FaPaperclip } from "react-icons/fa";
import styled from "styled-components";
import Picker from "emoji-picker-react";

export default function ChatInput({ handleSendMsg, handleSendFile }) {
  const [msg, setMsg] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);

  const handleEmojiPickerhideShow = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // ✅ Use (event, emojiObject) — old API
  const handleEmojiClick = (_event, emojiObject) => {
    setMsg((prev) => prev + emojiObject.emoji);
  };

  const sendChat = (event) => {
    event.preventDefault();
    if (msg.trim().length > 0) {
      handleSendMsg(msg);
      setMsg("");
    }
  };

  const sendFile = () => {
    if (file) {
      handleSendFile(file);
      setFile(null);
      const input = document.getElementById("file-input");
      if (input) input.value = "";
    }
  };

  return (
    <Container>
      <div className="button-container">
        <div className="emoji">
          <BsEmojiSmileFill onClick={handleEmojiPickerhideShow} />
          {showEmojiPicker && (
            <div className="emoji-picker">
              <Picker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        <div className="file-upload">
          <label htmlFor="file-input">
            <FaPaperclip />
          </label>
          <input
            id="file-input"
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: "none" }}
          />
        </div>
      </div>

      <form className="input-container" onSubmit={sendChat}>
        <input
          type="text"
          placeholder="type your message here"
          onChange={(e) => setMsg(e.target.value)}
          value={msg}
        />

        {file && (
          <button type="button" className="send-file-btn" onClick={sendFile}>
            SEND FILE
          </button>
        )}

        <button type="submit">
          <IoMdSend />
        </button>
      </form>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 8% 92%;
  background-color: #080420;
  padding: 0 2rem;

  .button-container {
    display: flex;
    gap: 1rem;
    align-items: center;

    .emoji svg {
      font-size: 1.6rem;
      color: #ffff00c8;
      cursor: pointer;
    }

    .emoji-picker {
      position: absolute;
      bottom: 65px;
      left: 20px;
      z-index: 100;
    }

    .file-upload svg {
      font-size: 1.5rem;
      color: #9a86f3;
      cursor: pointer;
    }
  }

  .input-container {
    background-color: #ffffff34;
    border-radius: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.3rem 1rem;

    input {
      flex: 1;
      background: transparent;
      border: none;
      color: white;
      font-size: 1.2rem;
      &:focus {
        outline: none;
      }
    }

    .send-file-btn {
      background: #28c76f;
      border: none;
      color: white;
      border-radius: 1rem;
      padding: 0.3rem 0.8rem;
      cursor: pointer;
      font-size: 0.85rem;
      white-space: nowrap;
    }

    button {
      background-color: #9a86f3;
      border: none;
      border-radius: 2rem;
      padding: 0.4rem 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        font-size: 1.7rem;
        color: white;
      }
    }
  }
`;
