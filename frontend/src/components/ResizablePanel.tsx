import React, { useState } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface ResizablePanelProps {
  children: React.ReactNode;
  width: number;
  height: number;
  minConstraints: [number, number];
  maxConstraints: [number, number];
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  width,
  height,
  minConstraints,
  maxConstraints,
}) => {
  const [size, setSize] = useState({ width, height });

  const onResize = (event: React.SyntheticEvent, { size }: { size: { width: number; height: number } }) => {
    setSize(size);
  };

  return (
    <ResizableBox
      width={size.width}
      height={size.height}
      onResize={onResize}
      minConstraints={minConstraints}
      maxConstraints={maxConstraints}
      handle={<div className="custom-handle" />}
    >
      {children}
    </ResizableBox>
  );
};

export default ResizablePanel;