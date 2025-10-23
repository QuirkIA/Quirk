import { general } from "../../configuration/general";
import { ICommand } from "../../interfaces/ICommand";
import { getOllamaResults } from "../../services/gpt";

const command: ICommand = {
  name: "enquete",
  description: "Crie uma enquete personalizada para o grupo.",
  commands: [],
  usage: ``,
  handle: async ({ sendLogOwner, bot, remoteJid }) => {
    try {
      const iaResponse = await getOllamaResults(
        "Gere uma enquete engraçada e aleatória para um grupo de WhatsApp. Responda estritamente no formato: Pergunta | Opção 1 | Opção 2 | ... (mínimo 2, máximo 5 opções). Não inclua explicações, comentários ou textos extras. Apenas a enquete, curta e divertida.",
        general.NUMBERS_HOSTS.includes(remoteJid!) || general.GROUP_SECURE.includes(remoteJid!),
        undefined,
        remoteJid!
      );
      const [question, ...options] = iaResponse.split("|").map((s) => s.trim());
      if (!question || options.length < 2) {
        return;
      }
      await bot.sendMessage(remoteJid!, {
        poll: {
          name: question,
          values: options,
          selectableCount: 1,
          toAnnouncementGroup: true
        }
      });
    } catch (err: any) {
      await sendLogOwner("❌ Erro ao gerar enquete pela IA: " + (err.message || err));
    }
  },
};

export default command;
