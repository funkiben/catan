import {
  addResource,
  AdminObserver,
  ALL_RESOURCE_CARD_TYPES,
  asyncVisitTurnAction,
  BoardSetup,
  BuildCityAction,
  BuildRoadAction,
  BuildSettlementAction,
  DevelopmentCard,
  Dice,
  DiscardHalfOfResourceCardsAction,
  DomesticTradeAction,
  GameState,
  HexCoords,
  InitialTurnAction,
  makeGameState,
  makeObservableGameState,
  makeResourceCards,
  MaritimeTradeAction,
  MoveRobberAction,
  Player,
  PlayerColor,
  PlayKnightCardAction,
  PlayMonopolyCardAction,
  PlayRoadBuildingCardAction,
  PlayYearOfPlentyCardAction,
  removeAllResources,
  ResourceCard,
  ResourceCardPicker,
  ResourceCards,
  resourceCount,
  ResourceTileType,
  Rules,
  TurnAction,
  TurnInfo
} from "..";
import {List, Map} from "immutable";
import {makeSafePlayer} from "../player/safePlayer";
import {makeObserverManager, ObserverManager} from "../util/observerManager";

/**
 * The numbers that can be placed on resource tiles i.e. the numbers that can be rolled with 2 6-sided dice.
 */
export type RollNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const SETTLEMENT_COST: ResourceCards = List([
  "WHEAT",
  "WOOD",
  "BRICK",
  "SHEEP"
]);

export const CITY_COST: ResourceCards = List([
  "WHEAT",
  "WHEAT",
  "STONE",
  "STONE",
  "STONE"
]);

export const ROAD_COST: ResourceCards = List([
  "WOOD",
  "BRICK"
]);

export const DEVELOPMENT_CARD_COST: ResourceCards = List([
  "SHEEP",
  "STONE",
  "WHEAT",
]);

export const RESOURCES_PER_SETTLEMENT = 1;

export const RESOURCES_PER_CITY = 2;

export const MIN_ROADS_FOR_LONGEST_ROAD_CARD = 5;
export const MIN_KNIGHTS_FOR_LARGEST_ARM_CARD = 3;

export const MIN_PLAYERS = 3;

export interface Admin {
  addObserver(observer: AdminObserver): void;

  removeObserver(observer: AdminObserver): void;

  run(): Promise<GameResults>;
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
                          resourceCardSupply: ResourceCards,
                          developmentCardSupply: List<DevelopmentCard>,
                          roadsPerPlayer: number,
                          settlementsPerPlayer: number,
                          citiesPerPlayer: number): Admin {

  const observerManager: ObserverManager<AdminObserver> = makeObserverManager();

  const players = List(playerss).map(makeSafePlayer);
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

  async function tryActionAsync<Action>(state: GameState,
                                        color: PlayerColor,
                                        getActionFn: (player: Player, info: TurnInfo) => Promise<Action>,
                                        isActionValidFn: (color: PlayerColor, info: TurnInfo, action: Action) => boolean,
                                        doActionFn: (state: GameState, color: PlayerColor, action: Action) => Promise<GameState>): Promise<GameState> {
    const info = getTurnInfo(state, color);
    const action = await getActionFn(getPlayer(color), info);
    if (!isActionValidFn(color, info, action)) {
      return state.removePlayer(color);
    }
    return await doActionFn(state, color, action);
  }

  async function tryAction<Action>(state: GameState,
                                   color: PlayerColor,
                                   getActionFn: (player: Player, info: TurnInfo) => Promise<Action>,
                                   isActionValidFn: (color: PlayerColor, info: TurnInfo, action: Action) => boolean,
                                   doActionFn: (state: GameState, color: PlayerColor, action: Action) => GameState): Promise<GameState> {
    return await tryActionAsync(state, color, getActionFn, isActionValidFn, (state, color, action) => Promise.resolve(doActionFn(state, color, action)));
  }

  async function havePlayersDoInitialTurnRound(state: GameState): Promise<GameState> {
    for (const color of state.playerStates.keys()) {
      state = await tryAction(state, color,
          (player, info) => player.getInitialTurnAction(info),
          rules.isInitialTurnActionValid,
          doInitialTurnAction);
    }
    return state;
  }

  function doInitialTurnAction(state: GameState, color: PlayerColor, {settlement, road}: InitialTurnAction) {
    return state.buildInitialRoadAndSettlement(color, settlement, road)
  }

  async function haveCurrentPlayerDoTurnAction(state: GameState): Promise<GameState> {
    if (!state.currentTurnColor) {
      return state;
    }
    return await tryActionAsync(state, state.currentTurnColor,
        (player, info) => player.getTurnAction(info),
        rules.isTurnActionValid,
        doTurnAction);
  }

  async function doTurnAction(state: GameState, color: PlayerColor, action: TurnAction): Promise<GameState> {
    state = await asyncVisitTurnAction(action, {
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

    observerManager.call(o => o.onDoTurnAction, color, action, makeObservableGameState(state));

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

  async function doDomesticTradeAction(state: GameState, from: PlayerColor, action: DomesticTradeAction): Promise<GameState> {
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
    .returnResourcesToSupply(color, makeResourceCards(<ResourceCard>(give || harbor.card), harbor.amount))
    .giveResourceCardsFromSupply(color, makeResourceCards(receive, 1));
  }

  function doPlayKnightCardAction(state: GameState, color: PlayerColor, action: PlayKnightCardAction): GameState {
    return doMoveRobberAction(state, color, action, false).removePlayedDevelopmentCard(color, "KNIGHT");
  }

  function doPlayMonopolyCardAction(state: GameState, color: PlayerColor, {resource}: PlayMonopolyCardAction): GameState {
    for (const other of state.playerStates.keys()) {
      if (other === color) continue;

      const resourcesToTake = makeResourceCards(resource, state.countResourceCardsOfType(other, resource));

      notifyGotResourceCardsFromPlayer(color, other, resourcesToTake);

      state = state.giveResourceCardsFromPlayer(color, other, resourcesToTake);
    }
    return state;
  }

  function doPlayRoadBuildingCardAction(state: GameState, color: PlayerColor, {edge1, edge2}: PlayRoadBuildingCardAction): GameState {
    state = state.buildRoad(color, edge1);
    if (edge2) {
      state = state.buildRoad(color, edge2);
    }
    return state;
  }

  function doPlayYearOfPlentyCard(state: GameState, color: PlayerColor, {cards}: PlayYearOfPlentyCardAction): GameState {
    return state.giveResourceCardsFromSupply(color, cards);
  }

  async function doRollDiceAction(state: GameState, roller: PlayerColor): Promise<GameState> {
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
      return await handleRollOf7(state, roller);
    }

    const rolledTiles = state.board.getResourceTilesWithRollNumber(rollNumber);

    let allResourcesToGive: ResourceCards = List();
    let resourcesToGive: Map<PlayerColor, ResourceCards> = Map();

    for (const color of state.playerStates.keys()) {
      const resources = rolledTiles
      .map(([coords, resourceTile]): [ResourceCard, number] => ([getResource(resourceTile), getResourceCountFromTile(color, coords)]))
      .reduce((resources, [card, count]) => addResource(resources, card, count), List());

      allResourcesToGive = allResourcesToGive.concat(resources);
      resourcesToGive = resourcesToGive.set(color, resources);
    }


    ALL_RESOURCE_CARD_TYPES
    .filter(card => resourceCount(allResourcesToGive, card) > resourceCount(resourceCardSupply, card))
    .forEach(card => {
      resourcesToGive = resourcesToGive.map(cards => removeAllResources(cards, card));
    });

    for (const [color, resources] of resourcesToGive) {
      getPlayer(color).notifyDiceRolled(color, rollNumber, resources);
      state = state.giveResourceCardsFromSupply(color, resources);
    }

    return state;
  }

  async function handleRollOf7(state: GameState, roller: PlayerColor): Promise<GameState> {
    state.playerStates.forEach((_, c) => getPlayer(c).notifyDiceRolled(roller, 7, List()));

    state = await havePlayersDiscardCards(state);

    if (!state.playerStates.has(roller)) {
      return state;
    }

    return havePlayerMoveRobber(state, roller);
  }

  async function havePlayersDiscardCards(state: GameState): Promise<GameState> {
    let finalState = state;
    const promises = [];
    for (const color of state.playerStates.keys()) {
      const info = getTurnInfo(state, color);
      promises.push(getPlayer(color).discardHalfOfResourceCards(info).then(async action => {
        finalState = await tryAction(finalState, color, () => Promise.resolve(action), rules.isDiscardHalfOfResourceCardsActionValid, doDiscardHalfOfCardsAction);
      }));
    }

    await Promise.all(promises);

    return finalState;
  }

  function doDiscardHalfOfCardsAction(state: GameState, color: PlayerColor, action: DiscardHalfOfResourceCardsAction): GameState {
    state = state.returnResourcesToSupply(color, action.toDiscard);

    observerManager.call(o => o.onDoDiscardHalfOfResourceCardsAction, color, action, makeObservableGameState(state));

    return state;
  }

  function havePlayerMoveRobber(state: GameState, color: PlayerColor): Promise<GameState> {
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

      const resources = makeResourceCards(card, 1);

      notifyGotResourceCardsFromPlayer(color, stealFrom, resources);

      state.giveResourceCardsFromPlayer(color, stealFrom, resources);
    }

    if (callObserver) {
      observerManager.call(o => o.onDoMoveRobberAction, color, {coords, stealFrom}, makeObservableGameState(state));
    }

    return state;
  }

  return {
    run: async () => {
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

      state = await havePlayersDoInitialTurnRound(state);
      state = await havePlayersDoInitialTurnRound(state);

      while (!isGameOver(state)) {
        state = await haveCurrentPlayerDoTurnAction(state);
      }

      const winner = getWinner(state);
      const scores = getScores(state);

      notifyPlayersOfResults(scores, winner);

      return {
        scores: scores.mapKeys(c => colorToPlayer.get(c)!),
        winner: winner != undefined ? colorToPlayer.get(winner)! : undefined,
        cheaters: colors.filterNot(state.playerStates.has).map(c => colorToPlayer.get(c)!)
      }
    },
    addObserver: observerManager.addObserver,
    removeObserver: observerManager.removeObserver
  }
}