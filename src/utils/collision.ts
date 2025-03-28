import { Position } from "../types";

/**
 * Check if two circles are colliding
 */
export const circleCollision = (
  p1: Position,
  r1: number,
  p2: Position,
  r2: number
): boolean => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < r1 + r2;
};

/**
 * Check if a point is inside a circle
 */
export const pointInCircle = (
  point: Position,
  circle: Position,
  radius: number
): boolean => {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < radius;
};

/**
 * Check if a point is inside a rectangle
 */
export const pointInRect = (
  point: Position,
  rectPos: Position,
  width: number,
  height: number
): boolean => {
  return (
    point.x >= rectPos.x &&
    point.x <= rectPos.x + width &&
    point.y >= rectPos.y &&
    point.y <= rectPos.y + height
  );
};

/**
 * Check if two rectangles are colliding
 */
export const rectCollision = (
  r1Pos: Position,
  r1Width: number,
  r1Height: number,
  r2Pos: Position,
  r2Width: number,
  r2Height: number
): boolean => {
  return (
    r1Pos.x < r2Pos.x + r2Width &&
    r1Pos.x + r1Width > r2Pos.x &&
    r1Pos.y < r2Pos.y + r2Height &&
    r1Pos.y + r1Height > r2Pos.y
  );
};

/**
 * Check if a circle and rectangle are colliding
 */
export const circleRectCollision = (
  circlePos: Position,
  radius: number,
  rectPos: Position,
  width: number,
  height: number
): boolean => {
  // Find the closest point to the circle within the rectangle
  const closestX = Math.max(
    rectPos.x,
    Math.min(circlePos.x, rectPos.x + width)
  );
  const closestY = Math.max(
    rectPos.y,
    Math.min(circlePos.y, rectPos.y + height)
  );

  // Calculate the distance between the circle's center and this closest point
  const dx = circlePos.x - closestX;
  const dy = circlePos.y - closestY;

  // If the distance is less than the circle's radius, an intersection occurs
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < radius;
};

/**
 * Calculate the penetration depth of a circle collision
 */
export const getPenetrationDepth = (
  p1: Position,
  r1: number,
  p2: Position,
  r2: number
): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return r1 + r2 - distance;
};

/**
 * Get the penetration vector of a circle collision
 */
export const getPenetrationVector = (
  p1: Position,
  r1: number,
  p2: Position,
  r2: number
): Position => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    return { x: 1, y: 0 }; // Arbitrary direction if centers are the same
  }

  const penetrationDepth = r1 + r2 - distance;
  return {
    x: (dx / distance) * penetrationDepth,
    y: (dy / distance) * penetrationDepth,
  };
};

/**
 * Check if a line segment intersects with a circle
 */
export const lineCircleIntersection = (
  lineStart: Position,
  lineEnd: Position,
  circlePos: Position,
  radius: number
): boolean => {
  // Calculate the line segment's length and direction
  const lineVector = {
    x: lineEnd.x - lineStart.x,
    y: lineEnd.y - lineStart.y,
  };

  const lineLengthSquared =
    lineVector.x * lineVector.x + lineVector.y * lineVector.y;

  // Calculate the closest point on the line to the circle center
  const t = Math.max(
    0,
    Math.min(
      1,
      ((circlePos.x - lineStart.x) * lineVector.x +
        (circlePos.y - lineStart.y) * lineVector.y) /
        lineLengthSquared
    )
  );

  const closestPoint = {
    x: lineStart.x + lineVector.x * t,
    y: lineStart.y + lineVector.y * t,
  };

  // Check if the closest point is within the circle's radius
  return pointInCircle(closestPoint, circlePos, radius);
};

/**
 * Check if there's a clear line of sight between two points
 * @param start Starting position
 * @param end End position
 * @param walls Array of wall positions (each with 4 corner positions)
 * @returns boolean indicating if there's a clear line of sight
 */
export function lineOfSight(
  start: Position,
  end: Position,
  walls: Position[][]
): boolean {
  // For each wall, check if the line intersects with any of its edges
  for (const wall of walls) {
    // Skip if wall is not a quadrilateral (should have 4 vertices)
    if (wall.length < 4) continue;

    // Check intersection with each edge of the wall
    for (let i = 0; i < wall.length; i++) {
      const nextIndex = (i + 1) % wall.length;
      const edge1 = wall[i];
      const edge2 = wall[nextIndex];

      // Check if the line from start to end intersects with this wall edge
      if (lineIntersectsLine(start, end, edge1, edge2)) {
        return false; // Wall is blocking line of sight
      }
    }
  }

  return true; // No walls blocking line of sight
}

/**
 * Check if two line segments intersect
 * @param a1 Start point of first line
 * @param a2 End point of first line
 * @param b1 Start point of second line
 * @param b2 End point of second line
 * @returns boolean indicating if the lines intersect
 */
function lineIntersectsLine(
  a1: Position,
  a2: Position,
  b1: Position,
  b2: Position
): boolean {
  // Calculate the direction vectors
  const va = { x: a2.x - a1.x, y: a2.y - a1.y };
  const vb = { x: b2.x - b1.x, y: b2.y - b1.y };

  // Calculate the cross product of the direction vectors
  const denominator = va.x * vb.y - va.y * vb.x;

  // If the lines are parallel, they don't intersect
  if (Math.abs(denominator) < 1e-8) {
    return false;
  }

  // Calculate the vectors from a1 to b1
  const v1 = { x: b1.x - a1.x, y: b1.y - a1.y };

  // Calculate the parameters t and s for the parametric equations
  const s = (v1.x * vb.y - v1.y * vb.x) / denominator;
  const t = (v1.x * va.y - v1.y * va.x) / denominator;

  // Check if the intersection point is within both line segments
  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}
