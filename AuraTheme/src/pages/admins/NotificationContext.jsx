import React, { createContext, useContext, useState } from "react";
import { Alert } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    description: "",
    type: "info",
    closable: true,
  });

  const showNotification = ({
    message = "Notification",
    description = "",
    type = "info",
    closable = true,
    duration = 0,
  }) => {
    setNotification({
      visible: true,
      message,
      description,
      type,
      closable,
    });

    if (duration > 0) {
      setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
      }, duration);
    }
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {notification.visible && (
        <Alert
          message={notification.message}
          description={notification.description}
          type={notification.type}
          closable={notification.closable}
          onClose={hideNotification}
          closeIcon={<CloseCircleOutlined />}
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            maxWidth: 400,
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        />
      )}
      {children}
    </NotificationContext.Provider>
  );
};
