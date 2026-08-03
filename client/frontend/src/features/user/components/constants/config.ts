const LayoutConfig = {
  layout: "w-full h-screen lg:grid lg:grid-cols-[320px_1fr]",
};

type LayoutContentType = "Edit_Profile" | "Account_Management" | "Notifications";
const LayoutContent: LayoutContentType[] = ["Edit_Profile", "Account_Management", "Notifications"];

const LayoutContentMap: Record<LayoutContentType, string> = {
  "Edit_Profile": "/user/settings/edit-profile",
  "Account_Management": "/user/settings/account-management",
  "Notifications": "/user/settings/notifications",
};

export { LayoutConfig, LayoutContent, LayoutContentMap };
