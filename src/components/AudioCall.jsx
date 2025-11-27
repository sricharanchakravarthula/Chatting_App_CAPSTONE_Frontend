// components/AudioCall.jsx
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { IoCallSharp } from "react-icons/io5";

export default function AudioCall({ socket, currentUser, remoteUser, onEnd }) {
  const [timer, setTimer] = useState(0);
  const audioRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    startTimer();
    initCall();

    return () => endCall(true); // Cleanup on unmount
  }, []);

  /** ⏳ Start call timer */
  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
  };

  /** 🔊 Initialize WebRTC Call */
  const initCall = async () => {
    const local = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = local;

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    });

    local.getTracks().forEach((track) => peer.addTrack(track, local));

    peer.ontrack = (e) => {
      audioRef.current.srcObject = e.streams[0];
    };

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.current.emit("ice-candidate", {
          to: remoteUser._id,
          candidate: e.candidate,
        });
      }
    };

    peerRef.current = peer;

    // OFFER sender
    if (currentUser.isCaller) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.current.emit("send-offer", { to: remoteUser._id, offer });
    }

    // OFFER receiver
    socket.current.off("receive-offer");
    socket.current.on("receive-offer", async ({ offer }) => {
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.current.emit("send-answer", { to: remoteUser._id, answer });
    });

    // ANSWER receiver
    socket.current.off("receive-answer");
    socket.current.on("receive-answer", async ({ answer }) => {
      await peer.setRemoteDescription(answer);
    });

    // ICE receiver
    socket.current.off("receive-ice-candidate");
    socket.current.on("receive-ice-candidate", async ({ candidate }) => {
      if (candidate) await peer.addIceCandidate(candidate);
    });

    // END call receiver
    socket.current.off("end-call");
    socket.current.on("end-call", () => endCall());
  };

  /** 🔴 End Call */
  const endCall = (closing = false) => {
    clearInterval(intervalRef.current);

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();

    if (!closing) {
      socket.current.emit("end-call", { to: remoteUser._id });
    }

    onEnd(); // Notify Chat.jsx
  };

  return (
    <Overlay>
      <CallBox>
        <h2>🔊 Audio Call</h2>
        <p className="user">{remoteUser.username}</p>

        <p className="timer">
          {String(Math.floor(timer / 60)).padStart(2, "0")}:
          {String(timer % 60).padStart(2, "0")}
        </p>

        <audio ref={audioRef} autoPlay></audio>

        <button className="end" onClick={endCall}>
          <IoCallSharp style={{ transform: "rotate(135deg)", marginRight: "8px" }} />
          End Call
        </button>
      </CallBox>
    </Overlay>
  );
}

/* 🎨 UI Styling */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(5, 5, 5, 0.65);
  backdrop-filter: blur(7px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
`;

const CallBox = styled.div`
  width: 360px;
  background: rgba(35, 35, 60, 0.55);
  border: 1px solid rgba(150, 130, 255, 0.45);
  border-radius: 22px;
  padding: 1.9rem;
  text-align: center;
  color: white;
  box-shadow: 0 0 22px rgba(120, 98, 255, 0.26);

  h2 {
    margin-bottom: 4px;
  }
  .user {
    font-size: 1.25rem;
    opacity: 0.92;
  }
  .timer {
    margin-top: 10px;
    font-size: 1.45rem;
    letter-spacing: 1px;
  }
  .end {
    margin-top: 26px;
    width: 100%;
    padding: 13px;
    border-radius: 12px;
    font-size: 1.15rem;
    background: #ff2f59;
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .end:hover {
    background: #ff466d;
  }
`;
