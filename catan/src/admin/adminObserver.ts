import {DiscardHalfOfResourceCardsAction, MoveRobberAction, ObservableGameState, PlayerColor, TurnAction} from "..";

export interface AdminObserver {
  onDoTurnAction(color: PlayerColor, action: TurnAction, after: ObservableGameState): void;

  onDoMoveRobberAction(color: PlayerColor, action: MoveRobberAction, after: ObservableGameState): void;

  onDoDiscardHalfOfResourceCardsAction(color: PlayerColor, action: DiscardHalfOfResourceCardsAction, after: ObservableGameState): void;
}