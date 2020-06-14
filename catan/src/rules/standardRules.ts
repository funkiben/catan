import {List} from "immutable";
import {
  CITY_COST,
  containsResource,
  containsResources,
  DEVELOPMENT_CARD_COST,
  DevelopmentCard,
  Harbor,
  makeHarbor,
  ResourceCard,
  resourceCount,
  ROAD_COST,
  Rules,
  SETTLEMENT_COST,
  visitTurnAction
} from "..";

export const GLOBAL_HARBOR: Harbor = makeHarbor("ANY", 4);

export const DEVELOPMENT_CARD_PLAY_LIMIT = 1;

export const VICTORY_POINTS_PER_SETTLEMENT = 1;
export const VICTORY_POINTS_PER_CITY = 2;
export const VICTORY_POINTS_LONGEST_ROAD_CARD = 2;
export const VICTORY_POINTS_LARGEST_ARMY_CARD = 2;
export const VICTORY_POINTS_PER_VICTORY_POINT_CARD = 1;
export const VICTORY_POINTS_FOR_WIN = 10;

export const YEAR_OF_PLENTY_RESOURCE_CARDS = 2;

/**
 * Standard implementation of rules according to https://www.catan.com/
 */
export function standardRules(): Rules {
  let rules: Rules;

  return rules = {
    isTurnActionValid: (color, info, action) => {
      const {
        player: {rolledDice, roadSupply, settlementSupply, citySupply, resourceCards, numDevelopmentCardsPlayedOnTurn, developmentCards},
        game: {board, developmentCardSupplyCount, playerStates, resourceCardSupply}
      } = info;

      function canPlayDevelopmentCard(card: DevelopmentCard): boolean {
        return numDevelopmentCardsPlayedOnTurn < DEVELOPMENT_CARD_PLAY_LIMIT
            && developmentCards.contains(card);
      }

      return visitTurnAction(action, {
        endTurn: () => rolledDice,
        rollDice: () => !rolledDice,
        buildCity: ({intersection}) => {
          try {
            board.upgradeSettlementToCity(color, intersection);
          } catch (e) {
            return false;
          }
          return rolledDice && citySupply > 0 && containsResources(resourceCards, CITY_COST);
        },
        buildRoad: ({edge}) => {
          try {
            board.placeRoad(color, edge);
          } catch (e) {
            return false;
          }
          return rolledDice && roadSupply > 0 && containsResources(resourceCards, ROAD_COST);
        },
        buildSettlement: ({intersection}) => {
          try {
            board.placeSettlement(color, intersection);
          } catch (e) {
            return false;
          }
          return rolledDice && settlementSupply > 0 && containsResources(resourceCards, SETTLEMENT_COST);
        },
        buyDevelopmentCard: () =>
            rolledDice
            && developmentCardSupplyCount > 0
            && containsResources(resourceCards, DEVELOPMENT_CARD_COST),
        maritimeTrade: ({harbor, receive, give}) =>
            rolledDice
            && (harbor.equal(GLOBAL_HARBOR) || board.isCityOrSettlementOfColorOnHarbor(color, harbor))
            && (give ? harbor.card === "ANY" : harbor.card !== "ANY")
            && resourceCount(resourceCardSupply, receive) > 0
            && containsResource(resourceCards, give || <ResourceCard>harbor.card, harbor.amount),
        playKnightCard: action =>
            canPlayDevelopmentCard("KNIGHT")
            && rules.isMoveRobberActionValid(color, info, action),
        playMonopolyCard: () =>
            canPlayDevelopmentCard("MONOPOLY"),
        playRoadBuildingCard: ({edge1, edge2}) => {
          if (roadSupply === 0 || (roadSupply === 1 && edge2)) {
            return false;
          }
          if (edge2) {
            try {
              board.placeRoad(color, edge1).placeRoad(color, edge2);
            } catch (e) {
              try {
                board.placeRoad(color, edge2).placeRoad(color, edge1);
              } catch (e) {
                return false;
              }
            }
          } else {
            try {
              board.placeRoad(color, edge1);
            } catch (e) {
              return false;
            }
          }
          return canPlayDevelopmentCard("ROADBUILDING");
        },
        playYearOfPlentyCard: ({cards}) =>
            canPlayDevelopmentCard("YEAROFPLENTY")
            && cards.size <= YEAR_OF_PLENTY_RESOURCE_CARDS
            && cards.size > 0
            && containsResources(resourceCardSupply, cards),
        domesticTrade: ({iGiveYou, youGiveMe, to}) =>
            rolledDice
            && to != color
            && playerStates.has(to)
            && (iGiveYou.size > 0 || youGiveMe.size > 0)
            && containsResources(resourceCards, iGiveYou)
      })
    },
    isMoveRobberActionValid: (color, {game: {board, playerStates}}, {coords, stealFrom}) => {
      try {
        board.moveRobber(coords);
      } catch {
        return false;
      }
      if (!stealFrom) return true;
      return playerStates.has(stealFrom)
          && stealFrom != color
          && playerStates.get(stealFrom)!.numResourceCards > 0
          && (board.numCitiesOfColorOnTile(stealFrom, coords) > 0 || board.numSettlementsOfColorOnTile(stealFrom, coords) > 0)
    },
    getVictoryPoints:
        (color, {game: {board, longestRoadCardOwner, largestArmyCardOwner}, player: {developmentCards}}) =>
            board.settlements.get(color, List()).size * VICTORY_POINTS_PER_SETTLEMENT
            + developmentCards.filter(d => d === "VICTORYPOINT").size * VICTORY_POINTS_PER_VICTORY_POINT_CARD
            + board.cities.get(color, List()).size * VICTORY_POINTS_PER_CITY
            + (longestRoadCardOwner === color ? VICTORY_POINTS_LONGEST_ROAD_CARD : 0)
            + (largestArmyCardOwner === color ? VICTORY_POINTS_LARGEST_ARMY_CARD : 0),
    isInitialTurnActionValid:
        (color, {game: {board}}, {settlement, road}) => {
          try {
            board.placeInitialSettlementAndRoad(color, settlement, road);
            return true;
          } catch (e) {
            return false;
          }
        },
    canAcceptTrade:
        (color, {player: {resourceCards}}, {youGiveMe}) =>
            containsResources(resourceCards, youGiveMe),
    isDiscardHalfOfResourceCardsActionValid:
        (color, {player: {resourceCards}}, {toDiscard}) =>
            toDiscard.size === Math.floor(resourceCards.size / 2)
            && containsResources(resourceCards, toDiscard),
    hasWon: (color, info) =>
        rules.getVictoryPoints(color, info) === VICTORY_POINTS_FOR_WIN
  }
}