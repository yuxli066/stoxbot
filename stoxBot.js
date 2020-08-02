// Text Channels Category: 732733792778715316
// General Text: 732733792778715318
// Pennies Text: 732733861301190767
const discord = require('discord.js');
const client = new discord.Client();

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
    else { processMessage(received); }
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

    switch (primaryCommand) {
        case 'Help':
            return helpCommand(args, receivedCommand);
        case 'Pennies':
            return pennyStockScrape(args, receivedCommand);
        case 'Valorant':
            return valorantHelp(args,receivedCommand);
        default:
            break;
    }
}

// help command function
function helpCommand(arguments, command) {
    if (arguments.length === 0) {
        command.channel.send('I\'m not sure what you need help with. Try !Help [topic]');
        return;
    }
    command.channel.send('It looks like you need help with: ' + arguments);
}
// Penny stock command function
function pennyStockScrape(args, command) {
    console.log('scraping for hottest reddit penny stocks');
    // scraper here
}
// Valorant command function
// function valorantCommand (args, command) {
//
// }

client.login('NzMyNzI1MjgzMDI2NjMyNzY1.Xw4xmA.DGjPJ4oU8eO4QbK4rgM1e8g-tRk');
