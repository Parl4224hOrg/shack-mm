import tokens from "../tokens";

export const getMapUGC = (mapName: string) => {
    let mapId = "";
    switch (mapName.toLowerCase()) {
        case 'oilrig': mapId = tokens.MapIds.Oilrig; break;
        case 'mirage': mapId = tokens.MapIds.Mirage; break;
        case 'dust 2': mapId = tokens.MapIds.Dust2; break;
        case 'cache': mapId = tokens.MapIds.Cache; break;
        case 'overpass': mapId = tokens.MapIds.Overpass; break;
        case 'inferno': mapId = tokens.MapIds.Inferno; break;
        case 'harbor': mapId = tokens.MapIds.Harbor; break;
        case 'lumber': mapId = tokens.MapIds.Lumber; break;
        case 'industry': mapId = tokens.MapIds.Industry; break;
        case 'reachsky': mapId = tokens.MapIds.Reachsky; break;
        case 'manor': mapId = tokens.MapIds.Manor; break;
        case 'vertigo': mapId = tokens.MapIds.Vertigo; break;
        case 'autumn': mapId = tokens.MapIds.Autumn; break;
        case 'stahl': mapId = tokens.MapIds.Stahl; break;
        case 'stockpile': mapId = tokens.MapIds.Stockpile; break;
        case 'cobble': mapId = tokens.MapIds.Cobble; break;
        case 'streets': mapId = tokens.MapIds.Streets; break;
        case 'japan': mapId = tokens.MapIds.Japan; break;
        default: mapId = "datacenter"; break;
    }
    return mapId;
}

export const getMapImageURL = (mapName: string) => {
    let url = ""
    switch (mapName.toLowerCase()) {
        case 'oilrig': url = tokens.Images.Oilrig; break;
        case 'mirage': url = tokens.Images.Mirage; break;
        case 'dust 2': url = tokens.Images.Dust2; break;
        case 'cache': url = tokens.Images.Cache; break;
        case 'overpass': url = tokens.Images.Overpass; break;
        case 'inferno': url = tokens.Images.Inferno; break;
        case 'harbor': url = tokens.Images.Harbor; break;
        case 'lumber': url = tokens.Images.Lumber; break;
        case 'industry': url = tokens.Images.Industry; break;
        case 'reachsky': url = tokens.Images.Reachsky; break;
        case 'manor': url = tokens.Images.Manor; break;
        case 'vertigo': url = tokens.Images.Vertigo; break;
        case 'stahl': url = tokens.Images.Stahl; break;
        case 'stockpile': url = tokens.Images.Stockpile; break;
        case 'cobble': url = tokens.Images.Cobble; break;
        case 'streets': url = tokens.Images.Streets; break;
        case 'japan': url = tokens.Images.Streets; break;
        default: url = "no-url"; break;
    }
    return url;
}
