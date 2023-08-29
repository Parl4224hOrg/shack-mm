import * as dotenv from 'dotenv';
import messages from "./messages.json"
dotenv.config();

export default {
    // Sensitive
    BotToken: process.env.BOT_TOKEN ?? '',
    DB_URI: process.env.DB_URI ?? '',
    ClientID: process.env.CLIENT_ID ?? '',
    // Discord stuff
    GuildID: '1129259123469463553',
    Parl: '484100069688344606',
    LogChannel: '1130225132808437892',
    MasterGuild: '1058879957461381251',
    MatchCategory: '1130510559029248000',
    ModRole: '1129259508330418207',
    EveryoneRole: '1129259123469463553',
    GeneralChannel: '1129259124933283923',
    SNDReadyChannel: '1129260084258672651',
    PingToPlayRole: '1129841343657672846',
    SNDScoreChannel: '1138955169405616219',
    // constants
    StartingMMR: 1500,
    PlayerCount: 10,
    ScoreLimitSND: 7,
    Images: {
        Factory: 'https://usercontent.one/wp/www.breachersvr.com/wp-content/uploads/2023/04/Thumb_Factory-1024x576.png?media=1678957731',
        Hideout: 'https://usercontent.one/wp/www.breachersvr.com/wp-content/uploads/2023/04/Thumb_Hideout-1024x576.png?media=1678957731',
        Skyscraper: 'https://usercontent.one/wp/www.breachersvr.com/wp-content/uploads/2023/04/Thumb_Skyscraper-1024x576.png?media=1678957731',
    },
    PingToPlayTime: 90 * 60,
    Ranks: [
        {name: 'Global Elite', threshold: 1821, roleId: '1129276038866796605'},
        {name: 'Diamond 1', threshold: 1701, roleId: '1129276155044835400'},
        {name: 'Plat', threshold: 1611, roleId: '1129276228763914360'},
        {name: 'Gold', threshold: 1551, roleId: '1129275935376551946'},
        {name: 'Silver', threshold: 1470, roleId: '1129276005652115506'},
        {name: 'Copper', threshold: 1375, roleId: '1129275941764472862'},
        {name: 'Bronze', threshold: 1300, roleId: '1129275882582839457'},
        {name: 'Hot Garbage', threshold: -99999, roleId: '1129275764752252998'}],
    // messages
    AcceptMessage: messages.acceptMessage,
}