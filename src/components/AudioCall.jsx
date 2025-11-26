// components/AudioCall.jsx
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { IoCallSharp } from "react-icons/io5";

export default function AudioCall({ socket, currentUser, remoteUser, onEnd }) {
  const [timer, setTimer] = useState(0);
  const audioRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();
  const intervalRef = useRef();

  useEffect(() => {
    startTimer();
    initCall();
    return () => endCall(true);
    // eslint-disable-next-line
  }, []);

  /** ⏱ Timer */
  const startTimer = () => {
    intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };

  /** 🎧 WebRTC Setup */
  const initCall = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = localStream;

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

    peerRef.current = peer;

    // Send our mic stream
    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

    // Play remote audio when received
    peer.ontrack = (event) => {
      audioRef.current.srcObject = event.streams[0];
    };

    // Send ICE candidates to other peer
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("ice-candidate", {
          to: remoteUser._id,
          candidate: event.candidate,
        });
      }
    };

    /** CALLER → send offer */
    if (currentUser.isCaller) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.current.emit("send-offer", { to: remoteUser._id, offer });
    }

    /** RECEIVER → get offer → send answer */
    socket.current.on("receive-offer", async ({ offer }) => {
      if (currentUser.isCaller) return;
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.current.emit("send-answer", { to: remoteUser._id, answer });
    });

    /** CALLER → get answer */
    socket.current.on("receive-answer", async ({ answer }) => {
      if (!currentUser.isCaller) return;
      await peer.setRemoteDescription(answer);
    });

    /** ICE candidates exchange */
    socket.current.on("receive-ice-candidate", async ({ candidate }) => {
      if (candidate) await peer.addIceCandidate(candidate);
    });

    /** End call */
    socket.current.on("end-call", () => endCall());
  };

  /** 🔴 End Call */
  const endCall = (closing = false) => {
    clearInterval(intervalRef.current);

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();

    if (!closing) {
      socket.current.emit("end-call", { to: remoteUser._id });
    }

    onEnd();
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
          <IoCallSharp style={{ transform: "rotate(135deg)", marginRight: 8 }} />
          End Call
        </button>
      </CallBox>
    </Overlay>
  );
}

/* 🎨 Styling */
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

  .user {
    font-size: 1.25rem;
    opacity: 0.92;
  }
  .timer {
    margin-top: 10px;
    font-size: 1.45rem;
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
