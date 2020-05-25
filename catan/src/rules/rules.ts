import {PlayerColor} from "../board";
import {TurnInfo} from "../player/player";
import {
  BuildCityAction,
  BuildRoadAction,
  BuildSettlementAction,
  BuyDevelopmentCardAction,
  ExchangeCardsAction,
  InitialTurnAction,
  MoveRobberAction,
  PlayMonopolyCard,
  PlayRoadBuildingCard,
  PlayYearOfPlentyCard,
  TradeWithPlayerAction
} from "../player/action";

/**
 * Interface for checking player action validity.
 */
export interface Rules {
  isInitialTurnActionValid(player: PlayerColor, info: TurnInfo, action: InitialTurnAction): boolean;

  isBuildSettlementActionValid(player: PlayerColor, info: TurnInfo, action: BuildSettlementAction): boolean;

  isBuildCityActionValid(player: PlayerColor, info: TurnInfo, action: BuildCityAction): boolean;

  isBuildRoadActionValid(player: PlayerColor, info: TurnInfo, action: BuildRoadAction): boolean;

  isExchangeCardsActionValid(player: PlayerColor, info: TurnInfo, action: ExchangeCardsAction): boolean;

  isTradeWithPlayerActionValid(player: PlayerColor, info: TurnInfo, action: TradeWithPlayerAction): boolean;

  isBuyDevelopmentCardValid(player: PlayerColor, info: TurnInfo, action: BuyDevelopmentCardAction): boolean;

  isMoveRobberActionValid(player: PlayerColor, info: TurnInfo, action: MoveRobberAction): boolean;

  isPlayMonopolyValid(player: PlayerColor, info: TurnInfo, action: PlayMonopolyCard): boolean;

  isPlayRoadBuildingCardValid(player: PlayerColor, info: TurnInfo, action: PlayRoadBuildingCard): boolean;

  isPlayYearOfPlentyCardValid(player: PlayerColor, info: TurnInfo, action: PlayYearOfPlentyCard): boolean;
}