import {Board, BoardSetup, makeBoard, PlayerColor} from "./board";
import {
  addResources,
  containsResources,
  DevelopmentCard,
  removeResources,
  ResourceCard,
  ResourceCards,
  resourceCount
} from "../common/card";
import {MIN_KNIGHTS_FOR_LARGEST_ARM_CARD, MIN_ROADS_FOR_LONGEST_ROAD_CARD, RollNumber} from "../admin/admin";
import {List, Map} from "immutable";
import {makePlayerState, PlayerState} from "./playerState";
import {Dice, ResourceCardPicker} from "./random";
import {Edge, HexCoords, Intersection} from "../common/hex";

interface GameStateData {
  readonly playerStates: Map<PlayerColor, PlayerState>;
  readonly developmentCardSupply: List<DevelopmentCard>;
  readonly dice: Dice;
  readonly resourceCardPicker: ResourceCardPicker;
  readonly board: Board;
  readonly currentTurnColor: PlayerColor;
  readonly resourceCardSupply: ResourceCards,
  readonly largestArmyCardOwner?: PlayerColor,
  readonly longestRoadCardOwner?: PlayerColor,
}

export interface GameState extends GameStateData {
  buildInitialRoadAndSettlement(color: PlayerColor, settlement: Intersection, road: Edge): this;

  buildRoad(color: PlayerColor, edge: Edge): this,

  buildSettlement(color: PlayerColor, intersection: Intersection): this,

  moveRobber(coords: HexCoords): this

  buildCity(color: PlayerColor, intersection: Intersection): this,

  giveResourceCardsFromSupply(color: PlayerColor, cards: ResourceCards): this,

  giveDevelopmentCard(color: PlayerColor, card: DevelopmentCard): this,

  removePlayer(color: PlayerColor): this;

  nextTurn(): this;

  giveResourceCardsFromPlayer(color: PlayerColor, from: PlayerColor, cards: ResourceCards): this,

  drawDevelopmentCardFromSupply(): [this, DevelopmentCard],

  getRandomCardFromHand(color: PlayerColor): [this, ResourceCard],

  returnResourcesToSupply(color: PlayerColor, cards: ResourceCards): this,

  roll(): [this, RollNumber];

  removePlayedDevelopmentCard(color: PlayerColor, developmentCard: DevelopmentCard): this;

  countResourceCardsOfType(color: PlayerColor, card: ResourceCard): number;
}

export function makeGameState(boardSetup: BoardSetup,
                              colorsInGame: List<PlayerColor>,
                              firstTurnColor: PlayerColor,
                              dice: Dice,
                              resourceCardPicker: ResourceCardPicker,
                              resourceCardSupply: ResourceCards,
                              developmentCardSupply: List<DevelopmentCard>,
                              roadsPerPlayer: number,
                              settlementsPerPlayer: number,
                              citiesPerPlayer: number): GameState {

  return makeIntermediateGameState({
    board: makeBoard(boardSetup),
    currentTurnColor: firstTurnColor,
    dice,
    resourceCardPicker,
    resourceCardSupply,
    developmentCardSupply,
    playerStates: Map(colorsInGame.map(c => [c, makePlayerState(roadsPerPlayer, settlementsPerPlayer, citiesPerPlayer)])),
    largestArmyCardOwner: undefined,
    longestRoadCardOwner: undefined
  });
}

function makeIntermediateGameState(state: GameStateData): GameState {
  const {
    playerStates, developmentCardSupply, resourceCardSupply, dice, resourceCardPicker, longestRoadCardOwner, largestArmyCardOwner, board, currentTurnColor
  } = state;

  function update(newState: Partial<GameStateData>): GameState {
    return makeIntermediateGameState({
      ...state,
      ...newState
    });
  }

  function updatePlayerState(color: PlayerColor, fn: (s: PlayerState) => PlayerState): Map<PlayerColor, PlayerState> {
    verifyColorInGame(color);
    return playerStates.update(color, fn);
  }

  function getLongestRoadCardOwner(): PlayerColor | undefined {
    return getBonusCardOwner(longestRoadCardOwner, c => 0 /* TODO */, MIN_ROADS_FOR_LONGEST_ROAD_CARD);
  }

  function getLargestArmyCardOwner(): PlayerColor | undefined {
    return getBonusCardOwner(largestArmyCardOwner, c => playerStates.get(c)!.numKnightCardsPlayed, MIN_KNIGHTS_FOR_LARGEST_ARM_CARD);
  }

  function getBonusCardOwner(currentOwner: PlayerColor | undefined, countFn: (color: PlayerColor) => number, min: number): PlayerColor | undefined {
    let currentMost = 0;
    let colorWithCurrentMost: PlayerColor | undefined = undefined;

    const counts = playerStates.map((_, c) => countFn(c)).filter(v => v >= min);

    if (!counts.isEmpty()) {
      currentMost = counts.max()!;
      colorWithCurrentMost = counts.keyOf(currentMost)!;
    }

    if (!currentOwner) {
      return colorWithCurrentMost;
    } else {
      const currentOwnerCount = countFn(currentOwner)!;
      return currentOwnerCount >= currentMost ? currentOwner : colorWithCurrentMost;
    }
  }

  function verifyResourceSupplyContains(resources: ResourceCards): void {
    if (!containsResources(resourceCardSupply, resources)) {
      throw new Error("Resource supply does not contain cards");
    }
  }

  function verifyColorInGame(color: PlayerColor): void {
    if (!playerStates.has(color)) {
      throw new Error("Color is not in game");
    }
  }

  function verifyNotOneColorLeft(): void {
    if (playerStates.size === 1) {
      throw new Error("No more colors left in game");
    }
  }

  return {
    ...state,
    largestArmyCardOwner: getLargestArmyCardOwner(),
    longestRoadCardOwner: getLongestRoadCardOwner(),
    removePlayedDevelopmentCard: (color, card) =>
        update({
          playerStates: updatePlayerState(color, p => p.removePlayedDevelopmentCard(card))
        }),
    drawDevelopmentCardFromSupply: () => {
      const card: DevelopmentCard = developmentCardSupply.last();
      return [
        update({developmentCardSupply: developmentCardSupply.pop()}),
        card
      ];
    },
    giveResourceCardsFromPlayer: (color, from, cards) =>
        update({
          playerStates:
              playerStates
              .update(color, p => p.giveResources(cards))
              .update(from, p => p.removeResources(cards))
        }),
    roll: () => {
      const newDice = dice.roll();
      return [update({dice: newDice}), newDice.lastRoll!];
    },
    returnResourcesToSupply: (color, resources) =>
        update({
          playerStates: updatePlayerState(color, p => p.removeResources(resources)),
          resourceCardSupply: addResources(resourceCardSupply, resources)
        }),
    getRandomCardFromHand: color => {
      const [newPicker, card] = resourceCardPicker.pick(playerStates.get(color)!.resourceCards);
      return [update({resourceCardPicker: newPicker}), card]
    },
    countResourceCardsOfType: (color, card) => resourceCount(playerStates.get(color)!.resourceCards, card),
    buildInitialRoadAndSettlement: (color, settlement, road) =>
        update({
          board: board.placeInitialSettlementAndRoad(color, settlement, road),
          playerStates: updatePlayerState(color, s => s.removeRoad().removeSettlement())
        }),
    buildRoad: (color, edge) =>
        update({
          board: board.placeRoad(color, edge),
          playerStates: updatePlayerState(color, s => s.removeRoad())
        }),
    buildSettlement: (color, intersection) =>
        update({
          board: board.placeSettlement(color, intersection),
          playerStates: updatePlayerState(color, s => s.removeSettlement())
        }),
    buildCity: (color, intersection) =>
        update({
          board: board.upgradeSettlementToCity(color, intersection),
          playerStates: updatePlayerState(color, p => p.removeCity())
        }),
    giveDevelopmentCard: (color, card) => update({
      playerStates: updatePlayerState(color, p => p.giveDevelopmentCard(card))
    }),
    giveResourceCardsFromSupply: (color, cards) => {
      verifyResourceSupplyContains(cards);
      return update({
        playerStates: updatePlayerState(color, p => p.giveResources(cards)),
        resourceCardSupply: removeResources(resourceCardSupply, cards)
      });
    },
    moveRobber: coords =>
        update({
          board: board.moveRobber(coords)
        }),
    removePlayer: color => {
      verifyColorInGame(color);
      verifyNotOneColorLeft();

      if (currentTurnColor === color) {
        const newState = update({}).nextTurn();
        return newState.removePlayer(color);
      }

      return update({
        playerStates: playerStates.remove(color)
      });
    },
    nextTurn: () => {
      const colorsInGame = List(playerStates.keys());
      const nextTurnColor = colorsInGame.get((colorsInGame.indexOf(currentTurnColor) + 1) % colorsInGame.size)!;
      return update({
        playerStates: updatePlayerState(nextTurnColor, c => c.nextTurn()),
        currentTurnColor: nextTurnColor
      })
    }
  };
}