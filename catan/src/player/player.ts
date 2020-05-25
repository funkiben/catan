import {Board, PlayerColor} from "../board";
import {InitialTurnAction, Action, MoveRobberAction, TradeWithPlayerAction, PlayDevelopmentCardAction} from "./action";
import {PlayerObserver} from "./playerObserver";
import {Map} from "immutable";

/** // TODO figure out proper place for this type
 * The different types of resource cards.
 */
export type ResourceCard = "WOOD" | "SHEEP" | "BRICK" | "STONE" | "WHEAT";

/** // TODO figure out proper place for this type
 * The different types of development cards.
 */
export type DevelopmentCard = "VICTORYPOINT" | "MONOPOLY" | "ROADBUILING" | "RESOURCES" | "KNIGHT";

/**
 * Interface for a Catan player.
 */
export interface Player {
  /**
   * Tels the player what color they are playing as.
   * @param color The color.
   */
  notifyColor(color: PlayerColor): void;

  /**
   * Gets the players first initial turn action.
   * @param info Info about the current state of the game.
   */
  getInitialTurn1(info: TurnInfo): InitialTurnAction;

  /**
   * Gets the players second initial turn action.
   * @param info Info about the current state of the game.
   */
  getInitialTurn2(info: TurnInfo): InitialTurnAction;

  /**
   * Before the die is rolled, this function is called to determine if the player wants to play any development cards.
   * @param info Info about the current state of the game.
   */
  playDevelopmentCardBeforeRoll(info: TurnInfo): PlayDevelopmentCardAction | false;

  /**
   * Gets an action from the player when it's their turn. This function will be called until it returns false, or if the
   * player has no more actions left.
   * @param info Info about the current state of the game.
   */
  doAction(info: TurnInfo): Action | false;

  /**
   * Gets an observer for the given player, or undefined if no observer is desired for the given player.
   * @param color The color of the player to give an observer for.
   */
  getPlayerObserver(color: PlayerColor): PlayerObserver | undefined;

  /**
   * Called when the player receives resource cards from a roll.
   * @param cards The cards the player has gained.
   */
  giveResourceCardsFromRoll(cards: ResourceCard[]): void;

  /**
   * Called when the player receives resource cards from stealing from another player.
   * @param stolenFrom The player stolen from.
   * @param card The card the player has stolen.
   */
  giveStolenResourceCard(stolenFrom: PlayerColor, card: ResourceCard): void;

  /**
   * Called when a player steals from this player.
   * @param stealer The player stealing the card.
   * @param takenCard The card that is stolen.
   */
  wasStolenFrom(stealer: PlayerColor, takenCard: ResourceCard): void;

  /**
   * Gives a development card to the given player.
   * @param card The development card.
   */
  giveDevelopmentCard(card: DevelopmentCard): void;

  /**
   * Called when a trade is either accepted or declined by another player.
   */
  tradeResult(tradeAction: TradeWithPlayerAction, accepted: boolean): void;

  /**
   * Called when another player wants to trade with this player.
   * @param from The trade the player is being requested from.
   * @param give The cards this player must give.
   * @param receive The cards this player will receive.
   */
  acceptTrade(from: PlayerColor, give: ResourceCard[], receive: ResourceCard[]): boolean;

  /**
   * Called when this player rolls a 7 and must move the robber and steal from a player.
   * @param info Info about the state of the game.
   */
  moveRobberForRollOf7(info: TurnInfo): MoveRobberAction;

  /**
   * Adds an observer to this player.
   * @param observer The observer.
   */
  addObserver(observer: PlayerObserver): void;
}

/**
 * Info a player is given when it's their turn.
 */
export type TurnInfo = {
  /**
   * The board.
   */
  readonly board: Board;
  /**
   * The players in turn order along with how many resource cards they have.
   */
  readonly playerCardCount: Map<PlayerColor, number>;
  /**
   * The resource cards the player has.
   */
  readonly resourceCards: ResourceCard[];
  /**
   * The development cards the player can use on their current turn.
   */
  readonly developmentCards: DevelopmentCard[];
  /**
   * How many resources of each type are left.
   */
  readonly resourceSupply: Map<ResourceCard, number>;
}