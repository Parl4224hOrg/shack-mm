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
    SNDReadyChannel: '1132393001222684754',
    PingToPlayRole: '1129841343657672846',
    // constants
    StartingMMR: 1500,
    PlayerCount: 4,
    ScoreLimitSND: 7,
    Images: {
        Factory: 'https://usercontent.one/wp/www.breachersvr.com/wp-content/uploads/2023/04/Thumb_Factory-1024x576.png?media=1678957731',
        Hideout: 'https://usercontent.one/wp/www.breachersvr.com/wp-content/uploads/2023/04/Thumb_Hideout-1024x576.png?media=1678957731',
        Skyscraper: 'https://usercontent.one/wp/www.breachersvr.com/wp-content/uploads/2023/04/Thumb_Skyscraper-1024x576.png?media=1678957731',
    },
    PingToPlayTime: 90 * 60,
    // messages
    AcceptMessage: messages.acceptMessage,
}