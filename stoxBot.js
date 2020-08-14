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
    else {
        if (received.content.includes('@stoxBot')) { processMessage(received); }
    }
});

// function to process messages
function processMessage(message) {
    message.channel.send('I got your message, ' + message.author.toString() + ', I\'m just not sure what to say yet.');
    message.react('🙂');
}

// function to process commands
function processCommand(receivedCommand,receivedChannel,replyChannel) {
    let fullCommand = receivedCommand.content.substr(1);
    let splitCommand = fullCommand.split(' ');
    let primaryCommand = splitCommand[0].toLowerCase();
    let args = splitCommand.slice(1);
    console.log('Running Command:',primaryCommand);
    switch (true) {
        case (primaryCommand === 'help' && [stoxGeneralId,omBotId].includes(receivedChannel)):
            return helpCommand(args, receivedCommand,replyChannel);
        case (primaryCommand === 'valorant' && [stoxGeneralId,omBotId,twmValorantId].includes(receivedChannel)):
            return valorantCommand(args,receivedCommand,replyChannel);
        case (primaryCommand === 'volume' && [stoxGeneralId,omBotId,twmInsiderStoxBotId].includes(receivedChannel)):
            return scrapeVolume(args, receivedCommand,replyChannel);
        default:
            return redditScrape(args, receivedCommand, primaryCommand,receivedChannel,replyChannel);
    }
}
// function runPythonScript (scriptPath) {
// }
// help command function
function helpCommand(arguments,command,replyChannel) {
    if (arguments.length === 0) {
        command.channel.send('I\'m not sure what you need help with. Try !Help [topic]');
        return;
    }
    replyChannel.send('It looks like you need help with: ' + arguments);
}
// Generic scrape Reddit Function
function redditScrape(args,command,subredditName,receivedChannel,replyChannel) {
    if ([stoxGeneralId,omBotId,twmRedditScraperId].includes(receivedChannel)) {
        console.log('scraping for hottest reddit penny stock posts sorted by number of comments');
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
        var allTopics = [];
        const pythonProcess = spawn('python', ['redditScraper.py', subredditName, 'hot', '50']);
        pythonProcess.stdout.on('data', function (data) {
            console.log('Running script to grab reddit hot topics');
            allTopics.push(data);
            console.log('All Topics:',allTopics);
        });
        pythonProcess.stderr.on('data', function (data) {
            console.log('stderr: ' + data.toString());
        });
        pythonProcess.on('close', (code) => {
            if (allTopics.length > 0) {
                let allTopicsJson = JSON.parse(allTopics);
                let allFields = [];
                allTopicsJson.sort((a, b) => {
                    return b.num_comments - a.num_comments;
                });
                for (let i = 0; i < allTopicsJson.length; ++i) {
                    let fieldObj =
                        {
                            name: allTopicsJson[i].title.substring(0,220) + ' --- Number of comments: ' + allTopicsJson[i].num_comments,
                            value: allTopicsJson[i].url,
                            inline: false,
                        };
                    allFields.push(fieldObj);
                }
                discordEmbedObject.fields = allFields.slice(0, 10);
                replyChannel.send({embed: discordEmbedObject});
            } else {
                replyChannel.send("Please double check to see if this subreddit exists!");
            }
        });
    }
}
// Run volume scraper script
function scrapeVolume(args,command,replyChannel) {
    console.log('Running python script to scrape unusual volumes');
    const pythonProcess = spawn('python', ['./volumeScraper/market_scanner.py']);
    let allTickers = [];
    pythonProcess.stdout.on('data', function (data) {
        console.log('Running market scanner script...');
        allTickers.push(data);
    });

    pythonProcess.stderr.on('data', function (data) {
        console.log('stderr: ' + data.toString());
    });

    pythonProcess.on('close', (code) => {
        console.log('child process exited with code ' + code.toString());
        allTickers = JSON.parse(allTickers);
        let totalTimeScan = Math.round(Number(allTickers[allTickers.length - 1]) / 10) * 10;
        let allFields = [];
        let discordEmbedObject = {
            color: 0x0099ff,
            title: 'Tickers with Unusual Volume: ',
            fields: [],
            timestamp: new Date(),
            footer: {
                text: 'Time took to scan: ' + totalTimeScan.toString() + 's'
            }
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
    });
}
// Valorant command function
function valorantCommand (args,command,replyChannel) { replyChannel.send(wardellTwitchUrl); }
