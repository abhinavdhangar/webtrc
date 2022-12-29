import { Box } from '@tonic-ui/react';
import React, { useState } from 'react';

const CopyTrigger = ({ children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 500);
  };

  return <Box {...props}>{typeof children === 'function' ? children({ copied, copy }) : children}</Box>;
};

export default CopyTrigger;
