import {
  DiscardHalfOfResourceCardsAction,
  InitialTurnAction,
  MoveRobberAction,
  ObservableGameState,
  TurnAction
} from "..";

export interface PlayerObserver {
  onInitialTurn(game: ObservableGameState, action: InitialTurnAction): void;

  onTurnAction(game: ObservableGameState, action: TurnAction): void;

  onMoveRobber(game: ObservableGameState, action: MoveRobberAction): void;

  onDiscardHalfOfCards(game: ObservableGameState, action: DiscardHalfOfResourceCardsAction): void;

  onRespondToTrade(game: ObservableGameState, give: number, receive: number, accepted: boolean): void;
}