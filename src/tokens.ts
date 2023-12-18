import * as dotenv from 'dotenv';
import messages from "./messages.json"
import {Collection} from "discord.js";
dotenv.config();

const mapCollection = new Collection<string, string>();
mapCollection.set("Mirage", "UGC");
mapCollection.set("Dust 2", "UGC");
mapCollection.set("Cache", "UGC");
mapCollection.set("Oilrig", "UGC");
mapCollection.set("Inferno", "UGC");
mapCollection.set("Overpass", "UGC");
mapCollection.set("Harbor", "UGC");
mapCollection.set("Industry", "industry");

export default {
    // Sensitive
    BotToken: process.env.BOT_TOKEN ?? '',
    DB_URI: process.env.DB_URI ?? '',
    ClientID: process.env.CLIENT_ID ?? '',
    // Discord stuff
    GuildID: '1152652407856189560',
    Parl: '484100069688344606',
    LogChannel: '1152978645632155829',
    MasterGuild: '1058879957461381251',
    MatchCategory: '1171850272465764402',
    ModRole: '1152657002212884550',
    AdminRole: '1152652534763241542',
    GeneralChannel: '1152652410184024247',
    SNDChannel: '1171851238594318387',
    PingToPlayRole: '1171851420639703150',
    SNDScoreChannel: '1171851522469023836',
    SNDReadyChannel: '1171851194667368459',
    Player: '1171954619585404938',
    WinEmoji: '<:Win:1174459375943946261>',
    LossEmoji: '<:Loss:1174459377709764800>',
    DrawEmoji: '<:Draw:1174459379114848336>',
    ActiveGamesChannel: "1183155071433850960",
    LeaderboardMessage: "1183920824164569130",
    LeaderboardChannel: "1171851273499312159",
    VoteLogChannel: "1185432060173746236",
    LeadModRole: "1175171342736294028",
    RegionRoles: {
        NAE: "1186176045829849089",
        NAW: "1186176099969925160",
        EUE: "1186176160674099281",
        EUW: "1186176183470149762",
        APAC: "1186176140394643456",
    },
    // constants
    StartingMMR: 1500,
    PlayerCount: 10,
    ScoreLimitSND: 10,
    VoteTime: 30,
    AbandonTime: 30,
    Images: {
        Dust2: "https://shackmm.com/static/images/dust2.png",
        Oilrig: "https://shackmm.com/static/images/oilrig.png",
        Mirage: "https://shackmm.com/static/images/mirage.png",
        Vertigo: "https://shackmm.com/static/images/vertigo.png",
        Inferno: "https://shackmm.com/static/images/inferno.png",
        Overpass: "https://shackmm.com/static/images/overpass.png",
        Cache: "https://shackmm.com/static/images/cache.png",
        Harbor: "https://shackmm.com/static/images/harbor.png",
        Industry: "https://shackmm.com/static/images/industry.png"
    },
    MapPool: ["Mirage", "Dust 2", "Cache", "Oilrig", "Inferno", "Overpass", "Harbor", "Industry"],
    PingToPlayTime: 90 * 60,
    Ranks: [
        {name: 'Master', threshold: 1950, roleId: '1152692826669326398'},
        {name: 'Diamond', threshold: 1821, roleId: '1152692676035088464'},
        {name: 'Platinum', threshold: 1701, roleId: '1152692485332664411'},
        {name: 'Gold', threshold: 1611, roleId: '1152692439342141531'},
        {name: 'Silver', threshold: 1551, roleId: '1152692319749931050'},
        {name: 'Bronze', threshold: 1470, roleId: '1152692197439836331'},
        {name: 'Iron', threshold: 1375, roleId: '1152692103256744086'},
        {name: 'Copper', threshold: 1300, roleId: '1152659149017075894'},
        {name: 'Wood', threshold: -99999, roleId: '1152691861186682880'}],
    RankRoles: ['1152692826669326398', '1152692676035088464', '1152692485332664411', '1152692439342141531', '1152692319749931050',
    '1152692197439836331', '1152692103256744086', '1152659149017075894', '1152691861186682880'],
    // messages
    AcceptMessage: messages.acceptMessage,
    SignUpMessage: messages.signUp,
    InfoMessage: messages.info,
}