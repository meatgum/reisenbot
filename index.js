const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

const STAFF_CHANNEL_ID = 'YOUR_STAFF_CHANNEL_ID'; // Change this to your staff-only channel
const ALLOWED_STAFF_ROLE = 'YOUR_STAFF_ROLE_ID'; // Optional: Limit posting to specific staff roles

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.channel.type === 1 && !message.author.bot) { // 1 = DM Channel
        const question = message.content;
        const staffChannel = await client.channels.fetch(STAFF_CHANNEL_ID);
        
        if (staffChannel) {
            staffChannel.send(`📩 **New Anonymous Question:**\n${question}\n\nStaff can approve with: \`/post <question>\``);
            message.reply('✅ Your question has been submitted to the staff.');
        } else {
            message.reply('❌ Error submitting your question. Please try again later.');
        }
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'post') {
        if (!interaction.member.roles.cache.has(ALLOWED_STAFF_ROLE)) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }
        
        const question = interaction.options.getString('question');
        const qnaChannel = interaction.channel; // Change this if you want a separate Q&A channel

        qnaChannel.send(`**Q:** ${question}\n**A:** *(Pending answer from staff...)*`);
        interaction.reply({ content: '✅ Question posted!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
