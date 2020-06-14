import {PlayerColor} from "../state/board";
import {DiscardHalfOfResourceCardsAction, MoveRobberAction, TurnAction} from "../common/action";
import {ObservableGameState} from "../state/observableGameState";

export interface AdminObserver {
  onDoTurnAction(color: PlayerColor, action: TurnAction, after: ObservableGameState): void;

  onDoMoveRobberAction(color: PlayerColor, action: MoveRobberAction, after: ObservableGameState): void;

  onDoDiscardHalfOfResourceCardsAction(color: PlayerColor, action: DiscardHalfOfResourceCardsAction, after: ObservableGameState): void;
}