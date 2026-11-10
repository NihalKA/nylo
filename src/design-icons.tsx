import React from "react";
import { Image } from "expo-image";

// Original Figma SVG exports; their viewboxes, colours and intrinsic sizes are unchanged.
const artwork = {
  memoryBack: {
    source: require("../assets/figma/memoryBack.svg"),
    width: 10.7937,
    height: 18.3333,
  },
  chatMore: {
    source: require("../assets/figma/chatMore.svg"),
    width: 16.0,
    height: 4.0,
  },
  checkedThumb: {
    source: require("../assets/figma/checkedThumb.svg"),
    width: 24.0,
    height: 24.0,
  },
  key: {
    source: require("../assets/figma/key.svg"),
    width: 19.1667,
    height: 10.0,
  },
  chevron: {
    source: require("../assets/figma/chevron.svg"),
    width: 9.8125,
    height: 16.6667,
  },
  export: {
    source: require("../assets/figma/export.svg"),
    width: 13.3333,
    height: 13.3333,
  },
  restore: {
    source: require("../assets/figma/restore.svg"),
    width: 13.3333,
    height: 13.3333,
  },
  privacy: {
    source: require("../assets/figma/privacy.svg"),
    width: 13.3333,
    height: 16.6667,
  },
  mail: {
    source: require("../assets/figma/mail.svg"),
    width: 16.6667,
    height: 13.3333,
  },
  deviceCheck: {
    source: require("../assets/figma/deviceCheck.svg"),
    width: 16.6667,
    height: 17.5,
  },
  deleteData: {
    source: require("../assets/figma/deleteData.svg"),
    width: 13.3333,
    height: 15.0,
  },
  tabChats: {
    source: require("../assets/figma/tabChats.svg"),
    width: 20.0,
    height: 20.0,
  },
  tabAgents: {
    source: require("../assets/figma/tabAgents.svg"),
    width: 22.0,
    height: 16.0,
  },
  tabSettingsActive: {
    source: require("../assets/figma/tabSettingsActive.svg"),
    width: 18.425,
    height: 18.3333,
  },
  back: {
    source: require("../assets/figma/back.svg"),
    width: 9.8125,
    height: 16.6667,
  },
  more: {
    source: require("../assets/figma/more.svg"),
    width: 14.6667,
    height: 3.66667,
  },
  forward: {
    source: require("../assets/figma/forward.svg"),
    width: 12.0,
    height: 12.0,
  },
  options: {
    source: require("../assets/figma/options.svg"),
    width: 16.5,
    height: 16.5,
  },
  addWhite: {
    source: require("../assets/figma/addWhite.svg"),
    width: 11.6667,
    height: 11.6667,
  },
  addMuted: {
    source: require("../assets/figma/addMuted.svg"),
    width: 10.5,
    height: 10.5,
  },
  editMemory: {
    source: require("../assets/figma/editMemory.svg"),
    width: 31.0,
    height: 33.3333,
  },
  deleteMemory: {
    source: require("../assets/figma/deleteMemory.svg"),
    width: 29.3333,
    height: 35.0,
  },
  tabAgentsActive: {
    source: require("../assets/figma/tabAgentsActive.svg"),
    width: 22.0,
    height: 16.0,
  },
  tabSettings: {
    source: require("../assets/figma/tabSettings.svg"),
    width: 20.1,
    height: 20.0,
  },
  reportBack: {
    source: require("../assets/figma/reportBack.svg"),
    width: 17.8125,
    height: 28.6667,
  },
  reportMore: {
    source: require("../assets/figma/reportMore.svg"),
    width: 22.6667,
    height: 13.6667,
  },
  reportShield: {
    source: require("../assets/figma/reportShield.svg"),
    width: 12.0,
    height: 15.0,
  },
  mailWhite: {
    source: require("../assets/figma/mailWhite.svg"),
    width: 15.0,
    height: 12.0,
  },
  removeResponse: {
    source: require("../assets/figma/removeResponse.svg"),
    width: 15.0,
    height: 10.875,
  },
  fileDocument: {
    source: require("../assets/figma/fileDocument.svg"),
    width: 13.3333,
    height: 16.6667,
  },
  removeFile: {
    source: require("../assets/figma/removeFile.svg"),
    width: 13.3333,
    height: 21.3333,
  },
  addFile: {
    source: require("../assets/figma/addFile.svg"),
    width: 10.5,
    height: 10.5,
  },
  down: {
    source: require("../assets/figma/down.svg"),
    width: 8.0,
    height: 4.93333,
  },
  add: {
    source: require("../assets/figma/add.svg"),
    width: 11.6667,
    height: 11.6667,
  },
  send: {
    source: require("../assets/figma/send.svg"),
    width: 13.3333,
    height: 13.3333,
  },
  photos: {
    source: require("../assets/figma/photos.svg"),
    width: 18.3333,
    height: 18.3333,
  },
  camera: {
    source: require("../assets/figma/camera.svg"),
    width: 18.3333,
    height: 16.5,
  },
  files: {
    source: require("../assets/figma/files.svg"),
    width: 14.6667,
    height: 18.3333,
  },
  close: {
    source: require("../assets/figma/close.svg"),
    width: 11.6667,
    height: 11.6667,
  },
  search: {
    source: require("../assets/figma/search.svg"),
    width: 15.0,
    height: 15.0,
  },
  modelCheck: {
    source: require("../assets/figma/modelCheck.svg"),
    width: 13.5833,
    height: 10.0208,
  },
  pdfRobotDisabled: {
    source: require("../assets/figma/pdfRobotDisabled.svg"),
    width: 16.5,
    height: 14.25,
  },
  pdfRobot: {
    source: require("../assets/figma/pdfRobot.svg"),
    width: 16.5,
    height: 14.25,
  },
  pdfCheck: {
    source: require("../assets/figma/pdfCheck.svg"),
    width: 12.225,
    height: 9.01875,
  },
  pdfEdit: {
    source: require("../assets/figma/pdfEdit.svg"),
    width: 4.625,
    height: 7.5,
  },
} as const;

export type DesignIconName = keyof typeof artwork;

export function DesignIcon({ name }: { name: DesignIconName }) {
  const item = artwork[name];
  return (
    <Image
      source={item.source}
      style={{ width: item.width, height: item.height }}
      contentFit="contain"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
