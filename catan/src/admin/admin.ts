import {Player} from "../player/player";
import {BoardSetup, PlayerColor, ResourceTileType} from "../state/board";
import {Rules} from "../rules/rules";
import {List, Map} from "immutable";
import {addResource, DevelopmentCard, emptyResources, makeResources, ResourceCard, ResourceCards} from "../common/card";
import {
  BuildCityAction,
  BuildRoadAction,
  BuildSettlementAction,
  DiscardHalfOfResourceCardsAction,
  DomesticTradeAction,
  InitialTurnAction,
  MaritimeTradeAction,
  MoveRobberAction,
  PlayKnightCardAction,
  PlayMonopolyCardAction,
  PlayRoadBuildingCardAction,
  PlayYearOfPlentyCardAction,
  TurnAction,
  visitTurnAction
} from "../common/action";
import {GameState, makeGameState} from "../state/gameState";
import {TurnInfo} from "../common/turnInfo";
import {AdminObserver} from "./adminObserver";
import {Dice, ResourceCardPicker} from "../state/random";
import {HexCoords} from "../common/hex";
import {makeFunctionsSafe} from "../util/safeFunction";
import {makeObservableGameState} from "../state/observableGameState";

/**
 * The numbers that can be placed on resource tiles i.e. the numbers that can be rolled with 2 6-sided dice.
 */
export type RollNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const SETTLEMENT_COST: ResourceCards = Map([
  ["WHEAT", 1],
  ["WOOD", 1],
  ["BRICK", 1],
  ["SHEEP", 1]
]);

export const CITY_COST: ResourceCards = Map([
  ["WHEAT", 2],
  ["STONE", 3]
]);

export const ROAD_COST: ResourceCards = Map([
  ["WOOD", 1],
  ["BRICK", 1]
]);

export const DEVELOPMENT_CARD_COST: ResourceCards = Map([
  ["SHEEP", 1],
  ["STONE", 1],
  ["WHEAT", 1]
]);

export const RESOURCES_PER_SETTLEMENT = 1;

export const RESOURCES_PER_CITY = 2;

export const MIN_ROADS_FOR_LONGEST_ROAD_CARD = 5;
export const MIN_KNIGHTS_FOR_LARGEST_ARM_CARD = 3;

export const MIN_PLAYERS = 3;

export interface Admin {
  run(): GameResults;
}

export type GameResults = {
  readonly winner?: Player;
  readonly scores: Map<Player, number>;
  readonly cheaters: List<Player>;
}

export const PLAYER_COLOR_ORDER: List<PlayerColor> = List(["RED", "WHITE", "BLUE", "ORANGE"]);

export function makeAdmin(boardSetup: BoardSetup,
                          rules: Rules,
                          dice: Dice,
                          resourceCardPicker: ResourceCardPicker,
                          playerss: [Player, Player, Player] | [Player, Player, Player, Player],
                          observers: List<AdminObserver>,
                          resourceCardSupply: Map<ResourceCard, number>,
                          developmentCardSupply: List<DevelopmentCard>,
                          roadsPerPlayer: number,
                          settlementsPerPlayer: number,
                          citiesPerPlayer: number): Admin {

  const observer: AdminObserver = makeSafeDelegateObserver(observers);

  const players = List(playerss).map(makeFunctionsSafe);
  const colorToPlayer: Map<PlayerColor, Player> = Map(PLAYER_COLOR_ORDER.zip(players));
  const colors = List(colorToPlayer.keys());
  const firstTurnColor = colors.get(0)!;


  function isGameOver(state: GameState): boolean {
    return !!getWinner(state) || (state.playerStates.size < MIN_PLAYERS);
  }

  function getTurnInfo(state: GameState, color: PlayerColor): TurnInfo {
    return {
      game: makeObservableGameState(state),
      player: state.playerStates.get(color)!
    }
  }

  function getWinner(state: GameState): PlayerColor | undefined {
    return state.playerStates.findKey((_, c) => rules.hasWon(c, getTurnInfo(state, c)));
  }

  function notifyPlayersOfColors() {
    colors.forEach(c => colorToPlayer.get(c)!.notifyColors(c, colors));
  }

  function notifyPlayersOfResults(scores: Map<PlayerColor, number>, winner?: PlayerColor) {
    colors.forEach(c => colorToPlayer.get(c)!.notifyResults(scores, winner));
  }

  function getScores(state: GameState): Map<PlayerColor, number> {
    return colorToPlayer.map((_, c) => rules.getVictoryPoints(c, getTurnInfo(state, c)));
  }

  function getPlayer(color: PlayerColor): Player {
    return colorToPlayer.get(color)!;
  }

  function tryAction<Action>(state: GameState,
                             color: PlayerColor,
                             getActionFn: (player: Player, info: TurnInfo) => Action,
                             isActionValidFn: (color: PlayerColor, info: TurnInfo, action: Action) => boolean,
                             doActionFn: (state: GameState, color: PlayerColor, action: Action) => GameState) {
    const info = getTurnInfo(state, color);
    const action = getActionFn(getPlayer(color), info);
    if (!isActionValidFn(color, info, action)) {
      return state.removePlayer(color);
    }
    return doActionFn(state, color, action);
  }

  function havePlayersDoInitialTurnRound(state: GameState): GameState {
    for (const color of state.playerStates.keys()) {
      state = tryAction(state, color,
          (player, info) => player.getInitialTurnAction(info),
          rules.isInitialTurnActionValid,
          doInitialTurnAction);
    }
    return state;
  }

  function doInitialTurnAction(state: GameState, color: PlayerColor, {settlement, road}: InitialTurnAction) {
    return state.buildInitialRoadAndSettlement(color, settlement, road)
  }

  function haveCurrentPlayerDoTurnAction(state: GameState): GameState {
    if (!state.currentTurnColor) {
      return state;
    }
    return tryAction(state, state.currentTurnColor,
        (player, info) => player.getTurnAction(info),
        rules.isTurnActionValid,
        doTurnAction);
  }

  function doTurnAction(state: GameState, color: PlayerColor, action: TurnAction): GameState {
    state = visitTurnAction(action, {
      endTurn: () => doEndTurnAction(state),
      buildRoad: action => doBuildRoadAction(state, color, action),
      buildSettlement: action => doBuildSettlementAction(state, color, action),
      buildCity: action => doBuildCityAction(state, color, action),
      buyDevelopmentCard: () => doBuyDevelopmentCardAction(state, color),
      domesticTrade: action => doDomesticTradeAction(state, color, action),
      maritimeTrade: action => doMaritimeTradeAction(state, color, action),
      playKnightCard: action => doPlayKnightCardAction(state, color, action),
      playMonopolyCard: action => doPlayMonopolyCardAction(state, color, action),
      playRoadBuildingCard: action => doPlayRoadBuildingCardAction(state, color, action),
      playYearOfPlentyCard: action => doPlayYearOfPlentyCard(state, color, action),
      rollDice: () => doRollDiceAction(state, color)
    });

    observer.onDoTurnAction(color, action, makeObservableGameState(state));

    return state;
  }

  function doEndTurnAction(state: GameState): GameState {
    return state.nextTurn();
  }

  function doBuildRoadAction(state: GameState, color: PlayerColor, {edge}: BuildRoadAction): GameState {
    return state.buildRoad(color, edge).returnResourcesToSupply(color, ROAD_COST);
  }

  function doBuildSettlementAction(state: GameState, color: PlayerColor, {intersection}: BuildSettlementAction): GameState {
    return state.buildSettlement(color, intersection).returnResourcesToSupply(color, SETTLEMENT_COST);
  }

  function doBuildCityAction(state: GameState, color: PlayerColor, {intersection}: BuildCityAction): GameState {
    return state.buildCity(color, intersection).returnResourcesToSupply(color, CITY_COST);
  }

  function notifyGotResourceCardsFromPlayer(to: PlayerColor, from: PlayerColor, cards: ResourceCards): void {
    getPlayer(to).notifyReceivedResourcesFromPlayer(from, cards);
    getPlayer(from).notifyResourcesTakenByPlayer(to, cards);
  }

  function doBuyDevelopmentCardAction(state: GameState, color: PlayerColor): GameState {
    let card: DevelopmentCard;
    [state, card] = state.drawDevelopmentCardFromSupply();
    getPlayer(color).notifyReceivedDevelopmentCard(card);
    return state.giveDevelopmentCard(color, card).returnResourcesToSupply(color, DEVELOPMENT_CARD_COST);
  }

  function doDomesticTradeAction(state: GameState, from: PlayerColor, action: DomesticTradeAction): GameState {
    return tryAction(state, action.to,
        (player, info) => player.willAcceptTrade(info, from, action.youGiveMe, action.iGiveYou),
        (to, info, accepted) => !accepted || rules.canAcceptTrade(to, info, action),
        (state, to, accepted) => {
          getPlayer(from).notifyTradeResult(action, accepted);

          if (accepted) {
            notifyGotResourceCardsFromPlayer(to, from, action.iGiveYou);
            notifyGotResourceCardsFromPlayer(from, to, action.youGiveMe);

            state = state
            .giveResourceCardsFromPlayer(to, from, action.iGiveYou)
            .giveResourceCardsFromPlayer(from, to, action.youGiveMe);
          }
          return state;
        });
  }

  function doMaritimeTradeAction(state: GameState, color: PlayerColor, {give, harbor, receive}: MaritimeTradeAction): GameState {
    return state
    .returnResourcesToSupply(color, makeResources(<ResourceCard>(give || harbor.card), harbor.amount))
    .giveResourceCardsFromSupply(color, makeResources(receive, 1));
  }

  function doPlayKnightCardAction(state: GameState, color: PlayerColor, action: PlayKnightCardAction) {
    return doMoveRobberAction(state, color, action, false).removePlayedDevelopmentCard(color, "KNIGHT");
  }

  function doPlayMonopolyCardAction(state: GameState, color: PlayerColor, {resource}: PlayMonopolyCardAction) {
    for (const other of state.playerStates.keys()) {
      if (other === color) continue;

      const resourcesToTake = makeResources(resource, state.countResourceCardsOfType(other, resource));

      notifyGotResourceCardsFromPlayer(color, other, resourcesToTake);

      state = state.giveResourceCardsFromPlayer(color, other, resourcesToTake);
    }
    return state;
  }

  function doPlayRoadBuildingCardAction(state: GameState, color: PlayerColor, {edge1, edge2}: PlayRoadBuildingCardAction) {
    state = state.buildRoad(color, edge1);
    if (edge2) {
      state = state.buildRoad(color, edge2);
    }
    return state;
  }

  function doPlayYearOfPlentyCard(state: GameState, color: PlayerColor, {cards}: PlayYearOfPlentyCardAction) {
    return state.giveResourceCardsFromSupply(color, cards);
  }

  function doRollDiceAction(state: GameState, roller: PlayerColor) {
    function getResource(tile: ResourceTileType): ResourceCard {
      // TODO handle gold
      return tile === "GOLD" ? "WOOD" : tile;
    }

    function getResourceCountFromTile(color: PlayerColor, tile: HexCoords): number {
      return state.board.numSettlementsOfColorOnTile(color, tile) * RESOURCES_PER_SETTLEMENT
          + state.board.numCitiesOfColorOnTile(color, tile) * RESOURCES_PER_CITY
    }

    let rollNumber: RollNumber;
    [state, rollNumber] = state.roll();

    if (rollNumber === 7) {
      return handleRollOf7(state, roller);
    }

    const rolledTiles = state.board.getResourceTilesWithRollNumber(rollNumber);

    for (const color of state.playerStates.keys()) {
      const resources = rolledTiles
      .map(([coords, resourceTile]): [ResourceCard, number] => ([getResource(resourceTile), getResourceCountFromTile(color, coords)]))
      .reduce((resources, [card, count]) => addResource(resources, card, count), emptyResources());

      // TODO handle supply running out

      getPlayer(color).notifyDiceRolled(roller, rollNumber, resources);
      state = state.giveResourceCardsFromSupply(color, resources);
    }

    return state;
  }

  function handleRollOf7(state: GameState, roller: PlayerColor) {
    state.playerStates.forEach((_, c) => getPlayer(c).notifyDiceRolled(roller, 7, emptyResources()));

    state = havePlayersDiscardCards(state);

    if (!state.playerStates.has(roller)) {
      return state;
    }

    return havePlayerMoveRobber(state, roller);
  }

  function havePlayersDiscardCards(state: GameState): GameState {
    for (const color of state.playerStates.keys()) {
      state = tryAction(state, color,
          (player, info) => player.discardHalfOfResourceCards(info),
          rules.isDiscardHalfOfResourceCardsActionValid,
          doDiscardHalfOfCardsAction);
    }
    return state;
  }

  function doDiscardHalfOfCardsAction(state: GameState, color: PlayerColor, action: DiscardHalfOfResourceCardsAction): GameState {
    state = state.returnResourcesToSupply(color, action.toDiscard);
    observer.onDoDiscardHalfOfResourceCardsAction(color, action, makeObservableGameState(state));
    return state;
  }

  function havePlayerMoveRobber(state: GameState, color: PlayerColor): GameState {
    return tryAction(state, color,
        (player, info) => player.moveRobber(info),
        rules.isMoveRobberActionValid,
        doMoveRobberAction);
  }

  function doMoveRobberAction(state: GameState, color: PlayerColor, {coords, stealFrom}: PlayKnightCardAction | MoveRobberAction, callObserver: boolean = true): GameState {
    state = state.moveRobber(coords);
    if (stealFrom) {
      let card: ResourceCard;
      [state, card] = state.getRandomCardFromHand(color);

      const resources = makeResources(card, 1);

      notifyGotResourceCardsFromPlayer(color, stealFrom, resources);

      state.giveResourceCardsFromPlayer(color, stealFrom, resources);
    }

    if (callObserver) {
      observer.onDoMoveRobberAction(color, {coords, stealFrom}, makeObservableGameState(state));
    }

    return state;
  }

  return {
    run: () => {
      let state: GameState = makeGameState(
          boardSetup,
          colors,
          firstTurnColor,
          dice,
          resourceCardPicker,
          resourceCardSupply,
          developmentCardSupply,
          roadsPerPlayer,
          settlementsPerPlayer,
          citiesPerPlayer);

      notifyPlayersOfColors();

      state = havePlayersDoInitialTurnRound(state);
      state = havePlayersDoInitialTurnRound(state);

      while (!isGameOver(state)) {
        state = haveCurrentPlayerDoTurnAction(state);
      }

      const winner = getWinner(state);
      const scores = getScores(state);

      notifyPlayersOfResults(scores, winner);

      return {
        scores: scores.mapKeys(c => colorToPlayer.get(c)!),
        winner: winner != undefined ? colorToPlayer.get(winner)! : undefined,
        cheaters: colors.filterNot(state.playerStates.has).map(c => colorToPlayer.get(c)!)
      }
    }
  }
}

function makeSafeDelegateObserver(observers: List<AdminObserver>): AdminObserver {
  observers = observers.map(makeFunctionsSafe);
  return {
    onDoDiscardHalfOfResourceCardsAction: (color, info, after) => observers.forEach(o => o.onDoDiscardHalfOfResourceCardsAction(color, info, after)),
    onDoTurnAction: (color, info, after) => observers.forEach(o => o.onDoTurnAction(color, info, after)),
    onDoMoveRobberAction: (color, info, after) => observers.forEach(o => o.onDoMoveRobberAction(color, info, after))
  };
}