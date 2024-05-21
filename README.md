# NASync-AlbumSearch-Alfred

> ONLY TESTED FOR PERSONAL USE!

## Hardware

- UGREEN NASync DXP4800 Plus

![demo](https://raw.githubusercontent.com/ansonhe97/NASync-AlbumSearch-Alfred/master/assets/nasync.gif)

## Set-up

**Recommended for use only on LAN networks**

1. Install the `NASync-AlbumSearch-Alfred.alfredworkflow`

2. Navigate to the root directory of this alfred workflow and run in terminal to install dependencies:

```sh
$ npm install 
```

3. Create `.env` file under the same directory:

```s
IP={Your NASync IP}
PORT={Your NASync Web Portal IP}
TOKEN={Your NASync API Token}
```

- NASync API Token can be parsed using Chrome Developer tools.

> NASync API token will be re-generated on every new login, therefore ensure auto-login is checked from web login portal.
