function getImage(activity) {
   // Set the image source based on availability
   switch (activity.toLowerCase()) {
      case "available":
         return "../assets/images/presence_available.png";
      case "busy":
      case "inacall":
      case "inameeting":
      case "inaconferencecall":
         return "../assets/images/presence_busy.png";
      case "away":
      case "berightback":
      case "inactive":
      case "availableidle":
         return "../assets/images/presence_away.png";
      case "donotdisturb":
      case "presenting":
      case "focusing":
      case "urgentinterruptionsonly":
         return "../assets/images/presence_dnd.png";
      case "offline":
      case "appearoffline":
         return "../assets/images/presence_offline.png";
      default:
      case "statusunkown":
      case "presenceunknown":
         return "../assets/images/presence_unknown.png";
      case "outofoffice":
      case "offwork":
         return "../assets/images/presence_oof.png";
   }
}

module.exports = getImage;