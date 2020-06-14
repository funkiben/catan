import {DiscardHalfOfResourceCardsAction, MoveRobberAction, ObservableGameState, PlayerColor, TurnAction} from "..";
import {makeFunctionsSafe} from "../util/safeFunction";
import {List} from "immutable";

export interface AdminObserver {
  onDoTurnAction(color: PlayerColor, action: TurnAction, after: ObservableGameState): void;

  onDoMoveRobberAction(color: PlayerColor, action: MoveRobberAction, after: ObservableGameState): void;

  onDoDiscardHalfOfResourceCardsAction(color: PlayerColor, action: DiscardHalfOfResourceCardsAction, after: ObservableGameState): void;
}

export function makeSafeDelegateObserver(observers: List<AdminObserver>): AdminObserver {
  observers = observers.map(makeFunctionsSafe);
  return {
    onDoDiscardHalfOfResourceCardsAction: (color, info, after) => observers.forEach(o => o.onDoDiscardHalfOfResourceCardsAction(color, info, after)),
    onDoTurnAction: (color, info, after) => observers.forEach(o => o.onDoTurnAction(color, info, after)),
    onDoMoveRobberAction: (color, info, after) => observers.forEach(o => o.onDoMoveRobberAction(color, info, after))
  };
}