import { Box, Button, Divider, Flex, Icon, Text, Textarea, useColorMode, useColorStyle } from '@tonic-ui/react';
import { useConst } from '@tonic-ui/react-hooks';
import { useEffect, useReducer, useRef, useState } from 'react';
import CopyTrigger from './CopyTrigger';

const x = (...args) => JSON.stringify(...args);

const WebRTCClient = () => {
  const [colorMode] = useColorMode();
  const [colorStyle] = useColorStyle({ colorMode });
  const [sessionDescriptionProtocol, setSessionDescriptionProtocol] = useState();
  const [remoteSessionDescriptionText, setRemoteSessionDescriptionText] = useState('');
  const [remoteICECandidateText, setRemoteICECandidateText] = useState('');
  const [remoteSessionDescription, setRemoteSessionDescription] = useState(null);
  const [remoteICECandidate, setRemoteICECandidate] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();
  const rtcICECandidateMap = useConst(() => new Map());
  const forceUpdate = useReducer(() => ({}))[1];

  const getUserMedia = async () => {
    const constraints = {
      audio: false,
      video: true,
    };

    try {
      const peerConnection = new RTCPeerConnection({
        // https://ithelp.ithome.com.tw/articles/10252371
        iceServers: [
          {
            url: 'stun:stun.l.google.com:19302',
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
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      localVideoRef.current.srcObject = mediaStream;

      mediaStream.getTracks().forEach((mediaStreamTrack) => {
        console.log('MediaStreamTrack:', mediaStreamTrack);
        peerConnection.addTrack(mediaStreamTrack, mediaStream);
      });

      peerConnection.onicecandidate = (event) => {
        const candidate = event.candidate;
        if (!candidate) {
          return;
        }
        rtcICECandidateMap.set(candidate.candidate, candidate);
        forceUpdate();
      };
      peerConnection.oniceconnectionstatechange = (e) => {
        console.log('peerConnection.oniceconnectionstatechange:', e);
      };
      peerConnection.ontrack = (e) => {
        // received remote video streams
        console.log('peerConnection.ontrack:', e);
        if (Array.isArray(e.streams)) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };

      peerConnectionRef.current = peerConnection;
    } catch (e) {
      console.error('getUserMedia Error:', e);
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
    const rtcSessionDescription = new RTCSessionDescription(remoteSessionDescriptionText);
    setRemoteSessionDescription(rtcSessionDescription);
    peerConnectionRef.current.setRemoteDescription(rtcSessionDescription);
  };

  const handleClickAddRemoteICECandidate = () => {
    const rtcICECandidate = new RTCIceCandidate(remoteICECandidateText);
    setRemoteICECandidate(rtcICECandidate);
    peerConnectionRef.current.addIceCandidate(rtcICECandidate);
  };

  useEffect(() => {
    getUserMedia();
  }, []);

  const canCreateOffer = true;
  const canCreateAnswer = !!remoteSessionDescriptionText;
  const rtcICECandidates = Array.from(rtcICECandidateMap.values());

  return (
    <Flex direction="column" rowGap="6x" px="6x" py="4x">
      <Flex columnGap="4x" mb="4x">
        <Flex flex="1" direction="column">
          <Box mb="2x">
            <Text>Local Camera</Text>
          </Box>
          <Flex background={colorStyle.background.secondary} alignItems="center" justifyContent="center" height="100%" p="4x">
            <Box as="video" ref={localVideoRef} autoPlay width={360} />
          </Flex>
        </Flex>
        <Flex flex="1" direction="column">
          <Box mb="2x">
            <Text>Remote Camera</Text>
          </Box>
          <Flex background={colorStyle.background.secondary} alignItems="center" justifyContent="center" height="100%" p="4x">
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
                alignItems="center">
                <Box>
                  <CopyTrigger>
                    {({ copied, copy }) => (
                      <Button
                        onClick={() => {
                          const text = x(candidate);
                          navigator.clipboard.writeText(text).then(
                            (success) => console.log('text copied'),
                            (err) => console.log('failed to copy text'),
                          );
                          copy();
                        }}>
                        {copied ? 'Copied' : 'Copy'}
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
          <Button disabled={!remoteSessionDescriptionText} onClick={handleClickSetRemoteSessionDescription}>
            Set Remote Session Description
          </Button>
          {remoteSessionDescriptionText && remoteSessionDescription && <Icon icon="check" color="green" />}
        </Flex>
        <Textarea
          resize="vertical"
          rows="5"
          onChange={(event) => {
            try {
              const value = JSON.parse(event.target.value);
              setRemoteSessionDescriptionText(value);
            } catch (err) {
              setRemoteSessionDescriptionText('');
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
          <Button disabled={!remoteICECandidateText} onClick={handleClickAddRemoteICECandidate}>
            Add Remote ICE Candidate
          </Button>
          {remoteICECandidateText && remoteICECandidate && <Icon icon="check" color="green" />}
        </Flex>
        <Textarea
          resize="vertical"
          rows="2"
          onChange={(event) => {
            try {
              const value = JSON.parse(event.target.value);
              setRemoteICECandidateText(value);
            } catch (err) {
              setRemoteICECandidateText('');
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
