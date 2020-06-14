import {ALL_RESOURCE_CARD_TYPES, ResourceCard, ResourceCards, resourceCount} from "../common/card";
import {RollNumber} from "../admin/admin";
import {List} from "immutable";

export interface Dice {
  readonly lastRoll?: RollNumber,

  roll(): Dice
}

export interface ResourceCardPicker {
  pick(card: ResourceCards): [ResourceCardPicker, ResourceCard];
}

export function makeDeterministicDice(rollNumbers: List<RollNumber>): Dice {
  if (rollNumbers.isEmpty()) {
    throw new Error("Roll numbers list must contain at least one value");
  }

  function make(rollNumbers: List<RollNumber>, lastRoll?: RollNumber) {
    return {
      lastRoll,
      roll: () => make(rollNumbers.shift().push(rollNumbers.first()), rollNumbers.first())
    }
  }

  return make(rollNumbers);
}

function makeDeterministicResourceCardPicker(priorities: [ResourceCard, ResourceCard, ResourceCard, ResourceCard, ResourceCard]): ResourceCardPicker {
  if (!ALL_RESOURCE_CARD_TYPES.every(c => priorities.includes(c))) {
    throw new Error("Resource priority list must contain one resource card for each type");
  }

  let p: ResourceCardPicker;
  return p = {
    pick: cards => {
      for (const card of priorities) {
        if (resourceCount(cards, card) > 0) {
          return [p, card];
        }
      }
      return [p, priorities[0]];
    }
  };
}