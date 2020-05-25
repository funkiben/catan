import {HexEdge, HexVertex, PlayerColor} from "../board";
import {ResourceCard} from "./player";

export type InitialTurnAction = {
  readonly q: number;
  readonly r: number;
  readonly settlementVertex: HexVertex;
  readonly roadEdge: HexEdge;
}

export type Action =
    BuildSettlementAction
    | BuildCityAction
    | BuildRoadAction
    | ExchangeCardsAction
    | TradeWithPlayerAction
    | BuyDevelopmentCardAction
    | MoveRobberAction
    | PlayMonopolyCard
    | PlayRoadBuildingCard
    | PlayYearOfPlentyCard;

export type PlayDevelopmentCardAction =
    MoveRobberAction
    | PlayMonopolyCard
    | PlayRoadBuildingCard
    | PlayYearOfPlentyCard;

export type BuildSettlementAction = {
  readonly building: "SETTLEMENT";
  readonly q: number;
  readonly r: number;
  readonly vertex: HexVertex;
}

export type BuildCityAction = {
  readonly building: "CITY";
  readonly q: number;
  readonly r: number;
  readonly vertex: HexVertex;
}

export type BuildRoadAction = {
  readonly q: number;
  readonly r: number;
  readonly edge: HexEdge;
}

export type ExchangeCardsAction = {
  readonly give: ResourceCard[];
  readonly receive: ResourceCard[];
}

export type TradeWithPlayerAction = {
  readonly give: ResourceCard[];
  readonly receive: ResourceCard[];
  readonly to: PlayerColor;
}

export type MoveRobberAction = {
  readonly q: number;
  readonly r: number;
  readonly playerToStealFrom: PlayerColor;
}

export type PlayMonopolyCard = {
  readonly resource: ResourceCard;
}

export type PlayRoadBuildingCard = {
  readonly q1: number;
  readonly r1: number;
  readonly edge1: HexEdge;
  readonly q2: number;
  readonly r2: number;
  readonly edge2: HexEdge;
}

export type PlayYearOfPlentyCard = {
  readonly card1: ResourceCard;
  readonly card2: ResourceCard;
}

export type BuyDevelopmentCardAction = "developmentcart";

// TODO write all the predicates....

export function isBuildSettlementAction(action: Action): BuildSettlementAction | false {
  const a = action as BuildSettlementAction;
  return a.building === 'SETTLEMENT' && a;
}

export function isBuildCityAction(action: Action): BuildCityAction | false {
  const a = action as BuildCityAction;
  return a.building === 'CITY' && a;
}

export function isBuildRoadAction(action: Action): BuildRoadAction | false {
  const a = action as BuildRoadAction;
  return a.edge && a;
}
