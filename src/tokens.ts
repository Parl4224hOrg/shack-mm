import * as dotenv from 'dotenv';
import messages from "./messages.json"
dotenv.config();

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
        Cache: "https://shackmm.com/static/images/oilrig.png",
    },
    MapPool: ["Mirage", "Dust 2", "Cache", "Oilrig", "Inferno", "Overpass", "Vertigo"],
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
    // messages
    AcceptMessage: messages.acceptMessage,
    SignUpMessage: messages.signUp,
    InfoMessage: messages.info,
}