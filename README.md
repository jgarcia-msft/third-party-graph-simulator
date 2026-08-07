# Third-Party Graph Simulator

> [!WARNING]
> ***This is for internal testing only. Not for production. DO NOT ENTER CUSTOMER DATA***

A lightweight standalone website for testing a third-party app’s client-credential authentication flow and test Microsoft Graph calls for support investigations.

## Features
- Enter Tenant ID, Client ID, and Client Secret
- Acquire an app-only access token from Entra ID
- Send Graph API requests through a backend proxy
- Reuse cached tokens until expiration

## Prerequisites

- **Node.js:** Install Node.js (LTS recommended, e.g. Node 18 or later) which includes `npm`. See [How to install Node on Windows](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows) or Recommended [Download and use Node installer](https://nodejs.org/en/download)
- **Entra ID app registration:** Create an app registration in the Azure portal and configure it for client credentials (app-only) flow:
	- Note the **Tenant ID**, **Application (client) ID**, and create a **Client secret**.
	- Grant the app the necessary **Application permissions** for Microsoft Graph (for example, `User.Read.All`, `Group.Read.All`, etc.) depending on the Graph endpoints you will call.
	- Click **Grant admin consent** for the permissions you added.

**Note: After you setup and run the app there is a link for step by step instructions to setup an app in Entra.**
- **Port availability:** The server listens on port `3000` by default (override with the `PORT` environment variable).


## Setup

1. Download Zip
   
   a. Click Code

   b. Click Download ZIP

   ![github download](./public/images/github-download.png)

2. Recommneded to create a `C:\temp\` folder and then unzip the download in the temp folder.
3. Open `third-party-graph-simulator-main` folder. Inside will be another folder named the same `third-party-graph-simulator-main`. Right-Click on the folder and select **Open in Terminal**. Confirm you are in the correct folder before running the following commands. If you enter `ls` in the terminal it will return the following folders/files seen below.

![app path](./public/images/app-path.png)

4. Run `npm install`
5. Run `npm start`
   
![npm start](./public/images/npm-start.png)

6. Open web browser and go to `http://localhost:3000`
7. After the site is launched there is a link to guide you on **How to set up the app registration**

![how to set up the app registration](./public/images/how-to-set-up-app-registration.png)


## Usage

1. Enter your Tenant ID, Client ID, and Client Secret.
2. Click **Acquire Token** to fetch an access token.
3. Enter a Graph path for example `/users` or a full URL `https://graph.microsoft.com/v1.0/users`.
4. Choose an HTTP method and optionally provide JSON request body.
5. Click **Send Graph Request**.
6. When done testing to stop the server by either (Recommended) click into the terminal that servers is running then press keys `ctrl+c` or close the terminal.

> [!WARNING]
> ***This is for internal testing only. Not for production. DO NOT ENTER CUSTOMER DATA***
