import { general } from "../../configuration/general";
import fs from "fs";
import path from "path";
import { ICommand } from "../../interfaces/ICommand";
import { InvalidParameterError } from "../../errors/InvalidParameterError";
import { downloadImage, downloadVideo } from "../../utils";
import { v4 as uuidv4 } from "uuid";
import { exec } from "child_process";

const command: ICommand = {
  name: "Sticker",
  description: "Comando para criar figurinhas",
  commands: ["sticker", "figurinha", "f", "s"],
  usage: `${general.PREFIX}sticker [f|full|p|preencher|c|corta|crop] <envie a imagem/vídeo/gif ou marque>`,
  handle: async (data) => {
    await data.sendWaitReact();

    if (!data.isImage && !data.isVideo) {
      throw new InvalidParameterError(
        "Você precisa marcar uma imagem/vídeo/gif responder a uma imagem/vídeo/gif"
      );
    }

    // Parse scaling mode from arguments
    const arg = data.args[0]?.toLowerCase();
    let scaleFilter = "scale=512:512"; // default: distort to fit
    
    // Fill mode: distort image to fill 512x512
    if (arg === "f" || arg === "full" || arg === "p" || arg === "preencher") {
      scaleFilter = "scale=512:512"; // force distort
    }
    // Crop mode: zoom and crop to fill 512x512
    else if (arg === "c" || arg === "corta" || arg === "crop") {
      scaleFilter = "scale=512:512:force_original_aspect_ratio=increase,crop=512:512";
    }

    const outputPath = path.resolve(general.TEMP_DIR, `${uuidv4()}.webp`);

    if (data.isImage) {
      const inputPath = await downloadImage(data.baileysMessage);

      exec(
        `ffmpeg -i ${inputPath} -vf ${scaleFilter} ${outputPath}`,
        async (error: any) => {
          if (error) {
            await data.sendErrorReply("Ocorreu um erro ao criar a figurinha");
            fs.unlinkSync(inputPath!);
            throw new Error(error);
          }

          await data.sendSuccessReact();

          await data.sendStickerFromFile(outputPath);

          fs.unlinkSync(inputPath!);
          fs.unlinkSync(outputPath);
        }
      );
    } else if (data.isVideo) {
      const inputPath = await downloadVideo(data.baileysMessage);
      const sizeInSeconds = 10;
      const seconds: number =
        data.baileysMessage.message?.videoMessage?.seconds! ??
        data.baileysMessage.message?.extendedTextMessage?.contextInfo
          ?.quotedMessage?.videoMessage?.seconds!;
      const haveSecondsRule = seconds <= sizeInSeconds;
      if (!haveSecondsRule) {
        fs.unlinkSync(inputPath!);
        await data.sendErrorReply(
          `O vídeo que você enviou tem mais de ${sizeInSeconds} segundos! Envie um vídeo menor!`
        );
        return;
      }
      exec(
        `ffmpeg -i ${inputPath} -y -vcodec libwebp -fs 0.99M -filter_complex "[0:v] ${scaleFilter},fps=12,pad=512:512:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse" -f webp ${outputPath}`,
        async (error: any) => {
          if (error) {
            fs.unlinkSync(inputPath!);
            throw new Error(error);
          }
          await data.sendSuccessReact();
          await data.sendStickerFromFile(outputPath);
          fs.unlinkSync(inputPath!);
          return fs.unlinkSync(outputPath);
        }
      );
    }
  },
};

export default command;
