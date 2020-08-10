// Text Channels Category: 732733792778715316
// General Text: 732733792778715318
// Pennies Text: 732733861301190767
const discord = require('discord.js');
const client = new discord.Client();
// spawn child process python
const {spawn} = require('child_process');

client.on('ready', () => {
    console.log('Connected as ' + client.user.tag);
    client.user.setActivity('Reddit', {type: 'WATCHING'});
    client.guilds.cache.forEach((guild) => {
        console.log(guild.name);
        guild.channels.cache.forEach((channel) => {
            console.log(` - Name:${channel.name} Type:${channel.type} Id:${channel.id}`);
        });
    });
    let generalTextChannel = client.channels.cache.get('732733792778715318');
    generalTextChannel.send('Hello Everyone!');
});

client.on('message',(received) => {
    if (received.author === client.user)
        return;
    if (received.content.startsWith('!')) { processCommand(received); }
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
function processCommand(receivedCommand) {
    let fullCommand = receivedCommand.content.substr(1);
    let splitCommand = fullCommand.split(' ');
    let primaryCommand = splitCommand[0];
    let args = splitCommand.slice(1);

    switch (primaryCommand.toLowerCase()) {
        case 'help':
            return helpCommand(args, receivedCommand);
        case 'valorant':
            return valorantCommand(args,receivedCommand);
        case 'volume':
            return scrapeVolume(args, receivedCommand);
        default:
            return redditScrape(args, receivedCommand, primaryCommand);
            break;
    }
}
// function runPythonScript (scriptPath) {
//
// }
// help command function
function helpCommand(arguments, command) {
    if (arguments.length === 0) {
        command.channel.send('I\'m not sure what you need help with. Try !Help [topic]');
        return;
    }
    command.channel.send('It looks like you need help with: ' + arguments);
}
// Valorant command function
function valorantCommand (args, command) {
    command.channel.send('https://www.twitch.tv/wardell');
}
// Generic scrape Reddit Function
function redditScrape(args, command, subredditName) {
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
    const pythonProcess = spawn('python', ['redditScraper.py', subredditName , 'hot', '50']);
    pythonProcess.stdout.on('data', function (data) {
        console.log('Pipe data from python script ...');
        allTopics.push(data);
        console.log(allTopics)
    });
    pythonProcess.on('close', (code) => {
        let allTopicsJson = JSON.parse(allTopics);
        let allFields = [];
        // sort by num num comments
        allTopicsJson.sort((a,b)=>{
            return b.num_comments - a.num_comments;
        });
        for (let i = 0; i < allTopicsJson.length; ++i) {
            let fieldObj =
                {
                    name: allTopicsJson[i].title + ' --- Number of comments: ' + allTopicsJson[i].num_comments,
                    value: allTopicsJson[i].url,
                    inline: false,
                };
            allFields.push(fieldObj);
        }
        discordEmbedObject.fields = allFields.slice(0,10);
        command.channel.send({ embed: discordEmbedObject });
    });
}
// Run volume scraper script
function scrapeVolume(args, command) {
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
        command.channel.send({ embed: discordEmbedObject });
    });
}

client.login('NzMyNzI1MjgzMDI2NjMyNzY1.Xw4xmA.DGjPJ4oU8eO4QbK4rgM1e8g-tRk');
