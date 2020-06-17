import {makeSafeFunction} from "../util/safe";
import {List} from "immutable";
import {EndTurnAction, makeEdge, makeHexCoords, makeIntersection, Player} from "..";

const DISCARD_HALF_OF_RESOURCE_CARDS_ACTION = {toDiscard: List()};
const INITIAL_TURN_ACTION = {
  road: makeEdge(0, 0, "TOP"),
  settlement: makeIntersection(0, 0, "TOPLEFT")
};
const END_TURN_ACTION: EndTurnAction = {name: "endTurn"};
const MOVE_ROBBER_ACTION = {coords: makeHexCoords(0, 0)};
const ACCEPT_TRADE_RESPONSE = false;

export function makeSafePlayer(player: Player): Player {
  return {
    addObserver: makeSafeFunction(player.addObserver),
    discardHalfOfResourceCards: makeSafeFunction(player.discardHalfOfResourceCards, Promise.resolve(DISCARD_HALF_OF_RESOURCE_CARDS_ACTION)),
    getInitialTurnAction: makeSafeFunction(player.getInitialTurnAction, Promise.resolve(INITIAL_TURN_ACTION)),
    getTurnAction: makeSafeFunction(player.getTurnAction, Promise.resolve(END_TURN_ACTION)),
    moveRobber: makeSafeFunction(player.moveRobber, Promise.resolve(MOVE_ROBBER_ACTION)),
    willAcceptTrade: makeSafeFunction(player.willAcceptTrade, Promise.resolve(ACCEPT_TRADE_RESPONSE)),
    notifyColors: makeSafeFunction(player.notifyColors),
    notifyDiceRolled: makeSafeFunction(player.notifyDiceRolled),
    notifyReceivedDevelopmentCard: makeSafeFunction(player.notifyReceivedDevelopmentCard),
    notifyReceivedResourcesFromPlayer: makeSafeFunction(player.notifyReceivedResourcesFromPlayer),
    notifyResourcesTakenByPlayer: makeSafeFunction(player.notifyResourcesTakenByPlayer),
    notifyResults: makeSafeFunction(player.notifyResults),
    notifyTradeResult: makeSafeFunction(player.notifyTradeResult),
    removeObserver: makeSafeFunction(player.removeObserver)
  };
}