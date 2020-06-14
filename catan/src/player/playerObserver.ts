import {makeFunctionsSafe} from "../util/safeFunction";
import {List} from "immutable";
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


function makeSafeDelegatePlayerObserver(observers: List<PlayerObserver>): PlayerObserver {
  observers = observers.map(makeFunctionsSafe);
  return {
    onInitialTurn: (game, action) => observers.forEach(o => o.onInitialTurn(game, action)),
    onTurnAction: (game, action) => observers.forEach(o => o.onTurnAction(game, action)),
    onMoveRobber: (game, action) => observers.forEach(o => o.onMoveRobber(game, action)),
    onDiscardHalfOfCards: (game, action) => observers.forEach(o => o.onDiscardHalfOfCards(game, action)),
    onRespondToTrade: (color, give, receive, accepted) => observers.forEach(o => o.onRespondToTrade(color, give, receive, accepted))
  };
}