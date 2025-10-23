import { general } from "../../configuration/general";
import { ICommand } from "../../interfaces/ICommand";
import { getOllamaResults } from "../../services/gpt";

const command: ICommand = {
  name: "piada",
  description: "Conte uma piada engraçada e curta para o grupo.",
  commands: [],
  usage: ``,
  handle: async ({ sendLogOwner, bot, remoteJid }) => {
    try {
      const iaResponse = await getOllamaResults(
        "Conte uma piada engraçada e curta para um grupo de WhatsApp. Responda apenas com a piada, sem explicações ou comentários extras.",
        general.NUMBERS_HOSTS.includes(remoteJid!) || general.GROUP_SECURE.includes(remoteJid!),
        undefined,
        remoteJid!
      );
      if (!iaResponse || iaResponse.length < 5) {
        return;
      }
      await bot.sendMessage(remoteJid!, {
        text: `😄 Piada do grupo:\n\n${iaResponse}`
      });
    } catch (err: any) {
      await sendLogOwner("❌ Erro ao gerar piada pela IA: " + (err.message || err));
    }
  },
};

export default command;
