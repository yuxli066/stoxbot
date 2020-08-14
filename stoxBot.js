const discord = require('discord.js');
const client = new discord.Client();
const {spawn} = require('child_process');
require('dotenv').config();
// Global Variables
const discordAPIKey = process.env.discordAPIKey;
const stoxGeneralId = process.env.stoxGeneralId;
const omBotId = process.env.omBotId;
const twmRedditScraperId = process.env.twmRedditScraperId;
const twmInsiderStoxBotId = process.env.twmInsiderStoxBotId;
const twmValorantId = process.env.twmValorantId;
const wardellTwitchUrl = process.env.wardellTwitchUrl;
client.login(discordAPIKey);

// ------------- discord listeners -------------
client.on('ready', () => {
    console.log('Connected as ' + client.user.tag);
    client.user.setActivity('Stox', {type: 'WATCHING'});
    client.guilds.cache.forEach((guild) => {
        console.log(guild.name);
        guild.channels.cache.forEach((channel) => {
            console.log(` - Name:${channel.name} Type:${channel.type} Id:${channel.id}`);
        });
    });
    let generalTextChannel = client.channels.cache.get(stoxGeneralId);
    generalTextChannel.send('Hello Everyone!');
});
client.on('message',(received) => {
    // console.log('%s said \'%s\' in the discord \'%s\', channel: \'%s\' with id: \'%s\'', received.author.username, received.content, received.guild.name, received.channel.name, received.channel.id);
    let receivedChannel = received.channel.id;
    let replyChannel = client.channels.cache.get(receivedChannel);
    if (received.author === client.user)
        return;
    if (received.content.startsWith('!')) { processCommand(received,receivedChannel,replyChannel); }
    else { if (received.content.includes('@stoxBot')) { processMessage(received); }}
});

// ------------- process messages and commands -------------
function processMessage(message) {
    message.channel.send('I got your message, ' + message.author.toString() + ', I\'m just not sure what to say yet.');
    message.react('🙂');
}
function processCommand(receivedCommand,receivedChannel,replyChannel) {
    let fullCommand = receivedCommand.content.substr(1);
    let splitCommand = fullCommand.split(' ');
    let primaryCommand = splitCommand[0].toLowerCase().trim();
    let args = splitCommand.slice(1);
    console.log('Running Command:',primaryCommand);
    switch (true) {
        case (primaryCommand === 'help' && [stoxGeneralId,omBotId].includes(receivedChannel)):
            return helpCommand(args, receivedCommand,replyChannel);
        case (primaryCommand === 'valorant' && [stoxGeneralId,omBotId,twmValorantId].includes(receivedChannel)):
            return valorantCommand(args,receivedCommand,replyChannel);
        case (primaryCommand === 'volume' && [stoxGeneralId,omBotId,twmInsiderStoxBotId].includes(receivedChannel)):
            return scrapeVolume(args, receivedCommand,replyChannel);
        case (!primaryCommand && [stoxGeneralId,omBotId,twmInsiderStoxBotId,twmValorantId,twmRedditScraperId].includes(receivedChannel)):
            replyChannel.send("Please use a valid command!");
            // tell user to use help and add in help command later
            break;
        default:
            return redditScrape(args, receivedCommand, primaryCommand,receivedChannel,replyChannel);
    }
}

// ------------- run python script, help command, scrape reddit, scrape unusual volumes, valorant -------------
async function runPythonScript (scriptPath,arguments) {
    const pythonProcess = spawn('python', [scriptPath].concat(arguments));
    let retData = "", retError = "", parsedRetData = [];
    for await (const chunk of pythonProcess.stdout) { retData += chunk; }
    for await (const chunk of pythonProcess.stderr) { retError += chunk; }
    const exitCode = await new Promise( (resolve, reject) => { pythonProcess.on('close', resolve); });
    if( exitCode) {console.log( `subprocess error exit ${exitCode}, ${retError}`); }
    if (retData.toString('utf8'))
        parsedRetData = JSON.parse(retData.toString('utf8'));
    return parsedRetData
}
function helpCommand(arguments,command,replyChannel) {
    if (arguments.length === 0) {
        command.channel.send('I\'m not sure what you need help with. Try !Help [topic]');
        return;
    }
    replyChannel.send('It looks like you need help with: ' + arguments);
}
async function redditScrape(args,command,subredditName,receivedChannel,replyChannel) {
    if ([stoxGeneralId,omBotId,twmRedditScraperId].includes(receivedChannel)) {
        console.log('Running script to grab reddit hot topics');
        let discordEmbedObject = {
            color: 0x0099ff,
            title: 'Top 10 Hottest ' + subredditName + ' Topics',
            fields: [],
            timestamp: new Date(),
            footer: {
                text: 'Scaper still being refined',
                icon_url: 'https://i.imgur.com/wSTFkRM.png',
            }
        };
        let allTopics = await runPythonScript('redditScraper.py', [subredditName, 'hot', '50']);
        if (allTopics.length > 0) {
            let allFields = [];
            allTopics.sort((a, b) => { return b.num_comments - a.num_comments; });
            for (let i = 0; i < allTopics.length; ++i) {
                let fieldObj =
                    {
                        name: allTopics[i].title.substring(0,220) + ' --- Number of comments: ' + allTopics[i].num_comments,
                        value: allTopics[i].url,
                        inline: false,
                    };
                allFields.push(fieldObj);
            }
            discordEmbedObject.fields = allFields.slice(0, 10);
            replyChannel.send({embed: discordEmbedObject});
        } else { replyChannel.send("Please double check to see if this subreddit: '" + subredditName + "' exists!"); }
    }
}
async function scrapeVolume(args,command,replyChannel) {
    console.log('Running python script to scrape unusual volumes');
    let allTickers = await runPythonScript('./volumeScraper/market_scanner.py',[]);
    if (allTickers.length > 0) {
        let totalTimeScan = Math.round(Number(allTickers[allTickers.length - 1]) / 10) * 10;
        let allFields = [];
        let discordEmbedObject = {
            color: 0x0099ff,
            title: 'Tickers with Unusual Volume: ',
            fields: [],
            timestamp: new Date(),
            footer: { text: 'Time took to scan: ' + totalTimeScan.toString() + 's' }
        };
        for (let i = 0; i < allTickers.length - 1; ++i) {
            let fieldObj =
                {
                    name: 'Ticker Name: ' + allTickers[i]['Ticker'],
                    value: 'Volume: ' + allTickers[i]['TargetVolume'] + '\n Date: ' + allTickers[i]['TargetDate'],
                    inline: false,
                };
            allFields.push(fieldObj);
        }
        discordEmbedObject.fields = allFields;
        replyChannel.send({ embed: discordEmbedObject });
    }
}
function valorantCommand (args,command,replyChannel) { replyChannel.send(wardellTwitchUrl); }
