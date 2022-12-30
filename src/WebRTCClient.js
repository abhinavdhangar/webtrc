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
import ReactPlayer from 'react-player'
import { useConst } from "@tonic-ui/react-hooks";
import { useEffect, useReducer, useRef, useState } from "react";
import CopyTrigger from "./CopyTrigger";
import io from "socket.io-client";

const x = (...args) => JSON.stringify(...args);

const WebRTCClient = () => {
  const [colorMode] = useColorMode();
  const [colorStyle] = useColorStyle({ colorMode });
  const [sessionDescriptionProtocol, setSessionDescriptionProtocol] =
    useState();
  const [remoteSessionDescriptionText, setRemoteSessionDescriptionText] =
    useState("");
  const [remoteICECandidateText, setRemoteICECandidateText] = useState("");
  const [remoteSessionDescription, setRemoteSessionDescription] =
    useState(null);
  const [remoteICECandidate, setRemoteICECandidate] = useState(null);
  const [otherUserID, setOtherUserID] = useState("");
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();
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
    video:true
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
      const sdp = await peerConnectionRef.current.createAnswer({
        //offerToReceiveAudio: 1, // deprecated
        //offerToReceiveVideo: 1, // deprecated
      });
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
          const sdp = await peerConnectionRef.current.createAnswer({});
      setSessionDescriptionProtocol(sdp);
      console.log("creating answer");
      peerConnectionRef.current.setLocalDescription(sdp);
      });
      socket.on("update-users", handleUpdateUsers);

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
const declineCall = ()=>{
setSessionDescriptionProtocol('')
  setRemoteSessionDescription('')
  setrtcICECandidateMap(()=>new Map())
  setRemoteICECandidate('')
setIceError(false)

 peerConnectionRef.current.close()
const peerConnection = new RTCPeerConnection();
 peerConnectionRef.current = peerConnection
}
  return (
    <Flex direction="column" rowGap="6x" px="6x" py="4x">
      <Flex columnGap="4x" mb="4x">
        <button onClick={declineCall}>decline</button>
        <Flex flex="1" direction="column">
          <Box mb="2x">
            <Text>Local Camera</Text>
          </Box>
          <Flex
            background={colorStyle.background.secondary}
            alignItems="center"
            justifyContent="center"
            height="100%"
            p="4x"
          >
            {/* <ReactPlayer width={360} muted playing ref={localVideoRef}/> */}
            <Box as="video" ref={localVideoRef} muted  autoPlay width={360} />
          </Flex>
        </Flex>
        <Flex flex="1" direction="column">
          <Box mb="2x">
            <Text>Remote Camera</Text>
          </Box>
          <Flex
            background={colorStyle.background.secondary}
            alignItems="center"
            justifyContent="center"
            height="100%"
            p="4x"
          >
            {/* <ReactPlayer playing ref={remoteVideoRef}/> */}
            <Box as="video" ref={remoteVideoRef} autoPlay width={360} />
          </Flex>
        </Flex>
      </Flex>
      <Divider />
      <Box>
        <Box mb="4x">
          <Text>Session Description:</Text>
        </Box>
        <Flex columnGap="2x" mb="4x">
          <Button disabled={!canCreateOffer} onClick={handleClickCreateOffer}>
            Create Offer
          </Button>
          <Button disabled={!canCreateAnswer} onClick={handleClickCreateAnswer}>
            Create Answer
          </Button>
          <div>
            {users.map((user) => (
              <button key={user} onClick={() => createAdvancedOffer(user)}>
                {user}
              </button>
            ))}
          </div>
        </Flex>
        <Box mb="4x">
          <Textarea
            value={x(sessionDescriptionProtocol, null, 4)}
            readOnly
            resize="vertical"
            rows="5"
            onFocus={(event) => {
              event.target.select();
            }}
          />
        </Box>
        <Flex direction="column" rowGap="2x">
          {rtcICECandidates.map((candidate) => {
            return (
              <Flex
                key={candidate.candidate}
                backgroundColor={colorStyle.background.secondary}
                _hover={{
                  backgroundColor: colorStyle.background.tertiary,
                }}
                alignItems="center"
              >
                <Box>
                  <CopyTrigger>
                    {({ copied, copy }) => (
                      <Button
                        onClick={() => {
                          const text = x(candidate);
                          navigator.clipboard.writeText(text).then(
                            (success) => console.log("text copied"),
                            (err) => console.log("failed to copy text")
                          );
                          copy();
                        }}
                      >
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    )}
                  </CopyTrigger>
                </Box>
                <Box px="3x">
                  <Text whiteSpace="nowrap">{x(candidate)}</Text>
                </Box>
              </Flex>
            );
          })}
        </Flex>
      </Box>
      <Divider />
      <Box>
        <Box mb="4x">
          <Text>Remote Session Description:</Text>
        </Box>
        <Flex columnGap="2x" mb="4x" alignItems="center">
          <Button
            disabled={!remoteSessionDescriptionText}
            onClick={handleClickSetRemoteSessionDescription}
          >
            Set Remote Session Description
          </Button>
          {remoteSessionDescriptionText && remoteSessionDescription && (
            <Icon icon="check" color="green" />
          )}
        </Flex>
        <Textarea
          resize="vertical"
          rows="5"
          onChange={(event) => {
            try {
              const value = JSON.parse(event.target.value);
              setRemoteSessionDescriptionText(value);
            } catch (err) {
              setRemoteSessionDescriptionText("");
            }
          }}
          onFocus={(event) => {
            event.target.select();
          }}
          placeholder="Paste a remote SDP here"
        />
      </Box>
      <Divider />
      <Box>
        <Text mb="4x">Remote ICE Candidate:</Text>
        <Flex columnGap="2x" mb="4x" alignItems="center">
          <Button
            disabled={!remoteICECandidateText}
            onClick={handleClickAddRemoteICECandidate}
          >
            Add Remote ICE Candidate
          </Button>
          {remoteICECandidateText && remoteICECandidate && (
            <Icon icon="check" color="green" />
          )}
        </Flex>
        <Textarea
          resize="vertical"
          rows="2"
          onChange={(event) => {
            try {
              const value = JSON.parse(event.target.value);
              setRemoteICECandidateText(value);
            } catch (err) {
              setRemoteICECandidateText("");
            }
          }}
          onFocus={(event) => {
            event.target.select();
          }}
          placeholder="Paste a remote candidate here"
        />
      </Box>
    </Flex>
  );
};

export default WebRTCClient;
