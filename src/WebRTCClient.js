import {
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  Text,
  Textarea,
  useColorMode,
  useColorStyle,
} from "@tonic-ui/react";
import WebCam from "./components/WebCam";
import ReactPlayer from "react-player";
import { useConst } from "@tonic-ui/react-hooks";
import { useEffect, useReducer, useRef, useState } from "react";
import CopyTrigger from "./CopyTrigger";
import io from "socket.io-client";
import NameForm from "./components/NameForm";
const x = (...args) => JSON.stringify(...args);

const WebRTCClient = () => {
  const [colorMode] = useColorMode();
  const [colorStyle] = useColorStyle({ colorMode });
  const [sessionDescriptionProtocol, setSessionDescriptionProtocol] =
    useState();
    const [myID,setMyID] = useState('')
  const [remoteSessionDescriptionText, setRemoteSessionDescriptionText] =
    useState("");
  const [remoteICECandidateText, setRemoteICECandidateText] = useState("");
  const [remoteSessionDescription, setRemoteSessionDescription] =
    useState(null);
  const [remoteICECandidate, setRemoteICECandidate] = useState(null);
  const [otherUserID, setOtherUserID] = useState("");
  const localVideoRef = useRef();
  const [isUserCallingButtonDisabled,setIsUserCallingButtonDisabled] = useState(false)
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();
  const [myName, setMyName] = useState("");
  const [isCallSender, setIsCallSender] = useState(false);
  const [users, setUsers] = useState([]);
  const [rtcICECandidateMap, setrtcICECandidateMap] = useState(() => new Map());
  // const rtcICECandidateMap = useConst(() => new Map());
  const forceUpdate = useReducer(() => ({}))[1];
  const [iceError, setIceError] = useState(false);
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    const socketIo = io("https://vgint7-3004.preview.csb.app/");
    setSocket(socketIo);
    return () => {
      socketIo.disconnect();
    };
  }, []);

  const getUserMedia = async () => {
    const constraints = {
      audio: true,
      video: true,
    };

    try {
      const peerConnection = new RTCPeerConnection({
        // https://ithelp.ithome.com.tw/articles/10252371
        iceServers: [
          {
            url: "stun:stun.l.google.com:19302",
          },
          /*
          {
            url: 'turn:turnserver.com',
            username: 'user',
            credential: 'pass',
          },
          */
        ],
      });
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      localVideoRef.current.srcObject = mediaStream;

      mediaStream.getTracks().forEach((mediaStreamTrack) => {
        console.log("MediaStreamTrack:", mediaStreamTrack);
        peerConnection.addTrack(mediaStreamTrack, mediaStream);
      });

      peerConnection.onicecandidate = (event) => {
        const candidate = event.candidate;
        let dd = rtcICECandidateMap;
        if (!candidate) {
          return;
        }
        dd.set(candidate.candidate, candidate);
        console.log("adding ice ");
        setIceError(true);
        setrtcICECandidateMap(dd);
        forceUpdate();
      };
      peerConnection.oniceconnectionstatechange = (e) => {
        console.log("peerConnection.oniceconnectionstatechange:", e);
      };
      peerConnection.ontrack = (e) => {
        // received remote video streams
        console.log("peerConnection.ontrack:", e);
        if (Array.isArray(e.streams)) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };

      peerConnectionRef.current = peerConnection;
    } catch (e) {
      console.error("getUserMedia Error:", e);
    }
  };

  const createOffer = async () => {
    try {
      const sdp = await peerConnectionRef.current.createOffer({
        //offerToReceiveAudio: 1, // deprecated
        //offerToReceiveVideo: 1, // deprecated
      });
      setSessionDescriptionProtocol(sdp);
      peerConnectionRef.current.setLocalDescription(sdp);
    } catch (e) {
      console.error(e);
    }
  };

  const createAnswer = async () => {
    try {
      const sdp = await peerConnectionRef.current.createAnswer({});
      setSessionDescriptionProtocol(sdp);
      console.log("creating answer");
      peerConnectionRef.current.setLocalDescription(sdp);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClickCreateOffer = (e) => {
    createOffer();
  };

  const handleClickCreateAnswer = (e) => {
    createAnswer();
  };

  const handleClickSetRemoteSessionDescription = () => {
    const rtcSessionDescription = new RTCSessionDescription(
      remoteSessionDescriptionText
    );
    setRemoteSessionDescription(rtcSessionDescription);
    peerConnectionRef.current.setRemoteDescription(rtcSessionDescription);
  };

  const handleClickAddRemoteICECandidate = () => {
    const rtcICECandidate = new RTCIceCandidate(remoteICECandidateText);
    setRemoteICECandidate(rtcICECandidate);
    peerConnectionRef.current.addIceCandidate(rtcICECandidate);
  };
  const handleUpdateUsers = (users) => {
    setUsers(users);
  };
  useEffect(() => {
    getUserMedia();
  }, []);

  const handleEndCall = () => {
    console.log("ending call ");

    window.location.reload();
  };
  useEffect(() => {
    if (socket) {
      socket.on("answer", ({ answer, candidate }) => {
        console.log("answer is coming !");
        const rtcSessionDescription = new RTCSessionDescription(answer);
        // setRemoteSessionDescription(rtcSessionDescription);
        peerConnectionRef.current.setRemoteDescription(rtcSessionDescription);
        // console.log(answer);

        // console.log(candidate);
        const rtcICECandidate = new RTCIceCandidate(candidate);
        // setRemoteICECandidate(rtcICECandidate);
        peerConnectionRef.current.addIceCandidate(rtcICECandidate);
      });
      socket.on("offer", async ({ offer, candidate, id }) => {
        console.log("offer is coming ");
        setOtherUserID(id);
        const rtcSessionDescription = new RTCSessionDescription(offer);
        
        setRemoteSessionDescription(rtcSessionDescription);
        
        peerConnectionRef.current.setRemoteDescription(rtcSessionDescription);
        // console.log(offer);

        // console.log(candidate);
        const rtcICECandidate = new RTCIceCandidate(candidate);
        setRemoteICECandidate(rtcICECandidate);
        peerConnectionRef.current.addIceCandidate(rtcICECandidate);
        // createAnswer();
        if (!isCallSender) {
          const sdp = await peerConnectionRef.current.createAnswer({});
          setSessionDescriptionProtocol(sdp);
          console.log("creating answer");
          peerConnectionRef.current.setLocalDescription(sdp);
          setIsUserCallingButtonDisabled(true)
        }
      
      });
      socket.on("you",(id)=>{
        setMyID(id)
        console.log("thisi is id",id)
      })
      socket.on("update-users", handleUpdateUsers);
      socket.on("end-call", handleEndCall);
      return () => {
        socket.off("update-users", handleUpdateUsers);

        socket.on("offer", ({ offer, candidate }) => {
          console.log("offer is coming off ");
        });
      };
    }
  }, [socket]);

  useEffect(() => {
    if (
      rtcICECandidateMap.size > 0 &&
      sessionDescriptionProtocol &&
      otherUserID
    ) {
      const rtcICECandidates = Array.from(rtcICECandidateMap.values());
      let candidate = rtcICECandidates[0];
      console.log("hello addIceCandidate");
      // console.log(candidate);
      // console.log(JSON.parse({candidate}))
      socket.emit("offer", sessionDescriptionProtocol, candidate, otherUserID);
    }
  }, [iceError, sessionDescriptionProtocol, otherUserID]);
  // useEffect(() => {
  //   if (remoteSessionDescription && remoteICECandidate && otherUserID) {
  //     console.log("sending answer",otherUserID)
  //     socket.emit(
  //       "answer",
  //       remoteSessionDescription,
  //       remoteICECandidate,
  //       otherUserID
  //     );
  //   }
  // }, [remoteSessionDescription, remoteICECandidate,otherUserID]);

  const createAdvancedOffer = async (id) => {
    try {
      const sdp = await peerConnectionRef.current.createOffer({});
      setSessionDescriptionProtocol(sdp);
      peerConnectionRef.current.setLocalDescription(sdp);
      console.log("making call ");
      setIsUserCallingButtonDisabled(true)
      setOtherUserID(id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (users) {
    }
  }, [users]);

  const canCreateOffer = true;
  const canCreateAnswer = !!remoteSessionDescriptionText;
  const rtcICECandidates = Array.from(rtcICECandidateMap.values());
  const endCall = () => {
    console.log("ending call ");
    setSessionDescriptionProtocol(null);
    setRemoteSessionDescription(null);
    setOtherUserID(null);
    setIsUserCallingButtonDisabled(false)
    setrtcICECandidateMap(() => new Map());
    setRemoteICECandidate(null);
    setIceError(false);
    remoteVideoRef.current.srcObject = null;
    peerConnectionRef.current.close();

    getUserMedia();
    socket.emit("end-call", otherUserID);
  };
  return (
    <Flex direction="column" rowGap="6x" px="6x" py="4x">
      <WebCam
      myName={myName}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        endCall={endCall}
      />
      <div>
        {!myName && (
          <NameForm myName={myName} socket={socket} setMyName={setMyName} />
        )}{" "}
        <div></div>
      </div>
      <Divider />
      <button onClick={() => console.log(myName)}>mc stan</button>

      {myName && (
        <div>
          <p>{users.length-1} users are live !</p>
          {users.map((user) => (
           user.id!=myID && <button disabled={isUserCallingButtonDisabled} className="bg-red-300" onClick={() => createAdvancedOffer(user.id)} key={user.id}>
              {user.name}
            </button>
          ))}
        </div>
      )}
    </Flex>
  );
};

export default WebRTCClient;
