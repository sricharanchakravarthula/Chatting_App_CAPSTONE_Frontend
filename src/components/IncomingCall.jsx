import React from "react";
import styled from "styled-components";

export default function IncomingCall({ caller, onAccept, onReject }) {
  return (
    <Container>
      <div className="box">
        <h3>📞 Incoming audio call</h3>
        <p>{caller?.username} is calling...</p>
        <div className="buttons">
          <button className="accept" onClick={onAccept}>Accept</button>
          <button className="reject" onClick={onReject}>Reject</button>
        </div>
      </div>
    </Container>
  );
}

const Container = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;

  .box {
    background: #1e1b3a;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    color: white;
    width: 320px;
  }
  h3 {
    margin-bottom: 0.5rem;
  }
  .buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 1.2rem;
  }
  .accept {
    background: #21c063;
    border: none;
    padding: 8px 18px;
    border-radius: 6px;
    cursor: pointer;
    color: white;
  }
  .reject {
    background: #ff4747;
    border: none;
    padding: 8px 18px;
    border-radius: 6px;
    cursor: pointer;
    color: white;
  }
`;
