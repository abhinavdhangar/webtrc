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
import "../components/styles/webcam.css";
export default function WebCam({
  localVideoRef,
  remoteVideoRef,
  endCall,
  myName,
}) {
  const [colorMode] = useColorMode();
  const [colorStyle] = useColorStyle({ colorMode });

  return (
    <div className={myName ? "" : "hidden"}>
      <Flex columnGap="4x" mb="4x">
        <button onClick={endCall}>end call</button>
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
            <Box as="video" ref={localVideoRef} muted autoPlay width={360} />
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
    </div>
  );
}
