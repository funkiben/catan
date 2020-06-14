import {PlayerState, resourceCount} from "..";

export interface ObservablePlayerState {
  readonly numResourceCards: number;
  readonly roadSupply: number;
  readonly settlementSupply: number;
  readonly citySupply: number;
  readonly numDevelopmentCards: number;
  readonly numKnightCardsPlayed: number;
  readonly numDevelopmentCardsBoughtOnTurn: number;
  readonly numDevelopmentCardsPlayedOnTurn: number;
  readonly rolledDice: boolean;
}

export function makeObservablePlayerState(state: PlayerState): ObservablePlayerState {
  const {
    resourceCards, roadSupply, settlementSupply, citySupply, developmentCards, numDevelopmentCardsPlayedOnTurn,
    developmentCardsBoughtOnTurn, numKnightCardsPlayed, rolledDice
  } = state;
  return {
    numResourceCards: resourceCards.size,
    numDevelopmentCards: developmentCards.size,
    numDevelopmentCardsBoughtOnTurn: developmentCardsBoughtOnTurn.size,
    numDevelopmentCardsPlayedOnTurn,
    roadSupply,
    settlementSupply,
    citySupply,
    rolledDice,
    numKnightCardsPlayed
  };
}
