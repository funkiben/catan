import {DiscardHalfOfResourceCardsAction, InitialTurnAction, MoveRobberAction, TurnAction} from "../common/action";
import {ObservableGameState} from "../state/observableGameState";

export interface PlayerObserver {
  onInitialTurn(game: ObservableGameState, action: InitialTurnAction): void;

  onTurnAction(game: ObservableGameState, action: TurnAction): void;

  onMoveRobber(game: ObservableGameState, action: MoveRobberAction): void;

  onDiscardHalfOfCards(game: ObservableGameState, action: DiscardHalfOfResourceCardsAction): void;

  onRespondToTrade(game: ObservableGameState, give: number, receive: number, accepted: boolean): void;
}