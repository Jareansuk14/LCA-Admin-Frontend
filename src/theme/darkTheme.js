export const darkTheme = {
  token: {
    // Primary colors
    colorPrimary: '#ffffff',
    colorPrimaryHover: '#f0f0f0',
    colorPrimaryActive: '#d9d9d9',
    
    // Background colors
    colorBgBase: '#000000',
    colorBgContainer: '#000000',
    colorBgElevated: '#1a1a1a',
    colorBgLayout: '#000000',
    colorBgSpotlight: '#262626',
    colorBgMask: 'rgba(0, 0, 0, 0.45)',
    
    // Border colors
    colorBorder: '#333333',
    colorBorderSecondary: '#262626',
    
    // Text colors
    colorText: '#ffffff',
    colorTextSecondary: '#bfbfbf',
    colorTextTertiary: '#8c8c8c',
    colorTextQuaternary: '#595959',
    colorTextDescription: '#8c8c8c',
    colorTextDisabled: '#434343',
    colorTextHeading: '#ffffff',
    colorTextLabel: '#ffffff',
    colorTextPlaceholder: '#595959',
    
    // Component specific
    colorFill: '#262626',
    colorFillSecondary: '#1f1f1f',
    colorFillTertiary: '#1a1a1a',
    colorFillQuaternary: '#141414',
    
    // Success, Warning, Error colors (keeping them visible)
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // Font
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    
    // Border radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    
    // Box shadow (minimal for dark theme)
    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.05)',
    boxShadowSecondary: '0 4px 12px rgba(255, 255, 255, 0.05)',
    
    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  
  components: {
    // Layout
    Layout: {
      bodyBg: '#000000',
      headerBg: '#000000',
      siderBg: '#000000',
      footerBg: '#000000',
      headerHeight: 64,
      headerPadding: '0 24px',
      siderWidth: 200,
      triggerBg: '#262626',
      triggerColor: '#ffffff',
    },
    
    // Menu
    Menu: {
      itemBg: 'transparent',
      itemColor: '#ffffff',
      itemHoverBg: '#262626',
      itemHoverColor: '#ffffff',
      itemSelectedBg: '#333333',
      itemSelectedColor: '#ffffff',
      itemActiveBg: '#1a1a1a',
      subMenuItemBg: 'transparent',
      groupTitleColor: '#8c8c8c',
      iconSize: 16,
      collapsedIconSize: 16,
    },
    
    // Button
    Button: {
      primaryColor: '#000000',
      primaryBg: '#ffffff',
      primaryBorderColor: '#ffffff',
      defaultColor: '#ffffff',
      defaultBg: 'transparent',
      defaultBorderColor: '#333333',
      ghostColor: '#ffffff',
      ghostBg: 'transparent',
      ghostBorderColor: '#333333',
      dangerColor: '#ffffff',
      dangerBg: '#ff4d4f',
      dangerBorderColor: '#ff4d4f',
    },
    
    // Input
    Input: {
      colorBgContainer: '#1a1a1a',
      colorBorder: '#333333',
      colorText: '#ffffff',
      colorTextPlaceholder: '#595959',
      activeBorderColor: '#ffffff',
      hoverBorderColor: '#595959',
      activeShadow: '0 0 0 2px rgba(255, 255, 255, 0.1)',
    },
    
    // Table
    Table: {
      headerBg: '#1a1a1a',
      headerColor: '#ffffff',
      rowHoverBg: '#262626',
      borderColor: '#333333',
      headerBorderRadius: 0,
    },
    
    // Modal
    Modal: {
      contentBg: '#1a1a1a',
      headerBg: '#1a1a1a',
      titleColor: '#ffffff',
      footerBg: '#1a1a1a',
    },
    
    // Form
    Form: {
      labelColor: '#ffffff',
      itemMarginBottom: 24,
    },
    
    // Select
    Select: {
      colorBgContainer: '#1a1a1a',
      colorBorder: '#333333',
      colorText: '#ffffff',
      optionSelectedBg: '#333333',
      optionActiveBg: '#262626',
      selectorBg: '#1a1a1a',
    },
    
    // Card
    Card: {
      colorBgContainer: '#111111',
      colorBorderSecondary: '#333333',
    },
    
    // Notification
    Notification: {
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
      colorTextHeading: '#ffffff',
    },
    
    // Message
    Message: {
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
    },
  }
};
