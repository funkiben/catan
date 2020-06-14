import {Map} from "immutable";
import {GameState} from "./gameState";
import {
  Board,
  DevelopmentCard,
  Edge,
  HexCoords,
  Intersection, makeObservablePlayerState,
  ObservablePlayerState,
  PlayerColor,
  ResourceCards,
  RollNumber
} from "..";

interface ObservableGameStateData {
  readonly board: Board;
  readonly currentTurnColor: PlayerColor;
  readonly lastRoll?: RollNumber,
  readonly resourceCardSupply: ResourceCards,
  readonly developmentCardSupplyCount: number,
  readonly largestArmyCardOwner?: PlayerColor,
  readonly longestRoadCardOwner?: PlayerColor,
  readonly playerStates: Map<PlayerColor, ObservablePlayerState>
}

export interface ObservableGameState extends ObservableGameStateData {
  buildInitialRoadAndSettlement(color: PlayerColor, settlement: Intersection, road: Edge): this;

  buildRoad(color: PlayerColor, edge: Edge): this,

  buildSettlement(color: PlayerColor, intersection: Intersection): this,

  moveRobber(coords: HexCoords): this

  buildCity(color: PlayerColor, intersection: Intersection): this,

  giveResourceCardsFromSupply(color: PlayerColor, cards: ResourceCards): this,

  giveDevelopmentCard(color: PlayerColor, card: DevelopmentCard): this,

  removePlayer(color: PlayerColor): this;

  nextTurn(): this;
}

export function makeObservableGameState(state: GameState): ObservableGameState {
  const {
    board, playerStates, resourceCardSupply, currentTurnColor, developmentCardSupply, dice,
    largestArmyCardOwner, longestRoadCardOwner
  } = state;


  function wrapObservable<F extends (...args: any) => GameState, P extends Parameters<F>>(fn: F): (...args: P) => ObservableGameState {
    return (...args) => makeObservableGameState(fn(args));
  }
  
  return {
    board,
    currentTurnColor,
    largestArmyCardOwner,
    lastRoll: dice.lastRoll,
    longestRoadCardOwner,
    playerStates: playerStates.map(makeObservablePlayerState),
    developmentCardSupplyCount: developmentCardSupply.size,
    resourceCardSupply,
    buildInitialRoadAndSettlement: wrapObservable(state.buildInitialRoadAndSettlement),
    buildRoad: wrapObservable(state.buildRoad),
    buildSettlement: wrapObservable(state.buildSettlement),
    buildCity: wrapObservable(state.buildCity),
    giveDevelopmentCard: wrapObservable(state.giveDevelopmentCard),
    giveResourceCardsFromSupply: wrapObservable(state.giveResourceCardsFromSupply),
    moveRobber: wrapObservable(state.moveRobber),
    removePlayer: wrapObservable(state.removePlayer),
    nextTurn: wrapObservable(state.nextTurn)
  };
}