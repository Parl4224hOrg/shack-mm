import * as dotenv from 'dotenv';
import messages from "./messages.json";
dotenv.config();


export default {
    // Sensitive
    BotToken: process.env.BOT_TOKEN ?? '',
    DB_URI: process.env.DB_URI ?? '',
    ClientID: process.env.CLIENT_ID ?? '',
    BotKey: process.env.BOT_KEY ?? 'no-key',
    ServerKey: process.env.SERVER_KEY ?? 'no-key',
    // Discord stuff
    GuildID: '1152652407856189560',
    Parl: '484100069688344606',
    LogChannel: '1250198758625382420',
    MasterGuild: '1204816540231401472',
    MatchCategory: '1171850272465764402',
    ModRole: '1152657002212884550',
    AdminRole: '1152652534763241542',
    OwnerRole: '1204928541045825636',
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
    GameLogChannel: "1185432060173746236",
    QueueLogChannel: "1191799332924559360",
    ModeratorLogChannel: "1249964183588438158",
    RefereeLogChannel: "1252310023116161075",
    LeadModRole: "1175171342736294028",
    RegionRoles: {
        NAE: "1186176045829849089",
        NAW: "1186176099969925160",
        EUE: "1186176160674099281",
        EUW: "1186176183470149762",
        APAC: "1186176140394643456",
    },
    RegionRoleArray: ["1186176045829849089", "1186176099969925160", "1186176160674099281", "1186176183470149762", "1186176140394643456"],
    RegionSelect: "1186501237517070367",
    DoNotPing: "1186750217962401844",
    ScoreboardChannel: "1182844040937484339",
    MutedRole: "1186750217962401844",
    Mods: ['1152657002212884550', '1200954518590984313'],
    StreamerRole: "1286113718635204648",
    MapTesterRole: "1295849188730470450",
    MapMakerRole: "1288107816397045801",
    MapTestAnnouncementChannel: "1295856528494170224",
    PlaytestLogChannel: "1328152474640453703",
    // constants
    ApplyLates: true,
    StartingMMR: 1300,
    PlayerCount: 10,
    ScoreLimitSND: 10,
    VoteTime: 30,
    VoteSize: 7,
    AbandonTime: 30,
    Images: {
        Dust2: "https://shackmm.com/static/images/map/c80a4af9-a05c-4e1e-a290-a883d45e27c4.jpg",
        Oilrig: "https://shackmm.com/static/images/map/83f94459-d196-4caa-b822-169b9dd9454f.png",
        Mirage: "https://shackmm.com/static/images/map/80b27ad0-bc83-4aa3-8387-46115c72ba52.png",
        Vertigo: "https://shackmm.com/static/images/map/3f2c8b6f-8482-4b41-a706-5f6991d31b04.jpg",
        Inferno: "https://shackmm.com/static/images/map/26c1f6e5-480c-4222-863e-d39ea530b829.png",
        Overpass: "https://shackmm.com/static/images/map/ec664067-cfeb-4cde-bb28-5285cefb874a.png",
        Cache: "https://shackmm.com/static/images/map/8fa7c04f-094f-4f0b-a05f-140a51f4dea1.png",
        Harbor: "https://shackmm.com/static/images/map/b28041c5-3bfa-4431-9a92-293eb5f7ac4b.png",
        Industry: "https://shackmm.com/static/images/map/e9f1cb8d-bd9c-4d99-b25a-a03ee1886acd.png",
        Lumber: "https://shackmm.com/static/images/lumber.png",
        Reachsky: "https://shackmm.com/static/images/map/fb2c1b87-2087-454d-90ba-9243f0c063f8.png",
        Manor: "https://shackmm.com/static/images/map/791df2df-1dc7-443d-9bd0-0fbfc26569b0.png",
        Stahl: "https://shackmm.com/static/images/map/4fa3a201-02cc-45b9-a7ef-b4f3fb93020a.jpg",
        Stockpile: "https://shackmm.com/static/images/map/5ab3b5fd-f007-4c6f-94f5-736bd08b3dab.jpg",
        Cobble: "https://shackmm.com/static/images/map/c03e3999-eba7-4a86-877b-0d6ff48fe1f8.jpg",
        Streets: "https://shackmm.com/static/images/map/c9ccae8d-4be2-4b4a-b8d9-118be4a47f73.png",
        Japan: "https://shackmm.com/static/images/map/bcae9819-fec6-48be-a267-538f057b0a0f.png",
    },
    ReductionGames: 10,
    MapPool: ["Japan", "Manor", "Streets", "Harbor", "Stockpile", "Oilrig", "Cobble", "Cache", "Vertigo", "Mirage", "Stahl", "Overpass", "Dust 2", "Inferno"],
    PingToPlayTime: 90 * 60,
    Ranks: [
        {name: 'Grandmaster', threshold: 2300, roleId: '1285641380600877157'},
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
    RankedRole: '1225164446263939203',
    // messages
    AcceptMessage: messages.acceptMessage,
    SignUpMessage: messages.signUp,
    InfoMessage: messages.info,
    RegionSelectMessage: messages.region,
    NoMessage: messages.no,
    // servers
    Servers: [
        {
            ip: "15.204.218.198",
            port: 9100,
            password: process.env.RCON_PASS ?? "NO PASSWORD",
            name: "NAE-ONE shackmm.com",
            id: "NAE-ONE"
        },
        {
            ip: "15.204.218.215",
            port: 9100,
            password: process.env.RCON_PASS ?? "NO PASSWORD",
            name: "NAE-TWO shackmm.com",
            id: "NAE-TWO"
        }
    ],
    MapIds: {
        Oilrig: "UGC4499790",
        Mirage: "UGC4438747",
        Dust2: "UGC4460907",
        Cache: "UGC3275597",
        Overpass: "UGC3283728",
        Inferno: "UGC4565441",
        Harbor: "harbor",
        Industry: "industry",
        Lumber: "UGC3505396",
        Reachsky: "UGC3748612",
        Manor: "UGC3765846",
        Vertigo: "UGC4500480",
        Autumn: "autumn",
        Whitesand: "UGC3263736",
        Stahl: "UGC4332873",
        Stockpile: "UGC4397184",
        Cobble: "UGC4366923",
        Flashpoint: "UGC3238058",
        Streets: "UGC4338327",
        Japan: "UGC4469362",
    }
}
