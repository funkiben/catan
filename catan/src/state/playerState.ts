import {List} from "immutable";
import {
  addResources,
  containsResources,
  DevelopmentCard,
  emptyResources,
  removeResources,
  ResourceCards
} from "../common/card";

interface PlayerStateData {
  readonly resourceCards: ResourceCards,
  readonly developmentCards: List<DevelopmentCard>,
  readonly developmentCardsBoughtOnTurn: List<DevelopmentCard>,
  readonly roadSupply: number;
  readonly settlementSupply: number;
  readonly citySupply: number;
  readonly numKnightCardsPlayed: number;
  readonly numDevelopmentCardsPlayedOnTurn: number;
  readonly rolledDice: boolean;
}

export interface PlayerState extends PlayerStateData {
  removeResources(cards: ResourceCards): this;

  removePlayedDevelopmentCard(card: DevelopmentCard): this;

  giveResources(cards: ResourceCards): this;

  giveDevelopmentCard(card: DevelopmentCard): this;

  removeRoad(): this;

  removeSettlement(): this;

  removeCity(): this;

  rollDice(): this;

  nextTurn(): this;
}

export function makePlayerState(roadSupply: number, settlementSupply: number, citySupply: number): PlayerState {
  if (roadSupply < 0) {
    throw new Error("Road supply can not be negative");
  }

  if (settlementSupply < 0) {
    throw new Error("Settlement supply can not be negative");
  }

  if (citySupply < 0) {
    throw new Error("City supply can not be negative");
  }

  return makeIntermediatePlayerState({
    roadSupply,
    settlementSupply,
    citySupply,
    resourceCards: emptyResources(),
    developmentCards: List(),
    developmentCardsBoughtOnTurn: List(),
    numKnightCardsPlayed: 0,
    rolledDice: false,
    numDevelopmentCardsPlayedOnTurn: 0,
  });
}


function makeIntermediatePlayerState(state: PlayerStateData): PlayerState {
  const {
    resourceCards, developmentCards, numDevelopmentCardsPlayedOnTurn, developmentCardsBoughtOnTurn, numKnightCardsPlayed,
    citySupply, roadSupply, settlementSupply
  } = state;

  function update(newState: Partial<PlayerStateData>): PlayerState {
    return makeIntermediatePlayerState({
      ...state,
      ...newState
    });
  }

  function verifyPlayerHasDevelopmentCard(card: DevelopmentCard) {
    if (!developmentCards.contains(card)) {
      throw new Error("Player does not have any " + card + " development card");
    }
  }

  function verifyPlayerHasResourceCards(cards: ResourceCards) {
    if (!containsResources(resourceCards, cards)) {
      throw new Error("Player does not have resource cards");
    }
  }

  function verifyRoadSupplyPositive() {
    if (roadSupply <= 0) {
      throw new Error("Road supply is empty.");
    }
  }

  function verifySettlementSupplyPositive() {
    if (settlementSupply <= 0) {
      throw new Error("Settlement supply is empty.");
    }
  }

  function verifyCitySupplyPositive() {
    if (citySupply <= 0) {
      throw new Error("City supply is empty.");
    }
  }

  return {
    ...state,
    giveDevelopmentCard: card => update({
      developmentCardsBoughtOnTurn: developmentCardsBoughtOnTurn.push(card)
    }),
    giveResources: cards => update({
      resourceCards: addResources(resourceCards, cards)
    }),
    removePlayedDevelopmentCard: card => {
      verifyPlayerHasDevelopmentCard(card);
      return update({
        developmentCards: developmentCards.remove(developmentCards.indexOf(card)),
        numDevelopmentCardsPlayedOnTurn: numDevelopmentCardsPlayedOnTurn + 1,
        numKnightCardsPlayed: card === "KNIGHT" ? numKnightCardsPlayed + 1 : numKnightCardsPlayed
      });
    },
    removeResources: cards => {
      verifyPlayerHasResourceCards(cards);
      return update({
        resourceCards: removeResources(resourceCards, cards)
      });
    },
    removeRoad: () => {
      verifyRoadSupplyPositive();
      return update({
        roadSupply: roadSupply - 1
      })
    },
    removeSettlement: () => {
      verifySettlementSupplyPositive();
      return update({
        settlementSupply: settlementSupply - 1
      })
    },
    removeCity: () => {
      verifyCitySupplyPositive();
      return update({
        citySupply: citySupply - 1
      })
    },
    nextTurn: () => update({
      rolledDice: false,
      developmentCards: developmentCards.concat(developmentCardsBoughtOnTurn),
      developmentCardsBoughtOnTurn: List(),
      numDevelopmentCardsPlayedOnTurn: 0
    }),
    rollDice: () => update({
      rolledDice: true
    })
  };
}