import {Map, List} from "immutable";
import {ResourceCard} from "./player/player";

/** // TODO figure out proper place for this type
 * The numbers that can be placed on resource tiles A.K.A. the numbers that can be rolled with 2 6-sided dice.
 */
export type RollNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** // TODO figure out proper place for this type
 * The possible colors of players.
 */
export type PlayerColor = 'WHITE' | 'RED' | 'BLUE' | 'ORANGE';

/**
 * The 6 edges of a hexagon oriented flat.
 */
export type HexEdge = 'TOP' | 'TOPLEFT' | 'TOPRIGHT' | 'BOTTOMLEFT' | 'BOTTOMRIGHT' | 'BOTTOM';

/**
 * The 6 vertices on a hexagon oriented flat.
 */
export type HexVertex = 'RIGHT' | 'TOPLEFT' | 'TOPRIGHT' | 'BOTTOMLEFT' | 'BOTTOMRIGHT' | 'LEFT';

/**
 * The types of tiles with resources.
 */
export type ResourceTileType = 'WOOD' | 'STONE' | 'GOLD' | 'BRICK' | 'WHEAT' | 'SHEEP';

/**
 * The types of tiles that don't have resources.
 */
export type NonResourceTileType = 'OCEAN' | 'DESERT' | 'FOG';

/**
 * All tile types.
 */
export type TileType = NonResourceTileType | ResourceTileType;

/** // TODO figure out proper place for this type
 * A harbor that allows players to exchange resource cards.
 */
export type Harbor = {
  /**
   * The resource cards players can sell at this habor.
   */
  readonly give: ResourceCard;

  /**
   * The number of resource gets players must exchange to buy a resource card.
   */
  readonly amount: number;

  /**
   * The resource players can get at this harbor.
   */
  readonly get: ResourceCard;
}

/**
 * A Catan board. Uses axial coords for all coordinates. https://www.redblobgames.com/grids/hexagons/
 * Board and all hexagonal tiles are oriented "flat".
 * The "r" axis extends top left to bottom right.
 * The "q" axis extends left to right.
 */
export interface Board {
  /**
   * Places a road of the given color on the specified edge.
   * @param color The color of the road to place.
   * @param q The q coord of the tile to place the road.
   * @param r The r coord of the tile to place the road.
   * @param edge The edge of the specified tile at which to place the road.
   */
  placeRoad(color: PlayerColor, q: number, r: number, edge: HexEdge): Board;

  /**
   * Places a settlement of the given color on the specified vertex.
   * @param color The color of the settlement to place.
   * @param q The q coordinate of the tile to place the settlement.
   * @param r The r coordinate of the tile to place the settlement.
   * @param vertex The vertex of the specified tile at which to place the settlement.
   */
  placeSettlement(color: PlayerColor, q: number, r: number, vertex: HexVertex): Board;

  /**
   * Upgrades the specified settlement to a city.
   * @param color The color of the city to place. (Must match the color of the existing settlement)
   * @param q The q coordinate of the tile with the settlement to upgrade.
   * @param r The r coordinate of the tile with the settlement to upgrade.
   * @param vertex The vertex of the specified tile with the settlement to upgrade.
   */
  upgradeSettlementToCity(color: PlayerColor, q: number, r: number, vertex: HexVertex): Board;

  /**
   * Moves the robber to the given coordinates.
   * @param q The q coordinate of the tile to move the robber to.
   * @param r The r coordinate of the tile to move the robber to.
   */
  moveRobber(q: number, r: number): Board;

  /**
   * Gets the harbors the given player color has access to via settlements and cities.
   * @param color The color of player to get harbors for.
   */
  getHarbors(color: PlayerColor): Harbor[];

  /**
   * Calls the given function once on each tile on the board.
   * @param visitor The function to call for each tile.
   */
  forEachTile(visitor: TileVisitor): void;

  /**
   * Calls the given function once for each road with the given color on the board.
   * @param color The color of the roads to call the visitor on.
   * @param visitor The visitor to call for each road of the given color.
   */
  forEachRoad(color: PlayerColor, visitor: EdgeVisitor): void;

  /**
   * Calls the given function once for each city with the given color on the board.
   * @param color The color of the cities to call the visitor on.
   * @param visitor The visitor to call for each city of the given color.
   */
  forEachCity(color: PlayerColor, visitor: IntersectionVisitor): void;

  /**
   * Calls the given function once for each settlement with the given color on the board.
   * @param color The color of the settlements to call the visitor on.
   * @param visitor The visitor to call for each settlement of the given color.
   */
  forEachSettlement(color: PlayerColor, visitor: IntersectionVisitor): void;

  /**
   * Calls the given function on each harbor on the board.
   * @param visitor
   */
  forEachHarbor(visitor: HarborVisitor): void
}

/**
 * Visitor for tiles.
 */
export type TileVisitor = (
    q: number,
    r: number,
    tileType: TileType,
    rollNumber?: RollNumber
) => void;

/**
 * Visitor for edges.
 */
export type EdgeVisitor = (
    q: number,
    r: number,
    edge: HexEdge
) => void;

/**
 * Visitor for intersections.
 */
export type IntersectionVisitor = (
    q: number,
    r: number,
    vertex: HexVertex
) => void;

/**
 * Visitor for harbors. The axial coordinates given to this function will be the coordinates of the ocean tile this
 * harbor is on.
 */
export type HarborVisitor = (
    q: number,
    r: number,
    edge: HexEdge,
    harbor: Harbor
) => void;


/**
 * Creates a new board with the given tiles and roll numbers.
 * @param resourceTiles A list of resource tiles and their associated roll numbers.
 * @param otherTiles A list of tiles that don't have roll numbers.
 * @param harbors The harbors on the board. Each harbor coordinate must be an ocean tile, and the edge must be shared with a land tile.
 * @param robber The initial location of the robber.
 */
export function makeBoard(resourceTiles: [AxialCoords, ResourceTileType, RollNumber][],
                          otherTiles: [AxialCoords, NonResourceTileType][],
                          harbors: [AxialCoords, HexEdge, Harbor][],
                          robber: AxialCoords): Board {

  // TODO verify harbors and tiles and stufff

  return makeBoardInternal(resourceTiles, otherTiles, harbors, Map(), Map(), Map(), robber);
}

function makeBoardInternal(resourceTiles: [AxialCoords, ResourceTileType, RollNumber][],
                           otherTiles: [AxialCoords, NonResourceTileType][],
                           harbors: [AxialCoords, HexEdge, Harbor][],
                           settlements: Map<PlayerColor, List<Intersection>>,
                           cities: Map<PlayerColor, List<Intersection>>,
                           roads: Map<PlayerColor, List<Edge>>,
                           robber: AxialCoords): Board {

  function makeBoard(board: {
    settlements?: Map<PlayerColor, List<Intersection>>,
    cities?: Map<PlayerColor, List<Intersection>>,
    roads?: Map<PlayerColor, List<Edge>>,
    robber?: AxialCoords
  }): Board {
    return makeBoardInternal(resourceTiles, otherTiles, harbors,
        board.settlements || settlements,
        board.cities || cities,
        board.roads || roads,
        board.robber || robber
    );
  }

  function getTileType(coord: AxialCoords): TileType | undefined {
    const tile = resourceTiles.find(t => t[0].equals(coord)) || otherTiles.find(t => t[0].equals(coord));
    return tile && tile[1];
  }

  function canBuildOnTile(type: TileType): boolean {
    return type === "BRICK"
        || type === "STONE"
        || type === "SHEEP"
        || type === "DESERT"
        || type === "GOLD"
        || type === "WHEAT"
        || type === "WOOD";
  }

  function doesIntersectionHaveBuildableTile(intersection: Intersection) {
    return intersection.adjacentHexCoords().some(c => canBuildOnTile(getTileType(c) || "OCEAN"));
  }

  function doesEdgeHaveBuildableTile(edge: Edge) {
    return edge.adjacentHexCoords().some(c => canBuildOnTile(getTileType(c) || "OCEAN"));
  }

  function isRoad(edge: Edge): boolean {
    return [...roads.values()].some(es => es.some(e => edge.equals(e)));
  }

  function isCityOrSettlement(intersection: Intersection): boolean {
    return [...cities.values(), ...settlements.values()].some(is => is.some(i => intersection.equals(i)));
  }

  function canRobberGoOnTile(tile: TileType): boolean {
    return canBuildOnTile(tile) || tile === "DESERT";
  }

  function verifyCanBuildRoad(edge: Edge) {
    if (!doesEdgeHaveBuildableTile(edge)) {
      throw new Error("Road is not on any tile that can be built on");
    } else if (isRoad(edge)) {
      throw new Error("Road already exists on edge");
    }
  }

  function verifyCanBuildSettlement(intersection: Intersection) {
    if (!doesIntersectionHaveBuildableTile(intersection)) {
      throw new Error("Settlement is not on any tiles that can be built on");
    } else if (isCityOrSettlement(intersection)) {
      throw new Error("Settlement can't be built on top of existing building")
    }
  }

  function verifySettlementExists(color: PlayerColor, intersection: Intersection) {
    const colorSettlements = settlements.get(color);
    if (!colorSettlements || !colorSettlements.find(i => intersection.equals(i))) {
      throw new Error("No settlement exists");
    }
  }

  function verifyCanMoveRobber(q: number, r: number) {
    if (robber.q === q && robber.r === r) {
      throw new Error("Robber can't be moved to where it already is placed");
    } else {
      const tile = getTileType(makeAxialCoords(q, r));
      if (tile === undefined) {
        throw new Error("Robber can't be placed on non-existent tile");
      } else if (!canRobberGoOnTile(tile)) {
        throw new Error("Robber can't go on given tile");
      }
    }
  }

  return {
    placeRoad: (color, q, r, hexEdge) => {
      const edge = makeEdge(q, r, hexEdge);
      verifyCanBuildRoad(edge);
      return makeBoard({
        roads: roads.set(color, roads.get(color, List()).push(edge))
      });
    },
    placeSettlement: (color, q, r, vertex) => {
      const intersection = makeIntersection(q, r, vertex);
      verifyCanBuildSettlement(intersection);
      return makeBoard({
        settlements: settlements.set(color, settlements.get(color, List()).push(intersection))
      });
    },
    upgradeSettlementToCity: (color, q, r, vertex) => {
      const intersection = makeIntersection(q, r, vertex);
      verifySettlementExists(color, intersection);
      return makeBoard({
        settlements: settlements.set(color, settlements.get(color)!.filter(i => intersection.equals(i))),
        cities: cities.set(color, cities.get(color, List()).push(intersection))
      });
    },
    getHarbors: color => {
      return harbors
      .filter(h => {
        const edge = makeEdge(h[0].q, h[0].r, h[1]);
        return [
          ...settlements.get(color, List<Intersection>()),
          ...cities.get(color, List<Intersection>())
        ].some(i => i.edges().some(e => e.equals(edge)))
      })
      .map(h => h[2]);
    },
    forEachRoad: (color, visitor) => {
      roads.get(color, List<Edge>()).forEach(e => e.visit(visitor));
    },
    forEachCity: (color, visitor) => {
      cities.get(color, List<Intersection>()).forEach(i => i.visit(visitor));
    },
    forEachSettlement: (color, visitor) => {
      cities.get(color, List<Intersection>()).forEach(i => i.visit(visitor));
    },
    forEachTile: visitor => {
      resourceTiles.forEach(tile => visitor(tile[0].q, tile[0].r, tile[1], tile[2]));
      otherTiles.forEach(tile => visitor(tile[0].q, tile[0].r, tile[1]));
    },
    forEachHarbor: visitor => {
      harbors.forEach(harbor => visitor(harbor[0].q, harbor[0].r, harbor[1], harbor[2]));
    },
    moveRobber: (q, r) => {
      verifyCanMoveRobber(q, r);
      return makeBoard({robber: makeAxialCoords(q, r)});
    }
  };
}


// https://www.redblobgames.com/grids/hexagons/
interface AxialCoords {
  readonly q: number;
  readonly r: number;

  equals(other: AxialCoords): boolean;
}

interface Edge {
  adjacentHexCoords(): [AxialCoords, AxialCoords];

  intersections(): [Intersection, Intersection];

  equals(edge: Edge): boolean;

  visit(visitor: EdgeVisitor): void;
}

interface Intersection {
  adjacentHexCoords(): [AxialCoords, AxialCoords, AxialCoords];

  edges(): [Edge, Edge, Edge];

  equals(intersection: Intersection): boolean;

  visit(visitor: IntersectionVisitor): void;
}


function makeAxialCoords(q: number, r: number): AxialCoords {
  return {
    q, r,
    equals: other => other.q === q && other.r === r
  };
}

function makeEdge(q: number, r: number, hexEdge: HexEdge): Edge {
  const adjacentHexCoords: [AxialCoords, AxialCoords] = [
    makeAxialCoords(q, r),
    getAdjacentHexCoords(q, r, hexEdge)
  ];

  return {
    adjacentHexCoords: () => adjacentHexCoords,
    intersections: () => {
      const [v0, v1] = getAdjacentHexVertices(hexEdge);
      return [makeIntersection(q, r, v0), makeIntersection(q, r, v1)];
    },
    equals: other => {
      const [a0, a1] = adjacentHexCoords;
      const [b0, b1] = other.adjacentHexCoords();
      return (a0.equals(b0) && a1.equals(b1)) || (a0.equals(b1) && a1.equals(b0));
    },
    visit: visitor => visitor(q, r, hexEdge)
  };
}

function makeIntersection(q: number, r: number, hexVertex: HexVertex): Intersection {
  const [hexEdge1, hexEdge2] = getAdjacentHexEdges(hexVertex);

  const adjacentHexCoords: [AxialCoords, AxialCoords, AxialCoords] = [
    makeAxialCoords(q, r),
    getAdjacentHexCoords(q, r, hexEdge1),
    getAdjacentHexCoords(q, r, hexEdge2)
  ];

  return {
    adjacentHexCoords: () => adjacentHexCoords,
    edges: () => [
      makeEdge(q, r, hexEdge1),
      makeEdge(q, r, hexEdge2),
      getEdgeBetween(adjacentHexCoords[1], adjacentHexCoords[2])
    ],
    equals: other => {
      const otherAdjacentCoords = other.adjacentHexCoords();
      return adjacentHexCoords.every(a => !!otherAdjacentCoords.find(b => a.equals(b)))
    },
    visit: visitor => visitor(q, r, hexVertex)
  };
}

function getAdjacentHexCoords(q: number, r: number, edge: HexEdge): AxialCoords {
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
  return makeAxialCoords(q, r);
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

function getEdgeBetween(a: AxialCoords, b: AxialCoords): Edge {
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