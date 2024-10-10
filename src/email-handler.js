const { ipcRenderer } = require("electron");

document.addEventListener("keydown", (event) => {
   if (event.key === "Enter") {
      // Check if the pressed key is 'Enter'
      const saveButton = document.getElementById("saveButton");
      if (saveButton) {
         saveButton.click(); // Trigger the click event on the button
      }
   }
});

document.getElementById("saveButton").addEventListener("click", () => {
   const emailInput = document.getElementById("emailInput").value;

   // Split input by comma and trim spaces
   const emails = emailInput.split(",").map((email) => email.trim());

   // Check if the input is empty
   if (emails.length === 0 || emails[0] === "") {
      document.getElementById("errorMessage").style.display = "block";
      return;
   }

   // Hide the error message if input is valid
   document.getElementById("errorMessage").style.display = "none";

   // Send emails to the main process
   ipcRenderer.send("save-emails", emails);
});
