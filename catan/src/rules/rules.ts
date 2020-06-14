import {
  DiscardHalfOfResourceCardsAction,
  DomesticTradeAction,
  InitialTurnAction,
  MoveRobberAction,
  PlayerColor,
  TurnAction,
  TurnInfo
} from "..";

/**
 * Interface for checking player action validity, calculating player scores, and determining when a player has won.
 */
export interface Rules {
  isInitialTurnActionValid(color: PlayerColor, info: TurnInfo, action: InitialTurnAction): boolean;

  isTurnActionValid(color: PlayerColor, info: TurnInfo, action: TurnAction): boolean;

  isMoveRobberActionValid(color: PlayerColor, info: TurnInfo, action: MoveRobberAction): boolean;

  isDiscardHalfOfResourceCardsActionValid(color: PlayerColor, info: TurnInfo, action: DiscardHalfOfResourceCardsAction): boolean;

  canAcceptTrade(color: PlayerColor, info: TurnInfo, action: DomesticTradeAction): boolean;

  getVictoryPoints(color: PlayerColor, info: TurnInfo): number;

  hasWon(color: PlayerColor, info: TurnInfo): boolean;
}