import React from 'react';
import { Box, BoxProps } from '@mui/material';

// Box-based replacement for deprecated Grid item
interface GridItemProps extends BoxProps {
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  container?: boolean;
  spacing?: number;
  item?: boolean;
}

export const GridItem: React.FC<GridItemProps> = ({ 
  xs, 
  sm, 
  md, 
  lg, 
  xl,
  container,
  spacing,
  item,
  children, 
  ...props 
}) => {
  // Convert grid sizing to flexbox responsive layout
  const flexBasis = React.useMemo(() => {
    if (typeof xs === 'number') {
      return `${(xs / 12) * 100}%`;
    }
    if (typeof sm === 'number') {
      return `${(sm / 12) * 100}%`;
    }
    if (typeof md === 'number') {
      return `${(md / 12) * 100}%`;
    }
    return 'auto';
  }, [xs, sm, md]);

  const containerStyles = container ? {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: spacing ? `${spacing * 8}px` : 0,
    width: '100%'
  } : {};

  const itemStyles = item || xs || sm || md || lg || xl ? {
    flexBasis,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0
  } : {};

  return (
    <Box 
      sx={{ 
        ...containerStyles, 
        ...itemStyles,
        ...props.sx 
      }} 
      {...props}
    >
      {children}
    </Box>
  );
};

export default GridItem;