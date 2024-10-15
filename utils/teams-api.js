require("dotenv").config();
const axios = require("axios");
const msal = require("@azure/msal-node");
client_Id = process.env.CLIENT_ID;
tenant_id = process.env.TENANT_ID;
client_secret = process.env.CLIENT_SECRET;

let accessToken = null;
let tokenExpiresAt = null;

const presenceState = {};

// MSAL configuration
const msalConfig = {
   auth: {
      clientId: client_Id,
      authority: `https://login.microsoftonline.com/${tenant_id}`,
      clientSecret: client_secret,
   },
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

async function getAccessToken() {
   if (accessToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
      return accessToken;
   }

   const authResponse = await cca.acquireTokenByClientCredential({
      scopes: ["https://graph.microsoft.com/.default"],
   });

   accessToken = authResponse.accessToken;
   tokenExpiresAt = authResponse.expiresOn;

   return accessToken;
}

async function getUserPresence(userId) {
   try {
      const token = await getAccessToken();
      const response = await axios.get(
         `https://graph.microsoft.com/v1.0/users/${userId}/presence`,
         {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         }
      );
      if (response.data.availability === "Available") {
         presenceState[userId] = new Date().toLocaleTimeString();
      }
      response.data.lastAvailableDateTime = presenceState[userId];
      return response.data;
   } catch (error) {
      console.error(`Error fetching user presence: ${error.message}`);
      return { availability: "N/A", activity: "N/A" };
   }
}

async function getUserIdFromMail(email) {
   try {
      const token = await getAccessToken();
      const response = await axios.get(
         `https://graph.microsoft.com/v1.0/users?$filter=mail eq '${email}'`,
         {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         }
      );

      if (response.data.value.length === 0) {
         console.warn(`No user found with email: ${email}`);
         return { id: "N/A", name: "N/A" };
      }

      return {
         id: response.data.value[0].id,
         name: response.data.value[0].displayName,
      };
   } catch (error) {
      console.error(`Error fetching user ID from email: ${error.message}`);
      return { id: "N/A", name: "N/A" };
   }
}

module.exports = {
   getUserPresence,
   getUserIdFromMail,
};
