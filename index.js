// worker.js - Cloudflare Workers compatible Discord bot

import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';

// Cloudflare Workers environment variables are accessed differently
const TOKEN = DISCORD_BOT_TOKEN; // Set in your Cloudflare dashboard
const STAFF_CHANNEL_ID = STAFF_CHANNEL_ID; // Set in your Cloudflare dashboard
const ALLOWED_STAFF_ROLE = STAFF_ROLE_ID; // Set in your Cloudflare dashboard

// Create a scheduled handler to keep your bot alive
export default {
  async scheduled(event, env, ctx) {
    // Create and initialize the Discord client
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ],
      partials: [Partials.Channel]
    });

    // Set up event handlers
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
        const qnaChannel = interaction.channel;

        qnaChannel.send(`**Q:** ${question}\n**A:** *(Pending answer from staff...)*`);
        interaction.reply({ content: '✅ Question posted!', ephemeral: true });
      }
    });

    // Login and wait for a reasonable time to handle events
    await client.login(TOKEN);
    
    // Keep the worker running for a while to process events
    await new Promise(resolve => setTimeout(resolve, 50000));
    
    // Properly destroy the client when done
    client.destroy();
  },

  // Also add an HTTP handler to respond to health checks
  async fetch(request, env, ctx) {
    return new Response('Discord bot is running!', { status: 200 });
  }
};
