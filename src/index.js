const { app, BrowserWindow, ipcMain } = require("electron");
const { getUserPresence, getUserIdFromMail } = require("../utils/teams-api");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

let mainWindow;
let transparentWindow;
let store; // Declare store variable

// Check for single instance lock
const gotTheLock = app.requestSingleInstanceLock();

autoUpdater.on("update-downloaded", () => {
   log.info("Update downloaded, restarting the app...");
   autoUpdater.quitAndInstall();
});

autoUpdater.on("checking-for-update", () => {
   log.info("Checking for updates...");
});

autoUpdater.on("update-available", () => {
   log.info("Update available, downloading...");
});

autoUpdater.on("update-not-available", () => {
   log.info("No updates available.");
});

autoUpdater.on("download-progress", (progress) => {
   log.info("Download progress:", progress.percent);
});

if (!gotTheLock) {
   // If the lock is not acquired, quit the app
   app.quit();
} else {
   // If the lock is acquired, set up the event listener for second instances
   app.on("second-instance", (event, commandLine, workingDirectory) => {
      // When another instance tries to run, this event will be triggered
      // Focus the existing main window if it exists
      if (mainWindow) {
         if (mainWindow.isMinimized()) mainWindow.restore();
         mainWindow.focus();
      }
   });

   app.on("ready", async () => {
      // Check for updates when the app is ready
      autoUpdater.checkForUpdatesAndNotify();

      // Dynamically import electron-store (ESM)
      const Store = (await import("electron-store")).default;
      store = new Store(); // Initialize the store

      // Check if emails are already stored
      let emails = store.get("emails")?.slice(0, 7);

      if (!emails || emails.length === 0) {
         // If no emails are stored, load the email input form
         mainWindow = createWindow(450, 300); // Default size for email-input.html
         mainWindow.loadFile("src/email-input.html");
      } else {
         // If emails exist, load the presence tracking UI
         loadPresenceTracking(emails);
      }

      ipcMain.on("save-emails", (event, userEmails) => {
         // Save emails to the store
         const limitedEmails = userEmails.slice(0, 7);
         store.set("emails", limitedEmails);
         emails = limitedEmails;
         // Load the presence tracking UI
         loadPresenceTracking(emails);
      });
   });

   // Auto-Updater Event Listeners
   autoUpdater.on("update-available", () => {
      console.log("Update available. Downloading...");
   });

   autoUpdater.on("update-downloaded", () => {
      console.log("Update downloaded. Will install now.");
      autoUpdater.quitAndInstall(); // Automatically quit and install the update
   });

   autoUpdater.on("error", (error) => {
      console.error("Error during update:", error);
   });

   // Function to create a BrowserWindow with specific width and height
   function createWindow(width, height) {
      return new BrowserWindow({
         width: width,
         height: height,
         roundedCorners: true,
         webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Required for ipcRenderer
         },
         alwaysOnTop: true,
         autoHideMenuBar: true,
         maximizable: false,
         minimizable: false,
      });
   }

   function createTransparentWindow(width, height) {
      const display = require("electron").screen.getPrimaryDisplay();
      const bounds = display.bounds;

      // Calculate the position for bottom right corner
      const startX = bounds.width - width; // Adjust this value to change the width
      const startY = bounds.height - height - 40; // Adjust this value to change the height
      return new BrowserWindow({
         x: startX,
         y: startY,
         width: width,
         height: height,
         transparent: true,
         frame: false,
         roundedCorners: true,
         webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Required for ipcRenderer
         },
         alwaysOnTop: true,
         autoHideMenuBar: true,
         maximizable: false,
         minimizable: false,
         closable: false,
      });
   }

   function loadPresenceTracking(emails) {
      // Update window size for index.html
      if (mainWindow) {
         mainWindow.close();
      }
      transparentWindow = createTransparentWindow(450, emails.length * 10 + 66);
      // Load the main UI for tracking presence
      transparentWindow.loadFile("src/index.html");

      const fetchAndSendPresence = async () => {
         try {
            const users = await Promise.all(
               emails.map((email) => getUserIdFromMail(email))
            );
            const presences = await Promise.all(
               users.map((user) => getUserPresence(user.id))
            );

            const userPresenceData = users.map((user, index) => ({
               displayName: user.name,
               presence: presences[index],
            }));

            // Log and send combined data (displayName + presence)
            // console.log(userPresenceData); debugging
            transparentWindow.webContents.send("presence", userPresenceData);
         } catch (error) {
            console.error("Error fetching presence data:", error);
         }
      };

      async function checkInternetConnection() {
         try {
            const response = await fetch("https://www.google.com/", {
               method: "HEAD",
               mode: "no-cors",
            });
            // If we get here, it means the fetch was successful
            return true;
         } catch (error) {
            // An error occurred, indicating no connection
            return false;
         }
      }

      const updatePresenceBasedOnConnection = async () => {
         const online = await checkInternetConnection();
         if (!online) {
            transparentWindow.webContents.send("presence", "No Internet");
         } else {
            fetchAndSendPresence();
         }
      };

      // Fetch presence data immediately on load
      updatePresenceBasedOnConnection();

      // Set interval to fetch and send presence data every 30 seconds
      setInterval(updatePresenceBasedOnConnection, 30000);
   }
}
