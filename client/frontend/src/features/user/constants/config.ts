export const LayoutConfig = {
  layout: "w-full h-screen flex flex-col lg:flex-row bg-theme-grey-lg/15",
};

export const LayoutContent = [
  {
    name: "Edit Profile",
    value: "edit-profile",
    route: "/user/settings/edit-profile",
  },
  {
    name: "Account Management",
    value: "account-management",
    route: "/user/settings/account-settings",
  },
  {
    name: "Notifications",
    value: "notifications",
    route: "/user/settings/notifications",
  },
];
