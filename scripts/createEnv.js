const fs = require('fs');

fs.writeFileSync('./.env',
    `redditClientId=${process.env.redditClientId}\n
     redditClientSecret=${process.env.redditClientSecret}\n
     redditUserAgent=${process.env.redditUserAgent}\n
     redditUsername=${process.env.redditUsername}\n
     redditPassword=${process.env.redditPassword}\n
     discordAPIKey=${process.env.discordAPIKey}\n
     stoxGeneralId=${process.env.stoxGeneralId}\n
     omBotId=${process.env.omBotId}\n
     twmRedditScraperId=${process.env.twmRedditScraperId}\n
     twmInsiderStoxBotId=${process.env.twmInsiderStoxBotId}\n
     twmValorantId=${process.env.twmValorantId}\n
     wardellTwitchUrl=${process.env.wardellTwitchUrl}\n`)
