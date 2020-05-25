import {Player} from "./player/player";
import {Board} from "./board";
import {Rules} from "./rules/rules";

export function playGame(board: Board,
                         rules: Rules,
                         players: [Player, Player, Player] | [Player, Player, Player, Player],
                         observers: GameObserver[]): Player {
  

}

export interface GameObserver {

}