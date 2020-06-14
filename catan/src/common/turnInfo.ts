/**
 * Info a player is given when it's their turn.
 */
import {ObservableGameState} from "../state/observableGameState";
import {PlayerState} from "../state/playerState";

export type TurnInfo = {
  readonly player: PlayerState,
  readonly game: ObservableGameState
}