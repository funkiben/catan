import {List, Map} from "immutable";
import {Edge, HexCoords, Intersection} from "../common/hex";
import {RollNumber} from "../admin/admin";
import {ResourceCard} from "../common/card";

/**
 * The possible colors of players.
 */
export type PlayerColor = 'WHITE' | 'RED' | 'BLUE' | 'ORANGE';

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

/**
 * A harbor that allows players to exchange resources in exchange for one other resource of their choosing.
 */
export interface Harbor {
  /**
   * The resource card type players can sell at this harbor.
   */
  readonly card: ResourceCard | "ANY";

  /**
   * The number of the specified resource type players must sell at this harbor to get a resource card.
   */
  readonly amount: number;

  /**
   * Checks if the harbor is equal to the other harbor.
   * @param other The other harbor to check equality with.
   */
  equal(other: Harbor): boolean;
}

/**
 * The tiles and harbors on a board.
 */
export interface BoardSetup {
  /**
   * The position of the robber.
   */
  readonly robber: HexCoords;

  /**
   * Gets the type of tile at the given coords, or undefined if there is no tile.
   * @param coords
   */
  getTileType(coords: HexCoords): TileType | undefined;

  /**
   * Gets the harbor at the given edge, or undefined if there is no edge.
   * @param edge
   */
  getHarbor(edge: Edge): Harbor | undefined;

  /**
   * Gets all tiles that are adjacent to tiles with the given roll number.
   * @param roll The roll number to get tiles with.
   */
  getResourceTilesWithRollNumber(roll: RollNumber): List<[HexCoords, ResourceTileType]>;
}

/**
 * A Catan board. Uses axial coords for all coordinates. https://www.redblobgames.com/grids/hexagons/
 * Board and all hexagonal tiles are oriented "flat".
 */
export interface Board extends BoardSetup {
  /**
   * Places the initial settlement and road for the beginning rounds of the game.
   * @param color The color of the settlement and road to place.
   * @param settlement The intersection the settlement is to be placed.
   * @param road The edge the road is to be placed.
   */
  placeInitialSettlementAndRoad(color: PlayerColor, settlement: Intersection, road: Edge): Board;

  /**
   * Places a road of the given color on the specified edge.
   * @param color The color of the road to place.
   * @param edge The edge to place the road.
   */
  placeRoad(color: PlayerColor, edge: Edge): Board;

  /**
   * Places a settlement of the given color on the specified vertex.
   * @param color The color of the settlement to place.
   * @param intersection The intersection to place the settlement.
   */
  placeSettlement(color: PlayerColor, intersection: Intersection): Board;

  /**
   * Upgrades the specified settlement to a city.
   * @param color The color of the city to place. (Must match the color of the existing settlement)
   * @param intersection The intersection of the settlement to upgrade.
   */
  upgradeSettlementToCity(color: PlayerColor, intersection: Intersection): Board;

  /**
   * Moves the robber to the given coordinates.
   * @param coords The coords to move the robber.
   */
  moveRobber(coords: HexCoords): Board;

  /**
   * Counts how many settlements of the given color are on the given tile coordinates.
   * @param color The color of the settlements to look for on the given tile.
   * @param coords The coords of the tile.
   */
  numSettlementsOfColorOnTile(color: PlayerColor, coords: HexCoords): number;

  /**
   * Counts how many cities of the given color are on the given tile coordinates.
   * @param color The color of the cities to look for on the given tile.
   * @param coords The coords of the tile.
   */
  numCitiesOfColorOnTile(color: PlayerColor, coords: HexCoords): number;

  /**
   * Checks if there is a city or settlement of the given color adjacent to the given harbor.
   * @param color The color of city or settlement to check for adjacency.
   * @param harbor The harbor to see if a city or settlement is adjacent to.
   */
  isCityOrSettlementOfColorOnHarbor(color: PlayerColor, harbor: Harbor): boolean;

  /**
   * Gets the number of settlements with the given color on the board.
   * @param color The color of settlements to count.
   */
  numSettlementsOfColor(color: PlayerColor): number;

  /**
   * Gets the number of cities with the given color on the board.
   * @param color The color of cities to count.
   */
  numCitiesOfColor(color: PlayerColor): number;
}

/**
 * Makes a new harbor.
 * @param card The resource card type players can sell at this harbor.
 * @param amount The number of the specified resource type players must sell at this harbor to get a resource card.
 */
export function makeHarbor(card: ResourceCard | "ANY", amount: number): Harbor {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }
  return {card, amount, equal: h => h.card === card && h.amount === amount};
}

/**
 * Makes the setup for a board. This includes the initial position of the robber, tiles, roll numbers on those tiles, and harbors.
 * @param robber The robbers initial position.
 * @param resourceTiles The resource tiles with roll numbers on them.
 * @param nonResourceTiles The non-resource tiles.
 * @param harbors The harbors.
 */
export function makeBoardSetup(robber: HexCoords,
                               resourceTiles: List<[HexCoords, ResourceTileType, RollNumber]>,
                               nonResourceTiles: List<[HexCoords, NonResourceTileType]>,
                               harbors: List<[Edge, Harbor]>): BoardSetup {

  const setup: BoardSetup = {
    robber,
    getTileType: c => {
      const tile = resourceTiles.find(t => t[0].equals(c)) || nonResourceTiles.find(t => t[0].equals(c));
      return tile && tile[1];
    },
    getHarbor: edge => {
      const maybeHarbor = harbors.find(h => h[0].equals(edge));
      return maybeHarbor && maybeHarbor[1];
    },
    getResourceTilesWithRollNumber: roll => resourceTiles.filter(t => t[2] === roll).map(t => [t[0], t[1]])
  };

  const allTileCoords = List([...resourceTiles.map(t => t[0]), ...nonResourceTiles.map(t => t[0])]);
  const harborEdges = harbors.map(h => h[0]);

  if (allTileCoords.some((a, i) => allTileCoords.some((b, j) => i !== j && a.equals(b)))) {
    throw new Error("All resource tiles must be at unique coordinates");
  }

  if (harborEdges.some((a, i) => harborEdges.some((b, j) => i !== j && a.equals(b)))) {
    throw new Error("Harbors can not overlap one another");
  }

  if (harborEdges.some(e => !e.adjacentHexCoords().some(c => setup.getTileType(c) === "OCEAN"))) {
    throw new Error("Harbors must be on coastal edges");
  }

  return setup;
}

/**
 * Creates a new board with the given tiles and roll numbers.
 * @param setup The tiles, harbors, and initial robber position.
 */
export function makeBoard(setup: BoardSetup): Board {
  return makeIntermediateBoard(setup, Map(), Map(), Map(), setup.robber);
}

/**
 * Makes an intermediate board with the given settlements, cities, roads, and robber position.
 * @param setup The initial setup of the board. (The robber position from setup is ignored.)
 * @param settlements The settlements on the board.
 * @param cities The cities on the board.
 * @param roads The roads on the board.
 * @param robber The robber position.
 */
export function makeIntermediateBoard(setup: BoardSetup,
                                      settlements: Map<PlayerColor, List<Intersection>>,
                                      cities: Map<PlayerColor, List<Intersection>>,
                                      roads: Map<PlayerColor, List<Edge>>,
                                      robber: HexCoords): Board {

  function makeBoard(board: {
    settlements?: Map<PlayerColor, List<Intersection>>,
    cities?: Map<PlayerColor, List<Intersection>>,
    roads?: Map<PlayerColor, List<Edge>>,
    robber?: HexCoords
  }): Board {
    return makeIntermediateBoard(setup,
        board.settlements || settlements,
        board.cities || cities,
        board.roads || roads,
        board.robber || robber
    );
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

  function allCityAndSettlementIntersectionsOfColor(color: PlayerColor): List<Intersection> {
    return cities.get(color, List<Intersection>()).concat(settlements.get(color, List()));
  }

  function doesIntersectionHaveBuildableTile(intersection: Intersection): boolean {
    return intersection.adjacentHexCoords().some(c => canBuildOnTile(setup.getTileType(c) || "OCEAN"));
  }

  function doesEdgeHaveBuildableTile(edge: Edge): boolean {
    return edge.adjacentHexCoords().some(c => canBuildOnTile(setup.getTileType(c) || "OCEAN"));
  }

  function isRoadOfColor(edge: Edge, color: PlayerColor): boolean {
    return roads.get(color, List()).some(e => edge.equals(e));
  }

  function isRoad(edge: Edge): boolean {
    return [...roads.keys()].some(color => isRoadOfColor(edge, color));
  }

  function isSettlementOfColor(intersection: Intersection, color: PlayerColor): boolean {
    return settlements.get(color, List()).some(i => intersection.equals(i));
  }

  function isCityOfColor(intersection: Intersection, color: PlayerColor): boolean {
    return cities.get(color, List()).some(i => intersection.equals(i));
  }

  function isCityOrSettlementOfColor(intersection: Intersection, color: PlayerColor): boolean {
    return isSettlementOfColor(intersection, color) || isCityOfColor(intersection, color);
  }

  function isCityOrSettlement(intersection: Intersection): boolean {
    return [...cities.keys(), ...settlements.keys()].some(color => isCityOrSettlementOfColor(intersection, color));
  }

  function canRobberGoOnTile(tile: TileType): boolean {
    return canBuildOnTile(tile) || tile === "DESERT";
  }

  function adjacentIntersectionsEmpty(intersection: Intersection): boolean {
    return intersection.edges().every(e => e.intersections().every(i => !isCityOrSettlement(i)));
  }

  function isRoadConnected(color: PlayerColor, edge: Edge): boolean {
    return edge.intersections().some(i =>
        isCityOrSettlementOfColor(i, color) || i.edges().some(e => isRoadOfColor(e, color)));
  }

  function isSettlementConnected(color: PlayerColor, intersection: Intersection): boolean {
    return intersection.edges().some(e => isRoadOfColor(e, color));
  }

  function verifyEdgeHasBuildableTile(edge: Edge): void {
    if (!doesEdgeHaveBuildableTile(edge)) {
      throw new Error("Road is not on any tile that can be built on");
    }
  }

  function verifyNoRoadExists(edge: Edge): void {
    if (isRoad(edge)) {
      throw new Error("Road already exists on edge");
    }
  }

  function verifyRoadConnected(color: PlayerColor, edge: Edge): void {
    if (!isRoadConnected(color, edge)) {
      throw new Error("Road must be attached to a settlement, city, or another road");
    }
  }

  function verifyIntersectionHasBuildableTile(intersection: Intersection): void {
    if (!doesIntersectionHaveBuildableTile(intersection)) {
      throw new Error("Settlement is not on any tiles that can be built on");
    }
  }

  function verifyNoCityOrSettlementExists(intersection: Intersection): void {
    if (isCityOrSettlement(intersection)) {
      throw new Error("Settlement can't be built on top of existing building");
    }
  }

  function verifyAllAdjacentIntersectionsEmpty(intersection: Intersection): void {
    if (!adjacentIntersectionsEmpty(intersection)) {
      throw new Error("All intersections around settlement must be empty");
    }
  }

  function verifySettlementExists(color: PlayerColor, intersection: Intersection) {
    if (!isSettlementOfColor(intersection, color)) {
      throw new Error("No settlement exists");
    }
  }

  function verifyRoadConnectsToSettlement(edge: Edge, intersection: Intersection) {
    if (!edge.isIntersectionAdjacent(intersection)) {
      throw new Error("Road must be adjacent to newly placed settlement");
    }
  }

  function verifySettlementConnected(color: PlayerColor, intersection: Intersection) {
    if (!isSettlementConnected(color, intersection)) {
      throw new Error("Settlement must be connected to a road");
    }
  }

  function verifyCanMoveRobber(coords: HexCoords) {
    if (robber.equals(coords)) {
      throw new Error("Robber can't be moved to where it already is placed");
    } else {
      const tile = setup.getTileType(robber);
      if (tile === undefined) {
        throw new Error("Robber can't be placed on non-existent tile");
      } else if (!canRobberGoOnTile(tile)) {
        throw new Error("Robber can't go on given tile");
      }
    }
  }

  return {
    placeInitialSettlementAndRoad: (color, settlementIntersection, roadEdge) => {
      verifyRoadConnectsToSettlement(roadEdge, settlementIntersection);
      verifyEdgeHasBuildableTile(roadEdge);
      verifyNoRoadExists(roadEdge);
      verifyIntersectionHasBuildableTile(settlementIntersection);
      verifyNoCityOrSettlementExists(settlementIntersection);
      verifyAllAdjacentIntersectionsEmpty(settlementIntersection);
      return makeBoard({
        roads: roads.update(color, List(), l => l.push(roadEdge)),
        settlements: settlements.update(color, List(), l => l.push(settlementIntersection))
      });
    },
    placeRoad: (color, edge) => {
      verifyNoRoadExists(edge);
      verifyEdgeHasBuildableTile(edge);
      verifyRoadConnected(color, edge);
      return makeBoard({
        roads: roads.update(color, List(), l => l.push(edge))
      });
    },
    placeSettlement: (color, intersection) => {
      verifyIntersectionHasBuildableTile(intersection);
      verifyNoCityOrSettlementExists(intersection);
      verifyAllAdjacentIntersectionsEmpty(intersection);
      verifySettlementConnected(color, intersection);
      return makeBoard({
        settlements: settlements.update(color, List(), l => l.push(intersection))
      });
    },
    upgradeSettlementToCity: (color, intersection) => {
      verifySettlementExists(color, intersection);
      return makeBoard({
        settlements: settlements.update(color, s => s.filter(i => intersection.equals(i))),
        cities: cities.update(color, List(), l => l.push(intersection))
      });
    },
    isCityOrSettlementOfColorOnHarbor: (color, harbor) =>
        allCityAndSettlementIntersectionsOfColor(color)
        .some(i => i.edges().map(setup.getHarbor).filter(h => !!h).map(h => h!).some(h => harbor.equal(h))),
    moveRobber: coords => {
      verifyCanMoveRobber(coords);
      return makeBoard({robber: coords});
    },
    numSettlementsOfColorOnTile: (color, coords) => settlements.get(color, List()).count(i => i.isHexAdjacent(coords)),
    numCitiesOfColorOnTile: (color, coords) => cities.get(color, List()).count(i => i.isHexAdjacent(coords)),
    numSettlementsOfColor: color => settlements.get(color, List()).size,
    numCitiesOfColor: color => cities.get(color, List()).size,
    ...setup,
    robber
  };
}


// TODO...

function getLongestPath(edges: List<Edge>): number {
  let verticesStartedAt = List<Intersection>();
  let max = 0;

  for (const edge of edges) {
    for (const v of edge.intersections().filter(v0 => !verticesStartedAt.some(v1 => v1.equals(v0)))) {
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
    .filter(v => v !== start)
    .filter(v => !seen.find(v.equals));

    for (const n of unseenNeighbors) {
      max = Math.max(max, dfs(n) + 1);
    }

    return max;
  }

  return dfs(start);
}



