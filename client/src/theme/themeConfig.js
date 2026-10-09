import { theme } from "antd";

export const brandColors = {
  primary: "#52c41a", // 1st: Green
  primaryDark: "#2e7d32",
  secondary: "#141414", // 2nd: Black
  secondaryDark: "#001529",
  tertiary: "#ffffff", // 3rd: White
  tertiaryBg: "#f8fafc",
  quaternary: "#fa8c16", // 4th: Orange
  quaternaryDark: "#ff7a00",
};

export function getThemeConfig(mode = "light", largeText = false) {
  const isDark = mode === "dark";

  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: brandColors.primary,
      colorSuccess: brandColors.primary,
      colorWarning: brandColors.quaternary,
      colorError: "#ff4d4f",
      colorInfo: brandColors.primary,
      colorLink: brandColors.primary,
      colorTextBase: isDark ? "#f1f5f9" : brandColors.secondary,
      colorBgBase: isDark ? "#0f172a" : "#ffffff",
      colorBgContainer: isDark ? "#1e293b" : brandColors.tertiary,
      colorBgLayout: isDark ? "#0f172a" : "#f4f6f9",
      borderRadius: 12,
      borderRadiusLG: 16,
      borderRadiusSM: 8,
      fontSize: largeText ? 16 : 14,
      fontFamily: `"Google Sans", sans-serif`,
      wireframe: false,
    },
    components: {
      Layout: {
        siderBg: isDark ? "#0b0f19" : brandColors.secondary,
        headerBg: isDark ? "#1e293b" : brandColors.tertiary,
        bodyBg: isDark ? "#0f172a" : "#f4f6f9",
        headerHeight: 70,
        headerPadding: "0 24px",
      },
      Menu: {
        darkItemBg: isDark ? "#0b0f19" : brandColors.secondary,
        darkItemSelectedBg: brandColors.primary,
        darkItemSelectedColor: "#ffffff",
        darkItemColor: "#94a3b8",
        darkItemHoverBg: "rgba(255, 255, 255, 0.08)",
        darkItemHoverColor: "#ffffff",
        itemBorderRadius: 10,
        itemMarginInline: 8,
      },
      Button: {
        borderRadius: 10,
        controlHeight: 40,
        controlHeightLG: 46,
        controlHeightSM: 32,
        fontWeight: 700,
        primaryShadow: "0 2px 0 rgba(0, 0, 0, 0.045)",
      },
      Card: {
        borderRadiusLG: 16,
        colorBgContainer: isDark ? "#1e293b" : brandColors.tertiary,
        boxShadowTertiary: isDark
          ? "0 4px 20px 0 rgba(0, 0, 0, 0.4)"
          : "0 4px 20px 0 rgba(0, 0, 0, 0.05)",
      },
      Table: {
        borderRadius: 12,
        headerBg: isDark ? "#1e293b" : "#f8fafc",
        headerColor: isDark ? "#e2e8f0" : brandColors.secondary,
      },
      Segmented: {
        borderRadius: 10,
        itemSelectedBg: isDark ? "#334155" : brandColors.tertiary,
        itemSelectedColor: isDark ? "#ffffff" : brandColors.secondary,
        trackBg: isDark ? "#1e293b" : "#e2e8f0",
      },
      Modal: {
        borderRadiusLG: 18,
      },
      Progress: {
        defaultColor: brandColors.primary,
      },
      Rate: {
        starColor: brandColors.quaternary,
      },
      Tag: {
        borderRadiusSM: 6,
      },
      Input: {
        borderRadius: 10,
        controlHeight: 42,
      },
      Select: {
        borderRadius: 10,
        controlHeight: 42,
      },
    },
  };
}

export default getThemeConfig;
