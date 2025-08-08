import React from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  container?: Element;
}

const Portal: React.FC<PortalProps> = ({ children, container }) => {
  const portalRoot = container || document.body;
  return createPortal(children, portalRoot);
};

export default Portal;