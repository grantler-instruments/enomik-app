import { useTheme } from '@mui/material/styles';

interface LogoProps {
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ width = 64, height = 64 }) => {
  const theme = useTheme();
  const mainColor = theme.palette.primary.main;

  // Calculate equilateral triangle positions
  const centerX = 150;
  const centerY = 130;
  const sideLength = 120;
  const height_triangle = (Math.sqrt(3) / 2) * sideLength;

  interface Circle {
    cx: number;
    cy: number;
    r: number;
  }

  // Circle definitions - equilateral triangle
  // Top vertex is at 2/3 of height above center
  // Bottom vertices are at 1/3 of height below center
  const circles: Record<string, Circle> = {
    top: { 
      cx: centerX, 
      cy: centerY - (2 * height_triangle / 3), 
      r: 30 
    },
    bottomLeft: { 
      cx: centerX - sideLength / 2, 
      cy: centerY + (height_triangle / 3), 
      r: 30 
    },
    bottomRight: { 
      cx: centerX + sideLength / 2, 
      cy: centerY + (height_triangle / 3), 
      r: 30 
    }
  };

  const gap = 5; // Gap before circle edge
  const circleStrokeWidth = 4
  const lineStrokeWidth = 3
  const dotRadious = 4

  // Debug: Let's verify the distances
  const distance1 = Math.sqrt(
    Math.pow(circles.bottomLeft.cx - circles.top.cx, 2) + 
    Math.pow(circles.bottomLeft.cy - circles.top.cy, 2)
  );
  const distance2 = Math.sqrt(
    Math.pow(circles.bottomRight.cx - circles.top.cx, 2) + 
    Math.pow(circles.bottomRight.cy - circles.top.cy, 2)
  );
  const distance3 = Math.sqrt(
    Math.pow(circles.bottomRight.cx - circles.bottomLeft.cx, 2) + 
    Math.pow(circles.bottomRight.cy - circles.bottomLeft.cy, 2)
  );

  console.log('Distances:', { distance1, distance2, distance3 });
  console.log('Expected:', sideLength);

  interface LinePoints {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  // Helper function to calculate line endpoints
  const getLinePoints = (from: Circle, to: Circle, gap: number): LinePoints => {
    const dx = to.cx - from.cx;
    const dy = to.cy - from.cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const unitX = dx / distance;
    const unitY = dy / distance;
    
    const startOffset = from.r + gap;
    const endOffset = to.r + gap;
    
    return {
      x1: from.cx + unitX * startOffset,
      y1: from.cy + unitY * startOffset,
      x2: to.cx - unitX * endOffset,
      y2: to.cy - unitY * endOffset
    };
  };

  const line1 = getLinePoints(circles.top, circles.bottomLeft, gap);
  const line2 = getLinePoints(circles.top, circles.bottomRight, gap);
  const line3 = getLinePoints(circles.bottomLeft, circles.bottomRight, gap);

  interface Dot {
    cx: number;
    cy: number;
    r: number;
  }

  // Helper function to get dot positions relative to circle center
  const getDots = (circle: Circle): Dot[] => {
    return [
      { cx: circle.cx, cy: circle.cy - 16, r: dotRadious },
      { cx: circle.cx - 15, cy: circle.cy - 6, r: dotRadious },
      { cx: circle.cx + 15, cy: circle.cy - 6, r: dotRadious },
      { cx: circle.cx - 10, cy: circle.cy + 12, r: dotRadious },
      { cx: circle.cx + 10, cy: circle.cy + 12, r: dotRadious }
    ];
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 260"
      width={width}
      height={height}
    >
      {/* Top circle */}
      <circle
        cx={circles.top.cx}
        cy={circles.top.cy}
        r={circles.top.r}
        fill="none"
        stroke={mainColor}
        strokeWidth={circleStrokeWidth}
      />
      <g fill={mainColor}>
        {getDots(circles.top).map((dot, i) => (
          <circle key={`top-${i}`} cx={dot.cx} cy={dot.cy} r={dot.r} />
        ))}
      </g>

      {/* Bottom left circle */}
      <circle
        cx={circles.bottomLeft.cx}
        cy={circles.bottomLeft.cy}
        r={circles.bottomLeft.r}
        fill="none"
        stroke={mainColor}
        strokeWidth={circleStrokeWidth}
      />
      <g fill={mainColor}>
        {getDots(circles.bottomLeft).map((dot, i) => (
          <circle key={`bl-${i}`} cx={dot.cx} cy={dot.cy} r={dot.r} />
        ))}
      </g>

      {/* Bottom right circle */}
      <circle
        cx={circles.bottomRight.cx}
        cy={circles.bottomRight.cy}
        r={circles.bottomRight.r}
        fill="none"
        stroke={mainColor}
        strokeWidth={circleStrokeWidth}
      />
      <g fill={mainColor}>
        {getDots(circles.bottomRight).map((dot, i) => (
          <circle key={`br-${i}`} cx={dot.cx} cy={dot.cy} r={dot.r} />
        ))}
      </g>

      {/* Connecting lines */}
      <line
        x1={line1.x1}
        y1={line1.y1}
        x2={line1.x2}
        y2={line1.y2}
        stroke={mainColor}
        strokeWidth={lineStrokeWidth}
        strokeDasharray="10 10"
      />
      <line
        x1={line2.x1}
        y1={line2.y1}
        x2={line2.x2}
        y2={line2.y2}
        stroke={mainColor}
        strokeWidth={lineStrokeWidth}
        strokeDasharray="10 10"
      />
      <line
        x1={line3.x1}
        y1={line3.y1}
        x2={line3.x2}
        y2={line3.y2}
        stroke={mainColor}
        strokeWidth={lineStrokeWidth}
        strokeDasharray="12 12"
      />
    </svg>
  );
};

export default Logo;