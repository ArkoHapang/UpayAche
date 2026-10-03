"use client";

import React from "react";
import AIChatWidget, { AIChatWidgetProps } from "./AIChatWidget";

export const CustomerChatWidget: React.FC<AIChatWidgetProps> = (props) => {
  return <AIChatWidget {...props} />;
};

export default CustomerChatWidget;
