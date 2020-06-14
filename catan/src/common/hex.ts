import {List} from "immutable";

/**
 * The 6 edges of a hexagon oriented flat.
 */
export type HexEdge = 'TOP' | 'TOPLEFT' | 'TOPRIGHT' | 'BOTTOMLEFT' | 'BOTTOMRIGHT' | 'BOTTOM';

/**
 * The 6 vertices on a hexagon oriented flat.
 */
export type HexVertex = 'RIGHT' | 'TOPLEFT' | 'TOPRIGHT' | 'BOTTOMLEFT' | 'BOTTOMRIGHT' | 'LEFT';

// https://www.redblobgames.com/grids/hexagons/
export interface HexCoords {
  readonly q: number;
  readonly r: number;

  equals(other: HexCoords): boolean;
}

export interface Edge {
  adjacentHexCoords(): [HexCoords, HexCoords];

  intersections(): [Intersection, Intersection];

  isIntersectionAdjacent(intersection: Intersection): boolean;

  isHexAdjacent(coords: HexCoords): boolean;

  equals(edge: Edge): boolean;
}

export interface Intersection {
  adjacentHexCoords(): [HexCoords, HexCoords, HexCoords];

  edges(): [Edge, Edge, Edge];

  isEdgeAdjacent(edge: Edge): boolean;

  isHexAdjacent(coords: HexCoords): boolean;

  equals(intersection: Intersection): boolean;
}


export function makeHexCoords(q: number, r: number): HexCoords {
  return {
    q, r,
    equals: other => other.q === q && other.r === r
  };
}

export function makeEdge(q: number, r: number, hexEdge: HexEdge): Edge {
  const adjacentHexCoords: [HexCoords, HexCoords] = [
    makeHexCoords(q, r),
    getAdjacentHexCoords(q, r, hexEdge)
  ];

  let intersections: [Intersection, Intersection];

  function getIntersections(): [Intersection, Intersection] {
    if (intersections) {
      return intersections;
    }
    const [v0, v1] = getAdjacentHexVertices(hexEdge);
    return intersections = [makeIntersection(q, r, v0), makeIntersection(q, r, v1)];
  }

  return {
    adjacentHexCoords: () => adjacentHexCoords,
    intersections: getIntersections,
    isIntersectionAdjacent: intersection => getIntersections().some(i => i.equals(intersection)),
    isHexAdjacent: coord => adjacentHexCoords.some(c => c.equals(coord)),
    equals: other => {
      const [a0, a1] = adjacentHexCoords;
      const [b0, b1] = other.adjacentHexCoords();
      return (a0.equals(b0) && a1.equals(b1)) || (a0.equals(b1) && a1.equals(b0));
    }
  };
}

export function makeIntersection(q: number, r: number, hexVertex: HexVertex): Intersection {
  const [hexEdge1, hexEdge2] = getAdjacentHexEdges(hexVertex);

  const adjacentHexCoords: [HexCoords, HexCoords, HexCoords] = [
    makeHexCoords(q, r),
    getAdjacentHexCoords(q, r, hexEdge1),
    getAdjacentHexCoords(q, r, hexEdge2)
  ];

  let edges: [Edge, Edge, Edge];

  function getEdges(): [Edge, Edge, Edge] {
    return edges ? edges : (edges = [
      makeEdge(q, r, hexEdge1),
      makeEdge(q, r, hexEdge2),
      getEdgeBetween(adjacentHexCoords[1], adjacentHexCoords[2])
    ]);
  }

  return {
    adjacentHexCoords: () => adjacentHexCoords,
    edges: getEdges,
    isEdgeAdjacent: edge => getEdges().some(e => edge.equals(e)),
    isHexAdjacent: coord => adjacentHexCoords.some(c => c.equals(coord)),
    equals: other => {
      const otherAdjacentCoords = other.adjacentHexCoords();
      return adjacentHexCoords.every(a => !!otherAdjacentCoords.find(b => a.equals(b)))
    }
  };
}

function getAdjacentHexCoords(q: number, r: number, edge: HexEdge): HexCoords {
  if (edge === 'TOP') {
    r++;
  } else if (edge === 'TOPLEFT') {
    q--;
  } else if (edge === 'TOPRIGHT') {
    q++;
    r--;
  } else if (edge === 'BOTTOMLEFT') {
    q--;
    r++;
  } else if (edge === 'BOTTOMRIGHT') {
    q++;
  } else if (edge === 'BOTTOM') {
    r--;
  }
  return makeHexCoords(q, r);
}

function getAdjacentHexVertices(edge: HexEdge): [HexVertex, HexVertex] {
  if (edge === 'TOP') {
    return ['TOPLEFT', 'TOPRIGHT'];
  } else if (edge === 'TOPLEFT') {
    return ['TOPLEFT', 'LEFT'];
  } else if (edge === 'TOPRIGHT') {
    return ['TOPRIGHT', 'RIGHT'];
  } else if (edge === 'BOTTOMLEFT') {
    return ['LEFT', 'BOTTOMLEFT'];
  } else if (edge === 'BOTTOMRIGHT') {
    return ['RIGHT', 'BOTTOMRIGHT'];
  } else {
    return ['BOTTOMLEFT', 'BOTTOMRIGHT'];
  }
}

function getAdjacentHexEdges(vertex: HexVertex): [HexEdge, HexEdge] {
  if (vertex === 'LEFT') {
    return ['TOPLEFT', 'BOTTOMLEFT'];
  } else if (vertex === 'TOPLEFT') {
    return ['TOPLEFT', 'TOP'];
  } else if (vertex === 'TOPRIGHT') {
    return ['TOPRIGHT', 'TOP'];
  } else if (vertex === 'BOTTOMLEFT') {
    return ['BOTTOM', 'BOTTOMLEFT'];
  } else if (vertex === 'BOTTOMRIGHT') {
    return ['BOTTOM', 'BOTTOMRIGHT'];
  } else {
    return ['TOPRIGHT', 'BOTTOMRIGHT'];
  }
}

function getEdgeBetween(a: HexCoords, b: HexCoords): Edge {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  if (dq == 0) {
    if (dr == -1) {
      return makeEdge(a.q, a.r, "BOTTOM");
    } else {
      return makeEdge(a.q, a.r, "TOP");
    }
  } else if (dr == 0) {
    if (dq == -1) {
      return makeEdge(a.q, a.r, "BOTTOMRIGHT");
    } else {
      return makeEdge(a.q, a.r, "TOPLEFT");
    }
  } else {
    if (dr == -1) {
      return makeEdge(a.q, a.r, "BOTTOMLEFT");
    } else {
      return makeEdge(a.q, a.r, "TOPRIGHT");
    }
  }
}

export function getLongestPath(edges: List<Edge>): number {
  let verticesStartedAt = List<Intersection>();
  let max = 0;

  for (const edge of edges) {
    for (const v of edge.intersections().filter(v0 => !verticesStartedAt.find(v0.equals))) {
      max = Math.max(max, dfsLongestPath(v, edges));
      verticesStartedAt = verticesStartedAt.push(v);
    }
  }

  return max;
}

function dfsLongestPath(start: Intersection, edges: List<Edge>): number {
  let seen = List<Intersection>();

  function dfs(current: Intersection): number {
    seen = seen.push(current);

    let max = 0;

    const unseenNeighbors: List<Intersection> = current.edges()
    .filter(edge => edges.find(edge.equals))
    .map(e => e.intersections())
    .reduce((l, v) => l.push(v), List())
    .filter(v => v !== current)
    .filter(v => !seen.find(v.equals));

    for (const n of unseenNeighbors) {
      max = Math.max(max, dfs(n) + 1);
    }

    return max;
  }

  return dfs(start);
}

