/**
 * Info a player is given when it's their turn.
 */
import {ObservableGameState, PlayerState} from "..";

export type TurnInfo = {
  readonly player: PlayerState,
  readonly game: ObservableGameState
}