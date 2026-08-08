import SettingsLayout from "@/features/settings/components/layout";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
