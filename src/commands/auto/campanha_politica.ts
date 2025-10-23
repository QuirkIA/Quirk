import { general } from "../../configuration/general";
import { ICommand } from "../../interfaces/ICommand";
import { getOllamaResults } from "../../services/gpt";

const command: ICommand = {
  name: "campanha",
  description: "Crie uma campanha política fictícia e divertida para o grupo.",
  commands: [],
  usage: ``,
  handle: async ({ sendLogOwner, bot, remoteJid }) => {
    try {
      const iaResponse = await getOllamaResults(
        "Crie uma campanha política fictícia e divertida para um grupo de WhatsApp. Responda estritamente no formato: Slogan | Proposta principal | Chamada para ação. Não inclua explicações, comentários ou textos extras. Apenas a campanha, curta e engraçada.",
        general.NUMBERS_HOSTS.includes(remoteJid!) || general.GROUP_SECURE.includes(remoteJid!),
        undefined,
        remoteJid!
      );
      const [slogan, proposta, chamada] = iaResponse.split("|").map((s) => s.trim());
      if (!slogan || !proposta || !chamada) {
        return;
      }
      await bot.sendMessage(remoteJid!, {
        text: `🗳️ Campanha Política Fictícia 🗳️\n\nSlogan: ${slogan}\nProposta: ${proposta}\nChamada: ${chamada}`
      });
    } catch (err: any) {
      await sendLogOwner("❌ Erro ao gerar campanha pela IA: " + (err.message || err));
    }
  },
};

export default command;
