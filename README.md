<h1 align="center">
  <br>
  <a href="https://github.com/Polabiel/Quirk"><img src="https://github.com/Polabiel/Quirk/assets/40695127/c1530d65-cff8-4dbe-a0a4-3767fb88b162" alt="Quirk — Whatsapp Bot"></a>
  <br>

  Quirk
  <br>  
</h1>

<h4 align="center">Music, Moderation, Fun, and Customizable.</h4>

<p align="center">
  <a href="#overview">Overview</a>
  •
  <a href="#installation">Installation</a>
  •
  <a href="#plugins">Plugins</a>
  •
  <a href="#community">Community</a>
  •
  <a href="#license">License</a>
</p>

# Overview

Quirk is a fully modular bot - meaning all features and commands can be toggled on/off to your liking, making it fully customizable.

[Installation](#Installation) is easy, and you **DON'T** need to know anything about coding! Apart from installation and updates, all parts of the bot can be controlled via Whatsapp.

# Installation

Installation requires **node.LTS**

**Which means you can download** *the following platforms supporting Node.LTS:*

- [Windows](https://nodejs.org/pt-br/download/)
- [Termux — Android](#termux)
- [Linux](https://nodejs.org/pt-br/download/)
- [MacOS](https://nodejs.org/pt-br/download/)

## Environment Configuration

Before running Quirk, you need to configure your environment variables:

### Development Mode
For development, create a `.env.local` file in the project root:
```bash
cp .env.template .env.local
```

Then edit `.env.local` with your configuration values.

### Production Mode
For production, create a `.env.production` file in the project root:
```bash
cp .env.template .env.production
```

Then edit `.env.production` with your production configuration values.

**Important:** The bot will automatically check for these files and display helpful error messages if they're missing.

## Running the Bot

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm install
npm run start
```

If after reading the guide you still encounter issues, feel free to join the
[Official Discord Server](https://discord.gg/BgQrmc6TnC) and ask for help in the **#Support** channel.

# Community

**Quirk** is under continuous development and is supported by an active community that produces new content (functions/plugins) for everyone to enjoy. New features are constantly being added. You can join us [here](https://discord.gg/BgQrmc6TnC) in my Discord community.

# Termux

For those who have difficulty using Termux, here's a very basic tutorial.

1. Install the F-Droid app

F-Droid is a library of Android apps, similar to the Play Store. The difference is that F-Droid is exclusive to open-source apps.

- [Official F-Droid website](fdroid.org)

<a href="https://fdroid.org"><img src="https://content.invisioncic.com/v310067/monthly_2022_07/f-droid.png.9c45eb46593f3eb4276b56b7e5534118.png" alt="What is F-droid" width=300px></a>

As it's an app outside the Play Store, you may need to allow some permissions during the installation process.

2. Install Termux

Open F-Droid, search for Termux, and click install. Termux is a powerful terminal emulator and Linux environment for Android. It allows the installation of various packages (like Node.js) using the apt and pkg libraries.

3. Install Node.js

Open Termux. We'll use the apt library to install Node.js. But before that, let's update the library. Enter the following commands:

```bash
apt update
apt upgrade
```

If there's any prompt during installation, just press Enter.

To install Node.js, enter the command:

```bash
apt install nodejs
```

<a href=""><img src="https://content.invisioncic.com/v310067/monthly_2022_07/apt-nodejs.png.94906a380be23e14fc1f8e13c89820cb.png" alt="Termux Terminal" width=300px></a>

After installation, we can run Node on our Android device.

<a href=""><img src="https://content.invisioncic.com/v310067/monthly_2022_07/node-running.png.4a758f1bb384e6c748c9ca14af7458ae.png" alt="Termux Terminal" width=300px></a>

Then just start by typing the command
```bash
npm i && npm run build && npm run start
```

- [Credits](https://forum.casadodesenvolvedor.com.br/topic/44722-como-emular-um-terminal-linux-e-instalar-o-nodejs-no-android/)

## License

The creation of [Quirk](https://github.com/Polabiel/Quirk/) was done by [Gabriel Oliveira](https://github.com/Polabiel/), if you wish to use the project, please leave the credits.
[MIT](https://github.com/Polabiel/Quirk/blob/main/LICENSE)
