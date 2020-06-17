import {
  makeObserverManager,
  MessageSerializer,
  ObserverManager,
  Player,
  PlayerObserver,
  ReadFn,
  ResponseDeserializer,
  TurnAction,
  TurnInfo,
  WriteFn
} from "..";

export type PlayerMessageSerializer =
    MessageSerializer<Omit<Player, "addObserver" | "removeObserver">>
export type PlayerResponseDeserializer =
    ResponseDeserializer<Pick<Player, "getInitialTurnAction" | "getTurnAction" | "discardHalfOfResourceCards" | "moveRobber" | "willAcceptTrade">>

export function makeRemotePlayer(write: WriteFn, read: ReadFn, serializer: PlayerMessageSerializer, deserializer: PlayerResponseDeserializer): Player {
  const observerManager: ObserverManager<PlayerObserver> = makeObserverManager();

  function wrap<R, P extends any[]>
  (serializer: (...args: P) => string,
   deserializer: (msg: string) => R,
   observerFunction: (r: R, ...args: P) => void): (...args: P) => Promise<R> {
    return async (...args) => {
      write(serializer(...args));
      const action = deserializer(await read());
      observerFunction(action, ...args);
      return action;
    };
  }

  return {
    addObserver: observerManager.addObserver,
    removeObserver: observerManager.removeObserver,
    discardHalfOfResourceCards: wrap(
        serializer.discardHalfOfResourceCards,
        deserializer.discardHalfOfResourceCards,
        (action, info) => observerManager.call(o => o.onDiscardHalfOfCards, info.game, action)
    ),
    getInitialTurnAction: wrap(
        serializer.getInitialTurnAction,
        deserializer.getInitialTurnAction,
        (action, info) => observerManager.call(o => o.onInitialTurn, info.game, action)
    ),
    getTurnAction: wrap<TurnAction, [TurnInfo]>(
        serializer.getTurnAction,
        deserializer.getTurnAction,
        (action, info) => observerManager.call(o => o.onTurnAction, info.game, action)
    ),
    moveRobber: wrap(
        serializer.moveRobber,
        deserializer.moveRobber,
        (action, info) => observerManager.call(o => o.onMoveRobber, info.game, action)
    ),
    willAcceptTrade: wrap(
        serializer.willAcceptTrade,
        deserializer.willAcceptTrade,
        (accepted, info, from, give, get) => observerManager.call(o => o.onRespondToTrade, info.game, from, give, get, accepted)
    ),
    notifyColors: (color, players) => {
      write(serializer.notifyColors(color, players));
    },
    notifyDiceRolled: (color, roll, resources) => {
      write(serializer.notifyDiceRolled(color, roll, resources));
    },
    notifyReceivedDevelopmentCard: card => {
      write(serializer.notifyReceivedDevelopmentCard(card));
    },
    notifyReceivedResourcesFromPlayer: (from, resources) => {
      write(serializer.notifyReceivedResourcesFromPlayer(from, resources));
    },
    notifyResourcesTakenByPlayer: (taker, resources) => {
      write(serializer.notifyResourcesTakenByPlayer(taker, resources));
    },
    notifyResults: (scores, winner) => {
      write(serializer.notifyResults(scores, winner));
    },
    notifyTradeResult: (trade, accepted) => {
      write(serializer.notifyTradeResult(trade, accepted));
    }
  };
}