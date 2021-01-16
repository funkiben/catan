import {Player} from "./player/player";
import {Admin} from "./admin/admin";

export interface Lobby {
  join(player: Player, playerName: string, gameId?: string): void;

}

export interface LobbyPlayer extends Player {
  notifyPlayerJoinedLobby(name: string): void;
  notifyPlayerLeftLobby(name: string): void;
}