import {List} from "immutable";

/**
 * The different types of resource cards.
 */
export type ResourceCard = "WOOD" | "SHEEP" | "BRICK" | "STONE" | "WHEAT";

/**
 * The different types of development cards.
 */
export type DevelopmentCard = "VICTORYPOINT" | "MONOPOLY" | "ROADBUILDING" | "YEAROFPLENTY" | "KNIGHT";

export const ALL_RESOURCE_CARD_TYPES: List<ResourceCard> = List(["WOOD", "SHEEP", "BRICK", "STONE", "WHEAT"]);

export type ResourceCards = List<ResourceCard>;

export function containsResources(resources: ResourceCards, contained: ResourceCards): boolean {
  return ALL_RESOURCE_CARD_TYPES.every(card => resourceCount(resources, card) >= resourceCount(contained, card));
}

export function containsResource(cards: ResourceCards, card: ResourceCard, count: number): boolean {
  return resourceCount(cards, card) >= count;
}

export function resourceCount(cards: ResourceCards, card: ResourceCard) {
  return cards.filter(c => card === c).size;
}

export function addResource(cards: ResourceCards, card: ResourceCard, count: number = 1): ResourceCards {
  for (let i = 0; i < count; i++) {
    cards = cards.push(card);
  }
  return cards;
}

export function removeResources(resources: ResourceCards, toRemove: ResourceCards): ResourceCards {
  return toRemove.reduce((newResources, remove) => newResources.remove(newResources.indexOf(remove)), resources)
}

export function removeAllResources(resources: ResourceCards, toRemove: ResourceCard): ResourceCards {
  return resources.filter(r => r === toRemove);
}

export function makeResourceCards(resource: ResourceCard, count: number) {
  return addResource(List(), resource, count);
}