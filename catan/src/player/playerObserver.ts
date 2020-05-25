import {PlayerColor} from "../board";
import {DevelopmentCard, ResourceCard, TurnInfo} from "./player";
import {InitialTurnAction, Action, MoveRobberAction, TradeWithPlayerAction} from "./action";

export interface PlayerObserver {
  onInitialTurn1(info: TurnInfo, action: InitialTurnAction): void;

  onInitialTurn2(info: TurnInfo, action: InitialTurnAction): void;

  onAction(info: TurnInfo, action: Action): void;

  onEndTurn(info: TurnInfo): void;

  onAcceptTrade(from: PlayerColor, give: ResourceCard[], receive: ResourceCard[]): void;

  onTradeResult(action: TradeWithPlayerAction, accepted: boolean): void;

  onRoll7(action: MoveRobberAction): void;

  onReceiveResourceCardsFromRoll(cards: ResourceCard[]): void;

  onGetStolenCard(stolenFrom: PlayerColor, card: ResourceCard): void;

  onReceiveDevelopmentCard(card: DevelopmentCard[]): void;

  onStolenFrom(stealer: PlayerColor, card: ResourceCard): void;
}