import {Board, PlayerColor} from "../state/board";
import {
  DiscardHalfOfResourceCardsAction,
  DomesticTradeAction,
  InitialTurnAction,
  MoveRobberAction,
  TurnAction
} from "../common/action";
import {PlayerObserver} from "./playerObserver";
import {List, Map} from "immutable";
import {DevelopmentCard, ResourceCards} from "../common/card";
import {TurnInfo} from "../common/turnInfo";
import {RollNumber} from "../admin/admin";

/**
 * Interface for a Catan player.
 */
export interface Player {
  /**
   * Tells the player of their color as well as the colors of all players in the game in order of their turns.
   * @param player The color of the player.
   * @param all The colors of all players in the game, in order of turn.
   */
  notifyColors(player: PlayerColor, all: List<PlayerColor>): void;

  /**
   * Notifies the player of the results of the game.
   * @param scores The final scores of all colors.
   * @param winner The winner of the game. May be undefined if no winner
   */
  notifyResults(scores: Map<PlayerColor, number>, winner?: PlayerColor): void;

  /**
   * Called when a player rolls the dice.
   * @param color The player color that rolled the dice.
   * @param roll The number rolled.
   * @param cards The resource cards gained.
   */
  notifyDiceRolled(color: PlayerColor, roll: RollNumber, cards: ResourceCards): void;

  /**
   * Called when the player receives resource cards from a player.
   * @param from The player the cards came from.
   * @param cards The cards the player has received.
   */
  notifyReceivedResourcesFromPlayer(from: PlayerColor, cards: ResourceCards): void;

  /**
   * Called when another player takes cards from this player.
   * @param taker The player taking the cards.
   * @param cardsTaken The cards that are taken away.
   */
  notifyResourcesTakenByPlayer(taker: PlayerColor, cardsTaken: ResourceCards): void;

  /**
   * Notifies the player they received a development card.
   * @param card The development card the player received.
   */
  notifyReceivedDevelopmentCard(card: DevelopmentCard): void;

  /**
   * Called when a trade is either accepted or declined by another player.
   */
  notifyTradeResult(tradeAction: DomesticTradeAction, accepted: boolean): void;

  /**
   * Gets the players initial turn action.
   * @param info Info about the current state of the game.
   */
  getInitialTurnAction(info: TurnInfo): InitialTurnAction;

  /**
   * Gets an action from the player when it's their turn.
   * @param info Info about the current state of the game.
   */
  getTurnAction(info: TurnInfo): TurnAction;

  /**
   * Called when another player wants to trade with this player. Returns true if the trade is accepted by this player.
   * @param info The turn info.
   * @param from The player the trade is from.
   * @param give The cards this player must give.
   * @param get The cards this player will receive.
   */
  willAcceptTrade(info: TurnInfo, from: PlayerColor, give: ResourceCards, get: ResourceCards): boolean;

  /**
   * Called when this player rolls a 7 and must move the robber and steal from a player.
   * @param info Info about the state of the game.
   */
  moveRobber(info: TurnInfo): MoveRobberAction;

  /**
   * Chooses half of the players resource cards to discard because of a roll of 7.
   */
  discardHalfOfResourceCards(info: TurnInfo): DiscardHalfOfResourceCardsAction;

  /**
   * Adds an observer to this player.
   * @param observer The observer.
   */
  addObserver(observer: PlayerObserver): void;

}
