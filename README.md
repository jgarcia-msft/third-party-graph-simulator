# Third-Party Graph Simulator

> [!WARNING]
> ***This is for internal testing only. Not for production.***

A lightweight standalone website for testing a third-party app’s client-credential authentication flow and test Microsoft Graph calls for support investigations.

## Features
- Enter Tenant ID, Client ID, and Client Secret
- Acquire an app-only access token from Entra ID
- Send Graph API requests through a backend proxy
- Reuse cached tokens until expiration

## Prerequisites

- **Node.js:** Install Node.js (LTS recommended, e.g. Node 18 or later) which includes `npm`. See [How to install Node on Windows](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows)
- **Entra ID app registration:** Create an app registration in the Azure portal and configure it for client credentials (app-only) flow:
	- Note the **Tenant ID**, **Application (client) ID**, and create a **Client secret**.
	- Grant the app the necessary **Application permissions** for Microsoft Graph (for example, `User.Read.All`, `Group.Read.All`, etc.) depending on the Graph endpoints you will call.
	- Click **Grant admin consent** for the permissions you added.
- **Port availability:** The server listens on port `3000` by default (override with the `PORT` environment variable).


## Setup

1. Open a terminal in `third-party-graph-simulator`
2. Run `npm install`
3. Run `npm start`
4. Open `http://localhost:3000`


## Usage

1. Enter your Entra ID Tenant ID, Client ID, and Client Secret.
2. Click **Acquire Token** to fetch an access token.
3. Enter a Graph path such as `/users` or a full URL.
4. Choose an HTTP method and optionally provide JSON request body.
5. Click **Send Graph Request**.

> [!WARNING]
> ***This is for internal testing only. Not for production.***
