const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  REST,
  Routes
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🔹 REGISTER GLOBAL COMMANDS (works in ALL servers)
const commands = [
  new SlashCommandBuilder()
    .setName('szazalek')
    .setDescription('Százalék számolása'),

  new SlashCommandBuilder()
    .setName('eladas')
    .setDescription('Eladás számontartása'),
  
  new SlashCommandBuilder()
  .setName('tarolo')
  .setDescription('Tároló számontartása')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registering global commands...");
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("Commands registered globally!");
  } catch (err) {
    console.error(err);
  }
})();

// 🔹 READY
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// 🔹 INTERACTIONS
client.on(Events.InteractionCreate, async interaction => {

  if (interaction.isChatInputCommand()) {

    // ===== /percentage =====
    if (interaction.commandName === 'szazalek') {

      const modal = new ModalBuilder()
        .setCustomId('percentage_modal')
        .setTitle('Százalék');

      const numberInput = new TextInputBuilder()
        .setCustomId('number')
        .setLabel('Szám')
        .setStyle(TextInputStyle.Short);

      const percentInput = new TextInputBuilder()
        .setCustomId('percent')
        .setLabel('Százalék')
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(numberInput),
        new ActionRowBuilder().addComponents(percentInput)
      );

      await interaction.showModal(modal);
    }

    // ===== /sell =====
    if (interaction.commandName === 'eladas') {

      const modal = new ModalBuilder()
        .setCustomId('sell_modal')
        .setTitle('Eladás');

      const nameInput = new TextInputBuilder()
        .setCustomId('name')
        .setLabel('Név')
        .setStyle(TextInputStyle.Short);

      const objectInput = new TextInputBuilder()
        .setCustomId('object')
        .setLabel('Tárgy')
        .setStyle(TextInputStyle.Short);

      const quantityInput = new TextInputBuilder()
        .setCustomId('quantity')
        .setLabel('Mennyiség')
        .setStyle(TextInputStyle.Short);

      const priceInput = new TextInputBuilder()
        .setCustomId('price')
        .setLabel('Ár')
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(objectInput),
        new ActionRowBuilder().addComponents(quantityInput),
        new ActionRowBuilder().addComponents(priceInput)
      );

      await interaction.showModal(modal);
    }
    
    // ===== /container =====
  
    if (interaction.commandName === 'tarolo') {

      const modal = new ModalBuilder()
        .setCustomId('container_modal')
        .setTitle('Tároló nyilvántartás');

      const nameInput = new TextInputBuilder()
        .setCustomId('name')
        .setLabel('Név')
        .setStyle(TextInputStyle.Short);

      const objectInput = new TextInputBuilder()
        .setCustomId('object')
        .setLabel('Tárgy')
        .setStyle(TextInputStyle.Short);

      const quantityInput = new TextInputBuilder()
        .setCustomId('quantity')
        .setLabel('Mennyiség')
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(objectInput),
        new ActionRowBuilder().addComponents(quantityInput)
      );

      await interaction.showModal(modal);

      // Store user temporarily (we'll ask IN/OUT next)
      client.tempContainer = client.tempContainer || {};
      client.tempContainer[interaction.user.id] = {};
    }
  }

  if (interaction.isModalSubmit()) {

    // ===== percentage result =====
    if (interaction.customId === 'percentage_modal') {

      const number = parseFloat(interaction.fields.getTextInputValue('number'));
      const percent = parseFloat(interaction.fields.getTextInputValue('percent'));

      if (isNaN(number) || isNaN(percent)) {
        return interaction.reply({
          content: '❌ Számokat adj meg!',
          ephemeral: true
        });
      }

      const result = number * (percent / 100);

      await interaction.reply({
        content: `Eredmény: ${result}`,
        ephemeral: true
      });
    }

    // ===== sell result =====
    if (interaction.customId === 'sell_modal') {

      const name = interaction.fields.getTextInputValue('name');
      const object = interaction.fields.getTextInputValue('object');
      const quantity = interaction.fields.getTextInputValue('quantity');
      const price = interaction.fields.getTextInputValue('price');

      await interaction.reply({
        content: "✅ Sikeres feljegyzés!",
        ephemeral: true
      });

      await interaction.channel.send({
        content: `🛒 Új Eladás\nNév: ${name}\nTárgy: ${object}\nMennyiség: ${quantity}\nÁr: ${price}`
      });
    }
    
    // ===== container result =====

    if (interaction.customId === 'container_modal') {

      const name = interaction.fields.getTextInputValue('name');
      const object = interaction.fields.getTextInputValue('object');
      const quantity = interaction.fields.getTextInputValue('quantity');

      // Save data temporarily
      client.tempContainer[interaction.user.id] = {
        name,
        object,
        quantity
      };

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('container_type')
          .setPlaceholder('Kivétel vagy berakás?')
          .addOptions([
            {
              label: 'Kivét',
              value: 'Kivét'
            },
            {
              label: 'Berakás',
              value: 'Berakás'
            }
          ])
      );

      await interaction.reply({
        content: "Válassz:",
        components: [row],
        ephemeral: true
      });
    }
  }
  
  if (interaction.isStringSelectMenu()) {

  if (interaction.customId === 'container_type') {

    const type = interaction.values[0];
    const data = client.tempContainer[interaction.user.id];

    if (!data) {
      return interaction.reply({
        content: "❌ Sikertelen feljegyzés!",
        ephemeral: true
      });
    }

    await interaction.update({
      content: "✅ Sikeres feljegyzés!",
      components: []
    });

    await interaction.channel.send({
      content:
        `📦 Tároló - ${type}\n` +
        `Név: ${data.name}\n` +
        `Tárgy: ${data.object}\n` +
        `Mennyiség: ${data.quantity}`
    });

    delete client.tempContainer[interaction.user.id];
  }
}
  

  
});

client.login(TOKEN);
