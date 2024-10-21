const { ipcRenderer } = require("electron");
const getImage = require("../utils/image-mapper");

// Wait until the DOM is fully loaded
window.addEventListener("DOMContentLoaded", () => {
   console.log("DOM fully loaded and parsed");

   // Listen for 'presence' event from the main process
   ipcRenderer.on("presence", (event, userPresenceData) => {
      const presenceList = document.getElementById("presence-list");

      // Clear any existing content in the list
      presenceList.innerHTML = "";

      if (userPresenceData === "No Internet") {
         const noInternetMessage = document.createElement("div");
         noInternetMessage.textContent = "No Internet Connection";
         noInternetMessage.style.fontSize = "20px"; // Make the text bigger
         noInternetMessage.style.color = "red"; // Optionally, change the text color
         noInternetMessage.style.textAlign = "center";
         presenceList.appendChild(noInternetMessage);
      } else {
         // Loop through the presences and display them
         userPresenceData.forEach((userPresence) => {
            const listItem = document.createElement("li");

            // Ensure the presence object has the necessary properties
            const presence = userPresence.presence || {};
            const availability = presence.availability || "Unknown";
            const activity = presence.activity || "Unknown";

            // Get the user name
            const userName = userPresence.displayName || "Unknown User";

            // Create an image element for availability
            const statusIcon = document.createElement("img");

            statusIcon.src = getImage(activity); // Get the image based on activity
            // Optionally set a width/height for the image if necessary
            statusIcon.style.width = "12px"; // You can adjust this size
            statusIcon.style.height = "12px";

            // Add text content for the user's presence information
            if (availability !== "Available") {
               listItem.textContent = `${userName}: ${activity} | Last seen: ${
                  presence.lastAvailableDateTime || "N/A"
               }`;
            } else {
               listItem.textContent = `${userName}: ${activity}`;
            }

            // Append the image before the text
            listItem.prepend(statusIcon);

            // Append the list item to the presence list
            presenceList.appendChild(listItem);
         });
      }

      const timestamp = new Date().toLocaleTimeString();
      const timestampElement = document.getElementById("timestamp");
      timestampElement.textContent = `Last updated: ${timestamp}`;
   });
});
