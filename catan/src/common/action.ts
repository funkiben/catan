import {Edge, Harbor, HexCoords, Intersection, PlayerColor, ResourceCard, ResourceCards} from "..";

export interface InitialTurnAction {
  readonly settlement: Intersection;
  readonly road: Edge;
}

export type MoveRobberAction = {
  readonly coords: HexCoords;
  readonly stealFrom?: PlayerColor;
}

export type DiscardHalfOfResourceCardsAction = {
  readonly toDiscard: ResourceCards;
}

export type TurnAction =
    BuildSettlementAction
    | BuildCityAction
    | BuildRoadAction
    | DomesticTradeAction
    | MaritimeTradeAction
    | BuyDevelopmentCardAction
    | PlayKnightCardAction
    | PlayMonopolyCardAction
    | PlayRoadBuildingCardAction
    | PlayYearOfPlentyCardAction
    | RollDiceAction
    | EndTurnAction;

export type TurnActionName = TurnAction["name"];

export type RollDiceAction = {
  readonly name: "rollDice";
};

export type BuildSettlementAction = {
  readonly name: "buildSettlement";
  readonly intersection: Intersection;
}

export type BuildCityAction = {
  readonly name: "buildCity";
  readonly intersection: Intersection;
}

export type BuildRoadAction = {
  readonly name: "buildRoad";
  readonly edge: Edge
}

export type DomesticTradeAction = {
  readonly name: "domesticTrade";
  readonly iGiveYou: ResourceCards;
  readonly youGiveMe: ResourceCards;
  readonly to: PlayerColor;
}

export type MaritimeTradeAction = {
  readonly name: "maritimeTrade";
  readonly harbor: Harbor;
  readonly give?: ResourceCard;
  readonly receive: ResourceCard;
}

export type PlayKnightCardAction = MoveRobberAction & { readonly name: "playKnightCard" };

export type PlayMonopolyCardAction = {
  readonly name: "playMonopolyCard";
  readonly resource: ResourceCard;
}

export type PlayRoadBuildingCardAction = {
  readonly name: "playRoadBuildingCard";
  readonly edge1: Edge;
  readonly edge2?: Edge;
}

export type PlayYearOfPlentyCardAction = {
  readonly name: "playYearOfPlentyCard";
  readonly cards: ResourceCards;
}

export type BuyDevelopmentCardAction = {
  readonly name: "buyDevelopmentCard";
}

export type EndTurnAction = {
  readonly name: "endTurn";
}

export type TurnActionVisitor<T> = {
  [P in TurnActionName]: (action: Extract<TurnAction, Omit<TurnAction, "name"> & { readonly name: P }>) => T;
};

export function visitTurnAction<T>(action: TurnAction, visitor: TurnActionVisitor<T>): T {
  return visitor[action.name]!(<any>action);
}