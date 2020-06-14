import {Map, List} from "immutable";

/**
 * The different types of resource cards.
 */
export type ResourceCard = "WOOD" | "SHEEP" | "BRICK" | "STONE" | "WHEAT";

/**
 * A collection of resource cards.
 */
export type ResourceCards = Map<ResourceCard, number>;

/**
 * The different types of development cards.
 */
export type DevelopmentCard = "VICTORYPOINT" | "MONOPOLY" | "ROADBUILDING" | "YEAROFPLENTY" | "KNIGHT";

// TODO combine this with type
export const ALL_RESOURCE_CARD_TYPES: List<ResourceCard> = List(["WOOD", "SHEEP", "BRICK", "STONE", "WHEAT"]);

export function containsResources(toCheck: ResourceCards, resources: ResourceCards): boolean {
  return resources.every((count, card) => containsResource(toCheck, card, count));
}

export function containsResource(cards: ResourceCards, card: ResourceCard, count: number): boolean {
  return cards.get(card, 0) >= count;
}

export function resourceCount(cards: ResourceCards, card?: ResourceCard) {
  return card ? cards.get(card, 0) : cards.reduce((n, c) => n + c, 0);
}

export function addResource(cards: ResourceCards, card: ResourceCard, count: number = 1): ResourceCards {
  return cards.update(card, 0, c => c + count);
}

export function addResources(cards: ResourceCards, cardsToAdd: ResourceCards): ResourceCards {
  return cardsToAdd.reduce((result, count, card) => addResource(cards, card, count), cards);
}

export function removeResources(resources: ResourceCards, toRemove: ResourceCards): ResourceCards {
  return toRemove.reduce((cards, amount, card) => cards.update(card, cur => cur - amount), resources);
}

export function emptyResources(): ResourceCards {
  return Map();
}

export function makeResources(card: ResourceCard, amount: number): ResourceCards {
  return Map([[card, amount]]);
}