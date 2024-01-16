interface PlayerInspect {
    PlayerName: string;
    UniqueId: string;
    KDA: string;
    Score: string;
    Dead: boolean;
    Cash: string;
    TeamId: string;
    Ping: number;
    Gag: boolean;
}

export interface BaseCommandResponse {
    Command: string;
    Successful: boolean;
}

export interface InspectAllResponse extends BaseCommandResponse {
    InspectList: PlayerInspect[];
}

export interface InspectPlayerResponse extends BaseCommandResponse {
    PlayerInfo: PlayerInspect;
}

export interface InspectTeamResponse extends BaseCommandResponse {
    InspectList: PlayerInspect[];
}

export interface RefreshListResponse extends BaseCommandResponse {
    PlayerList: {
        Username: string;
        UniqueId: string;
    }[]
}

export interface ResetSNDResponse extends BaseCommandResponse {
    ResetSND: boolean;
}

export interface PauseMatchResponse extends BaseCommandResponse {
    PauseTime: number;
    PauseMatch: boolean;
}

export interface RotateMapResponse extends BaseCommandResponse {
    RotateMap: boolean;
}

export interface ServerInfoResponse extends BaseCommandResponse {
    ServerInfo: {
        MapLabel: string;
        GameMode: string;
        ServerName: string;
        Teams: boolean;
        Team0Score: string;
        Team1Score: string;
        Round: string;
        RoundState: string;
        PlayerCount: string;
    };
}

export interface SetPinResponse extends BaseCommandResponse {
    Successful: boolean;
}

export interface SwitchMapResponse extends BaseCommandResponse {
    SwitchMap: boolean;
}

export interface UpdateServerNameResponse extends BaseCommandResponse {
    UpdateServerName: boolean;
}

export interface KickResponse extends BaseCommandResponse {
    UniqueID: string;
    Kick: boolean;
}
