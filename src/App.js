import { Box, TonicProvider, useColorMode, useColorStyle } from '@tonic-ui/react';
import WebRTCClient from './WebRTCClient';

const Layout = (props) => {
  const [colorMode] = useColorMode();
  const [colorStyle] = useColorStyle({ colorMode });
  const backgroundColor = colorStyle.background.primary;
  const color = colorStyle.color.primary;
  const fontSize = 'md';
  const lineHeight = 'md';

  return <Box backgroundColor={backgroundColor} color={color} fontSize={fontSize} lineHeight={lineHeight} {...props} />;
};

export default function App() {
  return (
    <TonicProvider
      colorMode={{
        defaultValue: 'dark',
      }}
      useCSSBaseline={true}>
      <Layout>
        <WebRTCClient />
      </Layout>
    </TonicProvider>
  );
}
